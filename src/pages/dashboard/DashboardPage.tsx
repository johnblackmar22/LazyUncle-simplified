import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Avatar,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';
import { useOccasionStore } from '../../store/occasionStore';
import { FaGift } from 'react-icons/fa';
import { AddIcon } from '@chakra-ui/icons';

export default function DashboardPage() {
  // Get state and actions from stores
  const { recipients, fetchRecipients } = useRecipientStore();
  const { demoMode } = useAuthStore();
  const { occasions, addOccasion, fetchOccasions } = useOccasionStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const [occasionModalRecipientId, setOccasionModalRecipientId] = useState<string | null>(null);
  const [occasionForm, setOccasionForm] = useState<{
    type: 'birthday' | 'anniversary' | 'other' | 'christmas';
    otherName: string;
    date: string;
    amount: string;
    recurring: boolean;
    notes: string;
  }>({
    type: 'other',
    otherName: '',
    date: '',
    amount: '',
    recurring: false,
    notes: '',
  });
  const [occasionLoading, setOccasionLoading] = useState(false);
  
  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // If in demo mode, ensure demo data is initialized properly
      if (demoMode) {
        // Check if demo data is missing and re-initialize if needed
        const recipients = JSON.parse(localStorage.getItem('recipients') || '[]');
        if (!recipients.length) {
          initializeDemoData();
        }
      }
      
      await fetchRecipients();
      
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchRecipients, demoMode]);
  
  // Add this useEffect to always fetch recipients when dashboard mounts or regains focus
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);
  
  // Calculate stats
  const stats = {
    totalRecipients: recipients.length,
  };
  
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const openOccasionModal = (recipientId: string) => {
    const recipient = recipients.find(r => r.id === recipientId);
    let date = '';
    let type: 'birthday' | 'anniversary' | 'other' | 'christmas' = 'other';
    if (recipient?.birthdate) {
      date = recipient.birthdate;
      type = 'birthday';
    }
    setOccasionModalRecipientId(recipientId);
    setOccasionForm({
      type,
      otherName: '',
      date,
      amount: '',
      recurring: false,
      notes: '',
    });
  };
  const closeOccasionModal = () => {
    setOccasionModalRecipientId(null);
    setOccasionForm({
      type: 'other',
      otherName: '',
      date: '',
      amount: '',
      recurring: false,
      notes: '',
    });
  };
  const handleOccasionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    setOccasionForm(f => ({
      ...f,
      [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  const getDateFieldProps = () => {
    if (!occasionModalRecipientId) return { value: occasionForm.date, disabled: false };
    const recipient = recipients.find(r => r.id === occasionModalRecipientId);
    if (occasionForm.type === 'birthday' && recipient?.birthdate) {
      return { value: recipient.birthdate, disabled: true };
    }
    if (occasionForm.type === 'christmas') {
      const year = new Date().getFullYear();
      return { value: `${year}-12-25`, disabled: true };
    }
    return { value: occasionForm.date, disabled: false };
  };
  const handleOccasionSubmit = async () => {
    if (!occasionModalRecipientId || !occasionForm.type) return;
    setOccasionLoading(true);
    try {
      const recipient = recipients.find(r => r.id === occasionModalRecipientId);
      let name = '';
      let date = occasionForm.date;
      let type: 'birthday' | 'anniversary' | 'custom' | 'christmas' = occasionForm.type as any;
      if (occasionForm.type === 'birthday') {
        name = 'Birthday';
        date = recipient?.birthdate || '';
        type = 'birthday';
      } else if (occasionForm.type === 'christmas') {
        name = 'Christmas';
        const year = new Date().getFullYear();
        date = `${year}-12-25`;
        type = 'christmas';
      } else if (occasionForm.type === 'anniversary') {
        name = 'Anniversary';
        type = 'anniversary';
      } else if (occasionForm.type === 'other') {
        name = occasionForm.otherName || 'Other';
        type = 'custom';
      }
      if (!date) {
        toast({ title: 'Date is required', status: 'error', duration: 4000, isClosable: true });
        setOccasionLoading(false);
        return;
      }
      const occasionToSave = {
        name,
        type,
        date,
        notes: occasionForm.notes,
        amount: occasionForm.amount,
        recurring: occasionForm.recurring,
      };
      const result = await addOccasion(occasionModalRecipientId, occasionToSave);
      if (!result) {
        toast({ title: 'Failed to add occasion', status: 'error', duration: 4000, isClosable: true });
      } else {
        toast({ title: 'Occasion added', status: 'success', duration: 2000, isClosable: true });
        await fetchOccasions(occasionModalRecipientId);
        closeOccasionModal();
      }
    } catch (error) {
      toast({ title: 'Error adding occasion', description: (error as Error).message, status: 'error', duration: 4000, isClosable: true });
    }
    setOccasionLoading(false);
  };

  // Helper to calculate age
  const calculateAge = (date: string | undefined) => {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    if (
      today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day)
    ) {
      age--;
    }
    return age;
  };

  return (
    <Stack spacing={8}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Welcome to LazyUncle
          </Heading>
          <Text color="gray.600" mb={6}>
            Your gifting is on autopilot. We'll tee up gifts for your approval—no action needed.
          </Text>
        </Box>
        <Flex gap={3}>
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            leftIcon={<AddIcon />}
          >
            Add Recipient
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Text>Loading your gift dashboard...</Text>
        </Box>
      ) : (
        <>
          {stats.totalRecipients === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="xl" mb={4}>Add your first recipient to get started!</Text>
              <Button as={RouterLink} to="/recipients/add" colorScheme="blue" size="lg">
                Add Recipient
              </Button>
            </Box>
          ) : (
            <>
              <Box>
                <Heading as="h2" size="md" mb={4}>Recipients</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {recipients.map(recipient => (
                    <Box
                      key={recipient.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor={borderColor}
                      cursor="pointer"
                      _hover={{ boxShadow: 'md', bg: 'gray.50' }}
                      onClick={() => navigate(`/recipients/${recipient.id}`)}
                      bg={boxBg}
                      shadow="md"
                    >
                      <Flex align="center" gap={4} mb={2}>
                        <Avatar size="md" name={recipient.name} />
                        <Box>
                          <Text fontWeight="bold">{recipient.name}</Text>
                          <Text color="gray.500">{recipient.relationship}</Text>
                          {recipient.birthdate && (
                            <Text fontSize="sm" color="gray.600">
                              Age: {calculateAge(recipient.birthdate)}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                      {/* Gift Occasions */}
                      {occasions && occasions[recipient.id] && occasions[recipient.id].length > 0 && (
                        <Flex align="center" gap={1} mt={1} flexWrap="wrap">
                          {occasions[recipient.id].map((occasion, idx) => (
                            <Badge key={occasion.id} colorScheme="purple" fontSize="0.8em" display="flex" alignItems="center" mr={1} mb={1}>
                              <FaGift style={{ marginRight: 4 }} /> {occasion.name}
                            </Badge>
                          ))}
                        </Flex>
                      )}
                      <Button
                        mt={4}
                        colorScheme="blue"
                        size="sm"
                        as={RouterLink}
                        to={`/recipients/${recipient.id}?addOccasion=true`}
                        onClick={e => e.stopPropagation()}
                      >
                        Add Occasion
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </>
          )}
        </>
      )}
    </Stack>
  );
} 