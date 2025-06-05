import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Flex,
  Badge,
  Container,
} from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';
import { useOccasionStore } from '../store/occasionStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface RecipientData {
  name: string;
  relationship: string;
  birthdate: string;
  interests: string;
  spendingLimit: number;
  deliveryAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const SimpleOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState<RecipientData>({
    name: '',
    relationship: '',
    birthdate: '',
    interests: '',
    spendingLimit: 50,
    deliveryAddress: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  const { addRecipient } = useRecipientStore();
  const { addOccasion } = useOccasionStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const relationshipOptions = [
    'Son', 'Daughter', 'Spouse', 'Partner', 'Mother', 'Father',
    'Brother', 'Sister', 'Nephew', 'Niece', 'Friend', 'Colleague'
  ];

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1
      if (!recipient.name || !recipient.relationship) {
        toast({
          title: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: 'Please log in to continue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Create the recipient
      const newRecipient = await addRecipient({
        name: recipient.name,
        relationship: recipient.relationship,
        birthdate: recipient.birthdate,
        interests: recipient.interests.split(',').map(i => i.trim()).filter(Boolean),
        deliveryAddress: recipient.deliveryAddress,
        autoSendPreferences: {
          enabled: true,
          defaultBudget: recipient.spendingLimit,
          requireApproval: true, // Start with approval required for safety
          occasions: {},
          shippingAddress: recipient.deliveryAddress,
          paymentMethod: { type: 'creditCard' },
        },
      });

      if (newRecipient) {
        // Create birthday occasion if birthdate provided
        if (recipient.birthdate) {
          await addOccasion(newRecipient.id, {
            name: 'Birthday',
            type: 'birthday',
            date: recipient.birthdate,
            budget: recipient.spendingLimit,
            notes: 'Automatically created during onboarding',
            userId: user.id,
          });
        }

        // Create Christmas occasion
        const currentYear = new Date().getFullYear();
        const christmasDate = `${currentYear}-12-25`;
        await addOccasion(newRecipient.id, {
          name: 'Christmas',
          type: 'christmas',
          date: christmasDate,
          budget: recipient.spendingLimit,
          notes: 'Automatically created during onboarding',
          userId: user.id,
        });

        toast({
          title: 'Setup Complete!',
          description: `We'll handle gifts for ${recipient.name} automatically. You can add more recipients anytime.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast({
        title: 'Setup Failed',
        description: 'Please try again or contact support.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="2xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" color="blue.600" mb={2}>
            Set It and Forget It
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Tell us about someone special, and we'll handle the rest
          </Text>
        </Box>

        {/* Progress */}
        <HStack justify="center" spacing={4}>
          <Badge colorScheme={step >= 1 ? 'blue' : 'gray'}>1. About Them</Badge>
          <Badge colorScheme={step >= 2 ? 'blue' : 'gray'}>2. Delivery</Badge>
          <Badge colorScheme={step >= 3 ? 'blue' : 'gray'}>3. All Set!</Badge>
        </HStack>

        {/* Step 1: About the Recipient */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <Heading size="md">Tell us about them</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>What's their name?</FormLabel>
                  <Input
                    value={recipient.name}
                    onChange={(e) => setRecipient({...recipient, name: e.target.value})}
                    placeholder="e.g., Sarah, Mom, Uncle Bob"
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>What's your relationship?</FormLabel>
                  <Select
                    value={recipient.relationship}
                    onChange={(e) => setRecipient({...recipient, relationship: e.target.value})}
                    placeholder="Select relationship"
                    size="lg"
                  >
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>When's their birthday? (optional)</FormLabel>
                  <Input
                    type="date"
                    value={recipient.birthdate}
                    onChange={(e) => setRecipient({...recipient, birthdate: e.target.value})}
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>What are they into?</FormLabel>
                  <Textarea
                    value={recipient.interests}
                    onChange={(e) => setRecipient({...recipient, interests: e.target.value})}
                    placeholder="e.g., coffee, books, gardening, tech gadgets, cooking"
                    size="lg"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Separate interests with commas. This helps us pick better gifts!
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>How much should we spend per gift?</FormLabel>
                  <NumberInput
                    value={recipient.spendingLimit}
                    onChange={(_, value) => setRecipient({...recipient, spendingLimit: value || 50})}
                    min={25}
                    max={500}
                    size="lg"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    We'll stay within this budget for each gift
                  </Text>
                </FormControl>

                <Button colorScheme="blue" size="lg" onClick={handleNext}>
                  Next: Where to send gifts
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Step 2: Delivery Address */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <Heading size="md">Where should we send gifts?</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Address</FormLabel>
                  <Input
                    value={recipient.deliveryAddress.line1}
                    onChange={(e) => setRecipient({
                      ...recipient,
                      deliveryAddress: {...recipient.deliveryAddress, line1: e.target.value}
                    })}
                    placeholder="123 Main Street"
                    size="lg"
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>City</FormLabel>
                    <Input
                      value={recipient.deliveryAddress.city}
                      onChange={(e) => setRecipient({
                        ...recipient,
                        deliveryAddress: {...recipient.deliveryAddress, city: e.target.value}
                      })}
                      placeholder="New York"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>State</FormLabel>
                    <Input
                      value={recipient.deliveryAddress.state}
                      onChange={(e) => setRecipient({
                        ...recipient,
                        deliveryAddress: {...recipient.deliveryAddress, state: e.target.value}
                      })}
                      placeholder="NY"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>ZIP Code</FormLabel>
                    <Input
                      value={recipient.deliveryAddress.postalCode}
                      onChange={(e) => setRecipient({
                        ...recipient,
                        deliveryAddress: {...recipient.deliveryAddress, postalCode: e.target.value}
                      })}
                      placeholder="10001"
                      size="lg"
                    />
                  </FormControl>
                </HStack>

                <Flex justify="space-between" pt={4}>
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button colorScheme="blue" size="lg" onClick={handleNext}>
                    Almost done!
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <Heading size="md">You're all set!</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontSize="lg" mb={4}>
                    Here's what happens next:
                  </Text>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Box w={2} h={2} bg="green.500" borderRadius="full" />
                      <Text>We'll recommend gifts for {recipient.name} based on their interests</Text>
                    </HStack>
                    <HStack>
                      <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                      <Text>You'll get an email to approve gifts before we send them</Text>
                    </HStack>
                    <HStack>
                      <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                      <Text>If you don't respond, we'll handle everything automatically</Text>
                    </HStack>
                    <HStack>
                      <Box w={2} h={2} bg="orange.500" borderRadius="full" />
                      <Text>Gifts arrive on time, every time</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Summary:</Text>
                  <Text>• Recipient: {recipient.name} ({recipient.relationship})</Text>
                  <Text>• Budget: ${recipient.spendingLimit} per gift</Text>
                  <Text>• Occasions: {recipient.birthdate ? 'Birthday, ' : ''}Christmas</Text>
                  <Text>• Delivery: {recipient.deliveryAddress.city}, {recipient.deliveryAddress.state}</Text>
                </Box>

                <Flex justify="space-between" pt={4}>
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={handleComplete}
                    isLoading={loading}
                    loadingText="Setting up..."
                  >
                    Complete Setup
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default SimpleOnboarding; 