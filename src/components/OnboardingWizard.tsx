import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, VStack, Progress, useToast, Input, FormControl, FormLabel, Select, Checkbox, Flex, Image, Tooltip, FormErrorMessage } from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';
import { useAuthStore } from '../store/authStore';
import { isDemoMode, initializeDemoData } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const steps = [
  'Welcome',
  'Add Recipient',
  'Set Budget & Occasion',
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
  const [showBirthdayGift, setShowBirthdayGift] = useState(true);
  const toast = useToast();
  const { addRecipient } = useRecipientStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; relationship?: string; budget?: string; occasion?: string }>({});
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const { user, demoMode, setDemoMode } = useAuthStore();

  // Initialize demo mode if needed
  useEffect(() => {
    if (!user && !demoMode && setDemoMode) {
      console.log('Enabling demo mode for onboarding');
      setDemoMode(true);
      initializeDemoData();
    }
  }, [user, demoMode, setDemoMode]);

  // Step Handlers
  const handleNext = async () => {
    // Ensure demo mode is enabled for onboarding if not logged in
    if (!user && !demoMode && setDemoMode) {
      setDemoMode(true);
      initializeDemoData();
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

  // Step UIs
  return (
    <Box bg="neutral.100" minH="100vh">
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
        {step === 3 && (
          <VStack spacing={6} align="stretch">
            <Heading size="md">All Set!</Heading>
            <Text>Your recipient and gift are set up. We'll handle the rest. You can always edit your preferences later.</Text>
            <Text mt={6} fontSize="lg" color="neutral.700" textAlign="center">
              We'll tee up a personalized gift for your approval one week before it's scheduled to ship. You'll have the option to veto or approve the selection. If we don't hear from you, we'll handle everything for you—no action needed.
            </Text>
            <a href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button colorScheme="green">Go to Dashboard</Button>
            </a>
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