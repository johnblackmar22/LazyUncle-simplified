import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Select,
  Flex,
  Checkbox,
  Image,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';
import { useGiftStore } from '../store/giftStore';
import { getGiftRecommendationsFromAI } from '../services/giftRecommendationEngine';
import { showErrorToast } from '../utils/toastUtils';
import { useAuthStore } from '../store/authStore';
import { getPlanById } from '../services/subscription/plans';
import { Link as RouterLink } from 'react-router-dom';

const relationshipOptions = [
  'Nephew', 'Niece', 'Family', 'Friend', 'Colleague', 'Other'
];
const occasionOptions = [
  'Birthday', 'Christmas', 'Anniversary', 'Other'
];
const suggestedInterests = ['Gaming', 'Music', 'Tech', 'Travel', 'Sports', 'Food', 'Books', 'Movies', 'Fashion', 'Outdoors'];

const AddRecipientPage: React.FC = () => {
  const toast = useToast();
  const { addRecipient, recipients } = useRecipientStore();
  const { createGift } = useGiftStore();
  const { user, demoMode } = useAuthStore();
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState({
    name: '',
    relationship: '',
    birthdate: '',
    interests: [] as string[],
  });
  const [interestInput, setInterestInput] = useState('');
  const [budget, setBudget] = useState('50');
  const [occasion, setOccasion] = useState('Birthday');
  const [showBirthdayGift, setShowBirthdayGift] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedGiftIdx, setSelectedGiftIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const cancelRef = React.useRef(null);

  // Add/Remove Interests
  const addInterest = () => {
    if (interestInput.trim() && !recipient.interests.includes(interestInput.trim())) {
      setRecipient(r => ({ ...r, interests: [...r.interests, interestInput.trim()] }));
      setInterestInput('');
    }
  };
  const removeInterest = (i: string) => {
    setRecipient(r => ({ ...r, interests: r.interests.filter(x => x !== i) }));
  };

  // Step Handlers
  const handleNext = async () => {
    if (step === 0) {
      // Enforce recipient limit for free plan (except in demo mode)
      const planId = user?.planId || 'free';
      const plan = getPlanById(planId);
      if (!demoMode && plan && plan.recipientLimit !== Infinity && recipients.length >= plan.recipientLimit) {
        setPaywallOpen(true);
        return;
      }
      if (!recipient.name.trim() || !recipient.relationship.trim()) {
        toast({
          title: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setStep(1);
    } else if (step === 1) {
      setLoading(true);
      const recs = await getGiftRecommendationsFromAI({
        recipient: { ...recipient },
        budget: Number(budget)
      });
      setRecommendations(recs);
      setSelectedGiftIdx(0);
      setLoading(false);
      setStep(2);
    }
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // Approve gift and persist data
  const handleApproveGift = async () => {
    setLoading(true);
    try {
      // Save recipient
      const birthdateObj = recipient.birthdate ? new Date(recipient.birthdate) : undefined;
      const newRecipient = await addRecipient({
        name: recipient.name,
        relationship: recipient.relationship,
        birthdate: birthdateObj,
        interests: recipient.interests,
        giftPreferences: {
          priceRange: { min: 0, max: Number(budget) }
        }
      });
      // Save gift
      if (newRecipient && recommendations[selectedGiftIdx]) {
        await createGift({
          recipientId: newRecipient.id,
          name: recommendations[selectedGiftIdx].name,
          description: recommendations[selectedGiftIdx].description,
          price: recommendations[selectedGiftIdx].price,
          category: recommendations[selectedGiftIdx].category,
          occasion,
          date: birthdateObj || new Date(),
          status: 'planned',
          imageUrl: recommendations[selectedGiftIdx].imageUrl,
          notes: 'Auto-send enabled',
        });
      }
      toast({
        title: 'Recipient and gift added!',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      setStep(3);
    } catch (err) {
      showErrorToast(toast, err, { title: 'Error adding recipient or gift' });
    } finally {
      setLoading(false);
    }
  };

  // Step UIs
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {step === 0 && (
          <Box>
            <Heading>Add Recipient</Heading>
            <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={recipient.name} onChange={e => setRecipient(r => ({ ...r, name: e.target.value }))} placeholder="Their name" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Relationship</FormLabel>
                  <Select value={recipient.relationship} onChange={e => setRecipient(r => ({ ...r, relationship: e.target.value }))} placeholder="Select relationship">
                    {relationshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Birthday (Optional)</FormLabel>
                  <Input type="date" value={recipient.birthdate} onChange={e => setRecipient(r => ({ ...r, birthdate: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel>Interests</FormLabel>
                  <Flex gap={2} mb={2}>
                    <Input value={interestInput} onChange={e => setInterestInput(e.target.value)} placeholder="Add interest" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }} />
                    <Button onClick={addInterest} leftIcon={<span>+</span>}>Add</Button>
                  </Flex>
                  <Flex gap={2} flexWrap="wrap">
                    {recipient.interests.map(i => (
                      <Button key={i} size="sm" colorScheme="blue" variant="outline" onClick={() => removeInterest(i)}>{i} ×</Button>
                    ))}
                  </Flex>
                  <Flex gap={2} mt={2} flexWrap="wrap">
                    {suggestedInterests.map(si => (
                      <Button key={si} size="xs" variant={recipient.interests.includes(si) ? 'solid' : 'outline'} colorScheme="gray" onClick={() => !recipient.interests.includes(si) && setRecipient(r => ({ ...r, interests: [...r.interests, si] }))}>{si}</Button>
                    ))}
                  </Flex>
                </FormControl>
                <Flex justify="flex-end">
                  <Button colorScheme="blue" type="submit">Next</Button>
                </Flex>
              </VStack>
            </form>
          </Box>
        )}
        {step === 1 && (
          <Box>
            <Heading size="md">Set Budget & Occasion</Heading>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel>How much do you want to spend per gift?</FormLabel>
                <Input type="number" min={5} value={budget} onChange={e => setBudget(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>What occasion should we remember?</FormLabel>
                <Select value={occasion} onChange={e => setOccasion(e.target.value)}>
                  {occasionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </FormControl>
              <Checkbox isChecked={showBirthdayGift} onChange={e => setShowBirthdayGift(e.target.checked)}>
                Auto-send a gift for their birthday
              </Checkbox>
              <Flex justify="space-between">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button colorScheme="blue" onClick={handleNext} isLoading={loading}>Next</Button>
              </Flex>
            </VStack>
          </Box>
        )}
        {step === 2 && (
          <Box>
            <Heading size="md">Gift Recommendation</Heading>
            {loading ? (
              <Text>Loading recommendations...</Text>
            ) : recommendations.length === 0 ? (
              <Text>No recommendations found. Try adjusting interests or budget.</Text>
            ) : (
              <Box>
                <Heading size="sm" mb={2}>{recommendations[selectedGiftIdx].name}</Heading>
                {recommendations[selectedGiftIdx].imageUrl && (
                  <Image src={recommendations[selectedGiftIdx].imageUrl} alt={recommendations[selectedGiftIdx].name} maxH="150px" mb={2} />
                )}
                <Text mb={2}>{recommendations[selectedGiftIdx].description}</Text>
                <Text fontWeight="bold">Price: ${recommendations[selectedGiftIdx].price.toFixed(2)}</Text>
                <Text>Category: {recommendations[selectedGiftIdx].category}</Text>
                <Flex gap={2} mt={4}>
                  <Button colorScheme="green" onClick={handleApproveGift} isLoading={loading}>Approve & Schedule</Button>
                  <Button onClick={() => setSelectedGiftIdx((selectedGiftIdx + 1) % recommendations.length)}>See Another</Button>
                  <Button variant="ghost" onClick={handleBack}>Back</Button>
                </Flex>
              </Box>
            )}
          </Box>
        )}
        {step === 3 && (
          <Box textAlign="center">
            <Heading size="md" mb={4}>All Set!</Heading>
            <Text mb={4}>Your recipient and gift are set up. We'll handle the rest. You can always edit your preferences later.</Text>
            <Text mt={6} fontSize="lg" color="gray.700" textAlign="center">
              We'll tee up a personalized gift for your approval one week before it's scheduled to ship. You'll have the option to veto or approve the selection. If we don't hear from you, we'll handle everything for you—no action needed.
            </Text>
            <Button colorScheme="green" as="a" href="/recipients">Back to Recipients</Button>
          </Box>
        )}
        <AlertDialog
          isOpen={isPaywallOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setPaywallOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Upgrade Required
              </AlertDialogHeader>
              <AlertDialogBody>
                The Free plan allows only 1 recipient. Upgrade to Pro for unlimited recipients and more features!
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setPaywallOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="blue" ml={3} as={RouterLink} to="/subscription/plans">
                  Upgrade Now
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default AddRecipientPage; 