import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, Progress, useToast, Input, FormControl, FormLabel, Select, Checkbox, Flex, Image, Tooltip, FormErrorMessage } from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';
import { useGiftStore } from '../store/giftStore';
import { getGiftRecommendations } from '../services/giftRecommendationEngine';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuthStore } from '../store/authStore';

const steps = [
  'Welcome',
  'Add Recipient',
  'Set Budget & Occasion',
  'Gift Recommendation',
  'Subscribe',
  'Confirmation',
];

const relationshipOptions = [
  'Nephew', 'Niece', 'Family', 'Friend', 'Colleague', 'Other'
];
const occasionOptions = [
  'Birthday', 'Christmas', 'Anniversary', 'Other'
];

const suggestedInterests = ['Gaming', 'Music', 'Tech', 'Travel', 'Sports', 'Food', 'Books', 'Movies', 'Fashion', 'Outdoors'];

const OnboardingWizard: React.FC = () => {
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
  const [approved, setApproved] = useState(false);
  const toast = useToast();
  const { addRecipient } = useRecipientStore();
  const { createGift } = useGiftStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{ name?: string; relationship?: string; budget?: string; occasion?: string }>({});
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const { user, demoMode, setDemoMode } = useAuthStore();

  // Step Handlers
  const handleNext = async () => {
    // If not logged in and not in demo mode, enable demo mode for onboarding
    if (!user && !demoMode && setDemoMode) {
      setDemoMode(true);
    }
    if (step === 1) {
      // Validate recipient
      const newErrors: { name?: string; relationship?: string } = {};
      if (!recipient.name.trim()) newErrors.name = 'Name is required';
      if (!recipient.relationship.trim()) newErrors.relationship = 'Relationship is required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast({
          title: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    if (step === 2) {
      // Validate budget and occasion
      const newErrors: { budget?: string; occasion?: string } = {};
      if (!budget || isNaN(Number(budget)) || Number(budget) < 5) newErrors.budget = 'Budget must be at least $5';
      if (!occasion) newErrors.occasion = 'Occasion is required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast({
          title: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      // Generate recommendations
      setLoading(true);
      const recs = getGiftRecommendations(
        { ...recipient },
        occasion,
        Number(budget)
      );
      setRecommendations(recs);
      setSelectedGiftIdx(0);
      setLoading(false);
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

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
      if (!newRecipient) {
        setLoading(false);
        toast({
          title: 'Error adding recipient',
          description: 'Could not add recipient. Please check your connection or try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }
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
      setApproved(true);
      setStep(4);
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Error saving recipient or gift',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step UIs
  return (
    <Box bg="neutral.100" minH="100vh">
      <Navbar />
      <Box maxW="lg" mx="auto" mt={{ base: 4, md: 10 }} p={{ base: 2, md: 8 }} bg="white" borderRadius="lg" boxShadow="md">
        <Progress value={((step + 1) / steps.length) * 100} mb={6} />
        <Flex mb={4} justify="center" gap={2}>
          {steps.map((s, idx) => (
            <Tooltip key={s} label={s} aria-label={`Step ${idx + 1}: ${s}`}>
              <Box w={8} h={8} borderRadius="full" bg={idx === step ? 'blue.500' : 'gray.200'} color={idx === step ? 'white' : 'gray.600'} display="flex" alignItems="center" justifyContent="center" fontWeight="bold">{idx + 1}</Box>
            </Tooltip>
          ))}
        </Flex>
        {step === 0 && (
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Welcome to LazyUncle!</Heading>
            <Text>Let's get you set up in just a few steps. We'll help you add a recipient, set a budget, and pick gifts. Ready?</Text>
            <Button colorScheme="blue" onClick={handleNext}>Get Started</Button>
          </VStack>
        )}
        {step === 1 && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Add Recipient</Heading>
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input aria-label="Recipient Name" value={recipient.name} onChange={e => setRecipient(r => ({ ...r, name: e.target.value }))} placeholder="Their name" />
              {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.relationship}>
              <FormLabel>Relationship</FormLabel>
              <Select aria-label="Recipient Relationship" value={recipient.relationship} onChange={e => setRecipient(r => ({ ...r, relationship: e.target.value }))} placeholder="Select relationship">
                {relationshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
              {errors.relationship && <FormErrorMessage>{errors.relationship}</FormErrorMessage>}
            </FormControl>
            <FormControl>
              <FormLabel>Birthday (Optional)</FormLabel>
              <Input type="date" aria-label="Recipient Birthday" value={recipient.birthdate} onChange={e => setRecipient(r => ({ ...r, birthdate: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel>Interests <Tooltip label="Interests help us recommend better gifts" aria-label="Interests help">?</Tooltip></FormLabel>
              <Flex gap={2} mb={2}>
                <Input aria-label="Add Interest" value={interestInput} onChange={e => setInterestInput(e.target.value)} placeholder="Add interest" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }} />
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
            <Flex justify="space-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button colorScheme="blue" onClick={handleNext}>Next</Button>
            </Flex>
          </VStack>
        )}
        {step === 2 && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Set Budget & Occasion</Heading>
            <FormControl isRequired isInvalid={!!errors.budget}>
              <FormLabel>How much do you want to spend per gift? <Tooltip label="We'll recommend gifts within this budget" aria-label="Budget help">?</Tooltip></FormLabel>
              <Input type="number" min={5} aria-label="Gift Budget" value={budget} onChange={e => setBudget(e.target.value)} />
              {errors.budget && <FormErrorMessage>{errors.budget}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.occasion}>
              <FormLabel>What occasion should we remember? <Tooltip label="We'll remind you and recommend gifts for this occasion" aria-label="Occasion help">?</Tooltip></FormLabel>
              <Select aria-label="Gift Occasion" value={occasion} onChange={e => setOccasion(e.target.value)}>
                {occasionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
              {errors.occasion && <FormErrorMessage>{errors.occasion}</FormErrorMessage>}
            </FormControl>
            <Checkbox isChecked={showBirthdayGift} onChange={e => setShowBirthdayGift(e.target.checked)} aria-label="Auto-send birthday gift">
              Auto-send a gift for their birthday
            </Checkbox>
            <Flex justify="space-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button colorScheme="blue" onClick={handleNext} isLoading={loading}>Next</Button>
            </Flex>
          </VStack>
        )}
        {step === 3 && (
          <VStack spacing={6} align="stretch">
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
          </VStack>
        )}
        {step === 4 && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Subscribe to Continue</Heading>
            <Text>Choose a subscription plan to activate automatic gifting. You can change or cancel anytime.</Text>
            <FormControl as="fieldset">
              <FormLabel as="legend">Select a plan:</FormLabel>
              <VStack align="start" spacing={2}>
                <Box>
                  <input type="radio" id="basic" name="plan" value="basic" checked={selectedPlan === 'basic'} onChange={() => setSelectedPlan('basic')} />
                  <label htmlFor="basic" style={{ marginLeft: 8, fontWeight: 500 }}>Basic - $5/mo (up to 2 recipients)</label>
                </Box>
                <Box>
                  <input type="radio" id="premium" name="plan" value="premium" checked={selectedPlan === 'premium'} onChange={() => setSelectedPlan('premium')} />
                  <label htmlFor="premium" style={{ marginLeft: 8, fontWeight: 500 }}>Premium - $10/mo (unlimited recipients)</label>
                </Box>
              </VStack>
            </FormControl>
            <Button colorScheme="orange" isDisabled={subscribed} onClick={() => setSubscribed(true)}>
              {subscribed ? 'Subscribed!' : 'Subscribe'}
            </Button>
            <Flex justify="space-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button colorScheme="blue" isDisabled={!subscribed} onClick={handleNext}>Next</Button>
            </Flex>
          </VStack>
        )}
        {step === 5 && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">All Set!</Heading>
            <Text>Your recipient and gift are set up. We'll handle the rest. You can always edit your preferences later.</Text>
            <Text mt={6} fontSize="lg" color="neutral.700" textAlign="center">
              We'll tee up a personalized gift for your approval one week before it's scheduled to ship. You'll have the option to veto or approve the selection. If we don't hear from you, we'll handle everything for you—no action needed.
            </Text>
            <Button colorScheme="green" as="a" href="/dashboard">Go to Dashboard</Button>
          </VStack>
        )}
        <Box mt={4} textAlign="center">
          <Text fontSize="sm" color="gray.500">Step {step + 1} of {steps.length}</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default OnboardingWizard; 