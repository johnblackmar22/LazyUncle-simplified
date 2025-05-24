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

export default function DashboardPage() {
  // Get state and actions from stores
  const { recipients, fetchRecipients } = useRecipientStore();
  const { demoMode } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addOccasion, fetchOccasions } = useOccasionStore();
  const toast = useToast();
  const [occasionModalRecipientId, setOccasionModalRecipientId] = useState<string | null>(null);
  const [occasionForm, setOccasionForm] = useState<{ name: string; date: string; type: 'birthday' | 'anniversary' | 'custom'; notes: string }>({ name: '', date: '', type: 'custom', notes: '' });
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
    setOccasionModalRecipientId(recipientId);
    setOccasionForm({ name: '', date: '', type: 'custom', notes: '' });
  };
  const closeOccasionModal = () => {
    setOccasionModalRecipientId(null);
    setOccasionForm({ name: '', date: '', type: 'custom', notes: '' });
  };
  const handleOccasionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOccasionForm(f => ({
      ...f,
      [name]: name === 'type' ? (value as 'birthday' | 'anniversary' | 'custom') : value
    }));
  };
  const handleOccasionSubmit = async () => {
    if (!occasionModalRecipientId || !occasionForm.name || !occasionForm.date) return;
    setOccasionLoading(true);
    try {
      const result = await addOccasion(occasionModalRecipientId, occasionForm);
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

  return (
    <Stack spacing={8}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="lg" mb={2}>
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
            size="sm"
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
                    >
                      <Flex align="center" gap={4}>
                        <Avatar size="md" name={recipient.name} />
                        <Box>
                          <Text fontWeight="bold">{recipient.name}</Text>
                          <Text color="gray.500">{recipient.relationship}</Text>
                        </Box>
                      </Flex>
                      <Button
                        mt={4}
                        colorScheme="blue"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          openOccasionModal(recipient.id);
                        }}
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

      <Modal isOpen={!!occasionModalRecipientId} onClose={closeOccasionModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Occasion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired mb={3}>
              <FormLabel>Name</FormLabel>
              <Input name="name" value={occasionForm.name} onChange={handleOccasionFormChange} />
            </FormControl>
            <FormControl isRequired mb={3}>
              <FormLabel>Date</FormLabel>
              <Input name="date" type="date" value={occasionForm.date} onChange={handleOccasionFormChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Type</FormLabel>
              <Select name="type" value={occasionForm.type} onChange={handleOccasionFormChange}>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="custom">Custom</option>
              </Select>
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Notes</FormLabel>
              <Textarea name="notes" value={occasionForm.notes} onChange={handleOccasionFormChange} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeOccasionModal} mr={3} variant="ghost">Cancel</Button>
            <Button colorScheme="blue" onClick={handleOccasionSubmit} isLoading={occasionLoading}>Add Occasion</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
} 