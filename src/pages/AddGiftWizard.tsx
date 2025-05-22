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
} from '@chakra-ui/react';
import { useGiftStore } from '../store/giftStore';
import type { GiftSuggestion } from '../types';

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

  // Update date when occasion changes
  const handleOccasionChange = (value: string) => {
    setOccasion(value);
    setDate(getDefaultDate(value));
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
        occasion,
        date: new Date(date),
        status: 'planned',
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
                <RadioGroup value={occasion} onChange={handleOccasionChange}>
                  <HStack spacing={4}>
                    {OCCASIONS.map(opt => (
                      <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                    ))}
                  </HStack>
                </RadioGroup>
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
                <Heading size="md" mb={2}>Gift Recommendation</Heading>
                {recommendations.length > 0 ? (
                  <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={bgColor}>
                    <Heading as="h4" size="sm" mb={2}>{recommendations[0].name}</Heading>
                    <Text mb={2}>{recommendations[0].description}</Text>
                    <Text fontWeight="bold" mb={2}>${recommendations[0].price.toFixed(2)}</Text>
                    <HStack>
                      <Button colorScheme="blue" size="sm" onClick={() => handleAccept(recommendations[0])}>
                        Accept
                      </Button>
                      <Button colorScheme="gray" size="sm" onClick={() => handleReject(recommendations[0].id)}>
                        Reject
                      </Button>
                    </HStack>
                  </Box>
                ) : (
                  <Text>No more recommendations available.</Text>
                )}
              </Box>
            </VStack>
          </Box>
          {showConfirm && acceptedGift && (
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor} textAlign="center">
              <Heading size="md" mb={4}>Confirm Gift</Heading>
              <Text mb={4}>You are about to add <strong>{acceptedGift.name}</strong> for <strong>{occasion}</strong> on <strong>{date}</strong> for <strong>${acceptedGift.price.toFixed(2)}</strong>.</Text>
              <Button colorScheme="green" onClick={handleConfirm} isLoading={loading}>
                Confirm & Add Gift
              </Button>
              <Button variant="ghost" ml={4} onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default AddGiftWizard; 