import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  RadioGroup,
  Radio,
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
} from '@chakra-ui/react';
import { useGiftStore } from '../store/giftStore';
import type { GiftSuggestion } from '../types';
import { useRecipientStore } from '../store/recipientStore';

const OCCASIONS = [
  { label: 'Birthday', value: 'Birthday' },
  { label: 'Christmas', value: 'Christmas' },
  { label: 'Anniversary', value: 'Anniversary' },
  { label: 'Other', value: 'Other' },
];

const FAKE_RECOMMENDATIONS: GiftSuggestion[] = [
  {
    id: 'fake-1',
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with high-quality sound.',
    price: 49.99,
    category: 'Electronics',
  },
  {
    id: 'fake-2',
    name: 'Personalized Mug',
    description: 'Custom mug with their name and a fun design.',
    price: 19.99,
    category: 'Home',
  },
  {
    id: 'fake-3',
    name: 'Gift Card',
    description: 'A $50 gift card to their favorite store.',
    price: 50.00,
    category: 'Gift Card',
  },
  {
    id: 'fake-4',
    name: 'Wireless Earbuds',
    description: 'Compact earbuds with noise cancellation.',
    price: 59.99,
    category: 'Electronics',
  },
  {
    id: 'fake-5',
    name: 'Coffee Sampler',
    description: 'A set of gourmet coffee blends.',
    price: 29.99,
    category: 'Food',
  },
  {
    id: 'fake-6',
    name: 'Board Game',
    description: 'A fun board game for family nights.',
    price: 34.99,
    category: 'Games',
  },
];

function getRandomRecommendation(excludeIds: string[] = []): GiftSuggestion | null {
  const available = FAKE_RECOMMENDATIONS.filter(r => !excludeIds.includes(r.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

const getDefaultDate = (occasion: string) => {
  const today = new Date();
  if (occasion === 'Birthday') return today.toISOString().split('T')[0];
  if (occasion === 'Christmas') return `${today.getFullYear()}-12-25`;
  if (occasion === 'Anniversary') return today.toISOString().split('T')[0];
  return '';
};

const AddGiftWizard: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { createGift } = useGiftStore();
  const { recipients, updateRecipient } = useRecipientStore();

  // Find the current recipient
  const recipient = recipients.find(r => r.id === recipientId);
  const [interests, setInterests] = useState<string[]>(recipient?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [recurring, setRecurring] = useState(false);

  // Form state
  const [occasion, setOccasion] = useState('Birthday');
  const [date, setDate] = useState(getDefaultDate('Birthday'));
  const [amount, setAmount] = useState(50);
  const [recommendations, setRecommendations] = useState<GiftSuggestion[]>(FAKE_RECOMMENDATIONS.slice(0, 3));
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [acceptedGift, setAcceptedGift] = useState<GiftSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentRecIdx, setCurrentRecIdx] = useState(0);
  const [otherOccasion, setOtherOccasion] = useState('');

  // Update date and reset otherOccasion when occasion changes
  const handleOccasionChange = (value: string) => {
    setOccasion(value);
    if (value === 'Birthday') setDate(getDefaultDate('Birthday'));
    else if (value === 'Christmas') setDate(getDefaultDate('Christmas'));
    else if (value === 'Anniversary') setDate('');
    else setDate('');
    setOtherOccasion('');
  };

  // Accept/Reject logic
  const handleAccept = (rec: GiftSuggestion) => {
    setAcceptedGift(rec);
    setShowConfirm(true);
  };
  const handleReject = (recId: string) => {
    setRejectedIds(ids => [...ids, recId]);
    // Find a new recommendation not already shown
    const nextRec = getRandomRecommendation([...rejectedIds, recId]);
    if (nextRec) {
      setRecommendations([nextRec]);
      setCurrentRecIdx(0);
    } else {
      setRecommendations([]);
    }
  };

  // Confirm and add gift
  const handleConfirm = async () => {
    if (!recipientId || !acceptedGift) return;
    setLoading(true);
    try {
      await createGift({
        recipientId,
        name: acceptedGift.name,
        description: acceptedGift.description,
        price: acceptedGift.price,
        category: acceptedGift.category,
        // TODO: Replace with real occasionId when available
        occasionId: occasion === 'Other' ? otherOccasion : occasion,
        date: new Date(date),
        status: 'planned',
        recurring,
      });
      toast({
        title: 'Gift added',
        description: `${acceptedGift.name} has been added as a gift!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/recipients/${recipientId}`);
    } catch (err) {
      toast({
        title: 'Error adding gift',
        description: (err as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setAcceptedGift(null);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg="gray.100" minH="100vh">
      <Container maxW="container.sm" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">Add Gift</Heading>
          <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={1}>Occasion</Text>
                <Select value={occasion} onChange={e => handleOccasionChange(e.target.value)}>
                  {OCCASIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                {occasion === 'Other' && (
                  <Input
                    mt={2}
                    placeholder="Enter occasion name"
                    value={otherOccasion}
                    onChange={e => setOtherOccasion(e.target.value)}
                    isRequired
                  />
                )}
              </Box>
              <Box>
                <Text mb={1}>Date</Text>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  isRequired
                />
              </Box>
              <Box>
                <Text mb={1}>Amount to Spend</Text>
                <NumberInput value={amount} min={1} onChange={(_, val) => setAmount(val)}>
                  <NumberInputField />
                </NumberInput>
              </Box>
              <Box>
                <Text mb={1}>Recipient Interests</Text>
                <HStack spacing={2} mb={2} flexWrap="wrap">
                  {interests.length > 0 ? interests.map((interest, idx) => (
                    <Box key={idx} px={2} py={1} bg="gray.200" borderRadius="md" display="flex" alignItems="center">
                      <Text mr={2}>{interest}</Text>
                      <Button size="xs" colorScheme="red" onClick={() => setInterests(interests.filter(i => i !== interest))}>Remove</Button>
                    </Box>
                  )) : <Text color="gray.500">No interests added yet.</Text>}
                </HStack>
                <HStack>
                  <Input
                    value={newInterest}
                    onChange={e => setNewInterest(e.target.value)}
                    placeholder="Add an interest (e.g., Cooking, Reading)"
                    size="sm"
                  />
                  <Button size="sm" colorScheme="blue" onClick={() => {
                    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
                      setInterests([...interests, newInterest.trim()]);
                      setNewInterest('');
                    }
                  }}>Add</Button>
                </HStack>
                <Button mt={2} size="xs" colorScheme="green" onClick={async () => {
                  if (recipient) await updateRecipient(recipient.id, { interests });
                  toast({ title: 'Interests updated', status: 'success', duration: 2000 });
                }}>Save Interests</Button>
              </Box>
              <Box>
                <Text mb={1}>Recurring Gift</Text>
                <HStack>
                  <input type="checkbox" id="recurring" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                  <label htmlFor="recurring">Deliver this gift every year (recurring)</label>
                </HStack>
              </Box>
            </VStack>
          </Box>
          {showConfirm && acceptedGift && (
            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} isCentered>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Confirm Gift</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text mb={4}>You are about to add <strong>{acceptedGift.name}</strong> for <strong>{occasion === 'Other' ? otherOccasion : occasion}</strong> on <strong>{date}</strong> for <strong>${acceptedGift.price.toFixed(2)}</strong>.</Text>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="green" onClick={handleConfirm} isLoading={loading}>
                    Confirm & Add Gift
                  </Button>
                  <Button variant="ghost" ml={4} onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default AddGiftWizard; 