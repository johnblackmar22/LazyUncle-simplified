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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  HStack
} from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';
import { useAuthStore } from '../store/authStore';
import { getPlanById } from '../services/subscription/plans';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { months, days, years } from '../utils/dateUtils';

const relationshipOptions = [
  'Nephew', 'Niece', 'Family', 'Friend', 'Colleague', 'Other'
];
const suggestedInterests = ['Gaming', 'Music', 'Tech', 'Travel', 'Sports', 'Food', 'Books', 'Movies', 'Fashion', 'Outdoors'];

const AddRecipientPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { addRecipient, recipients } = useRecipientStore();
  const { user, demoMode } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const cancelRef = React.useRef(null);
  
  const [recipient, setRecipient] = useState({
    name: '',
    relationship: '',
    birthdate: '',
    interests: [] as string[],
  });
  const [interestInput, setInterestInput] = useState('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');

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

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    setLoading(true);
    let birthdateStr = '';
    if (birthYear && birthMonth && birthDay) {
      birthdateStr = `${birthYear}-${birthMonth}-${birthDay}`;
    }
    try {
      await addRecipient({
        ...recipient,
        birthdate: birthdateStr || undefined,
      });
      toast({
        title: 'Recipient added!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    } catch (error) {
      toast({
        title: 'Error adding recipient',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading>Add Recipient</Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch" mt={4}>
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
                <HStack>
                  <Select placeholder="Month" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>{months.map((m: string, i: number) => <option key={i} value={String(i+1).padStart(2, '0')}>{m}</option>)}</Select>
                  <Select placeholder="Day" value={birthDay} onChange={e => setBirthDay(e.target.value)}>{days.map((d: number) => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}</Select>
                  <Select placeholder="Year" value={birthYear} onChange={e => setBirthYear(e.target.value)}>{years.map((y: number) => <option key={y} value={y}>{y}</option>)}</Select>
                </HStack>
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
              <Flex justify="space-between">
                <Button variant="ghost" as={RouterLink} to="/recipients">Cancel</Button>
                <Button colorScheme="blue" type="submit" isLoading={loading}>Save Recipient</Button>
              </Flex>
            </VStack>
          </form>
        </Box>
        
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