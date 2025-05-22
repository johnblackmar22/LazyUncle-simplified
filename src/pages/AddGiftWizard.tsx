import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
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
  Spinner
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

  // Step state
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState('Birthday');
  const [date, setDate] = useState(getDefaultDate('Birthday'));
  const [amount, setAmount] = useState(50);
  const [recommendations, setRecommendations] = useState<GiftSuggestion[]>(FAKE_RECOMMENDATIONS.slice(0, 3));
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [acceptedGift, setAcceptedGift] = useState<GiftSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Occasion
  const handleOccasionNext = () => {
    setDate(getDefaultDate(occasion));
    setStep(2);
  };

  // Step 2: Date & Amount
  const handleDateAmountNext = () => {
    setStep(3);
  };

  // Step 3: Recommendations
  const handleAccept = (rec: GiftSuggestion) => {
    setAcceptedGift(rec);
    setStep(4);
  };
  const handleReject = (recId: string) => {
    setRejectedIds(ids => [...ids, recId]);
    setRecommendations(recs => {
      const idx = recs.findIndex(r => r.id === recId);
      const newRec = getRandomRecommendation([...rejectedIds, recId, ...recs.map(r => r.id)]);
      if (!newRec) return recs;
      const newRecs = [...recs];
      newRecs[idx] = newRec;
      return newRecs;
    });
  };

  // Step 4: Confirmation
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
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg="gray.100" minH="100vh">
      <Container maxW="container.sm" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">Add Gift</Heading>
          {step === 1 && (
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>Select Occasion</Heading>
              <RadioGroup value={occasion} onChange={setOccasion}>
                <HStack spacing={4}>
                  {OCCASIONS.map(opt => (
                    <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                  ))}
                </HStack>
              </RadioGroup>
              <Button mt={6} colorScheme="blue" onClick={handleOccasionNext}>
                Next
              </Button>
            </Box>
          )}
          {step === 2 && (
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>Date & Amount</Heading>
              <VStack spacing={4} align="stretch">
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
              </VStack>
              <Button mt={6} colorScheme="blue" onClick={handleDateAmountNext}>
                Next
              </Button>
            </Box>
          )}
          {step === 3 && (
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>Gift Recommendations</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {recommendations.map(rec => (
                  <Box key={rec.id} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={bgColor}>
                    <Heading as="h4" size="sm" mb={2}>{rec.name}</Heading>
                    <Text mb={2}>{rec.description}</Text>
                    <Text fontWeight="bold" mb={2}>${rec.price.toFixed(2)}</Text>
                    <HStack>
                      <Button colorScheme="blue" size="sm" onClick={() => handleAccept(rec)}>
                        Accept
                      </Button>
                      <Button colorScheme="gray" size="sm" onClick={() => handleReject(rec.id)}>
                        Reject
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}
          {step === 4 && acceptedGift && (
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor} textAlign="center">
              <Heading size="md" mb={4}>Confirm Gift</Heading>
              <Text mb={4}>You are about to add <strong>{acceptedGift.name}</strong> for <strong>{occasion}</strong> on <strong>{date}</strong> for <strong>${acceptedGift.price.toFixed(2)}</strong>.</Text>
              <Button colorScheme="green" onClick={handleConfirm} isLoading={loading}>
                Confirm & Add Gift
              </Button>
            </Box>
          )}
          {step > 1 && step < 4 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default AddGiftWizard; 