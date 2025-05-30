import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  Badge,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  SimpleGrid,
  Avatar,
  HStack,
  VStack,
  Spinner,
  useToast,
  useColorModeValue,
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
  Textarea
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { format } from 'date-fns';
import type { Recipient } from '../types';
import { showErrorToast } from '../utils/toastUtils';
import { safeFormatDate } from '../utils/dateUtils';
import { useOccasionStore } from '../store/occasionStore';
import OccasionForm from '../components/OccasionForm';
import { FaGift } from 'react-icons/fa';

export const RecipientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { 
    recipients, 
    loading, 
    error, 
    fetchRecipients, 
    deleteRecipient 
  } = useRecipientStore();
  const { occasions, fetchOccasions, addOccasion, deleteOccasion } = useOccasionStore();
  const location = useLocation();
  
  const [currentRecipient, setCurrentRecipient] = useState<Recipient | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [recommendations] = useState([
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
  ]);

  const [isOccasionModalOpen, setOccasionModalOpen] = useState(false);
  const [occasionLoading, setOccasionLoading] = useState(false);

  const openOccasionModal = () => setOccasionModalOpen(true);
  const closeOccasionModal = () => { setOccasionModalOpen(false); };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this occasion?')) {
      try {
        await deleteOccasion(occasionId, id);
        toast({
          title: 'Occasion deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh the occasions list
        await fetchOccasions(id);
      } catch (error) {
        showErrorToast(toast, error, { title: 'Error deleting occasion' });
      }
    }
  };

  useEffect(() => {
    fetchRecipients();
    if (id) {
      fetchOccasions(id);
    }
    // Open modal if addOccasion query param is present
    if (location.search.includes('addOccasion=true')) {
      setOccasionModalOpen(true);
    }
  }, [fetchRecipients, fetchOccasions, id, location.search]);
  
  // Find the current recipient when recipients change or ID changes
  useEffect(() => {
    if (id && recipients.length > 0) {
      const recipient = recipients.find(r => r.id === id);
      setCurrentRecipient(recipient || null);
    }
  }, [id, recipients]);

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await deleteRecipient(id);
        toast({
          title: 'Recipient deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/recipients');
      } catch (error) {
        showErrorToast(toast, error, { title: 'Error deleting recipient' });
      }
    }
  };
  
  // Helper to format birthday as Month Day
  const formatBirthdayMonthDay = (date: string | undefined) => {
    if (!date) return 'Not set';
    try {
      const [, month, day] = date.split('-');
      const dateObj = new Date(2000, Number(month) - 1, Number(day));
      return dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    } catch {
      return date;
    }
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
  // Helper to format MM-DD
  const formatMonthDay = (date: string) => {
    try {
      const [, month, day] = date.split('-');
      const dateObj = new Date(2000, Number(month) - 1, Number(day));
      return dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    } catch {
      return date;
    }
  };

  if (loading && !currentRecipient) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.500" borderRadius="md">
        <Text>Error: {error}</Text>
      </Box>
    );
  }

  if (!currentRecipient) {
    return (
      <Box textAlign="center" p={8}>
        <Text fontSize="lg" mb={4}>Recipient not found</Text>
        <Button
          as={RouterLink}
          to="/recipients"
          colorScheme="blue"
          leftIcon={<ArrowBackIcon />}
        >
          Back to Recipients
        </Button>
      </Box>
    );
  }

  return (
    <Box bg="gray.100" minH="100vh">
      <Container maxW="container.lg" py={{ base: 4, md: 12 }} px={{ base: 2, md: 0 }}>
        <VStack spacing={{ base: 4, md: 8 }} align="stretch">
          <Box>
            <Button 
              leftIcon={<ArrowBackIcon />} 
              variant="ghost" 
              onClick={() => navigate('/recipients')}
              mb={4}
              w={{ base: 'full', md: 'auto' }}
            >
              Back to Recipients
            </Button>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
              <Heading size={{ base: 'lg', md: 'xl' }} mb={2}>{currentRecipient.name}</Heading>
              <HStack spacing={2} mt={{ base: 2, md: 0 }}>
                <IconButton
                  as={RouterLink}
                  to={`/recipients/${currentRecipient.id}/edit`}
                  aria-label="Edit"
                  icon={<EditIcon />}
                  colorScheme="blue"
                  variant="outline"
                />
                <IconButton
                  aria-label="Delete"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDelete}
                />
                <Button
                  colorScheme="purple"
                  leftIcon={<AddIcon />}
                  w={{ base: 'full', md: 'auto' }}
                  onClick={openOccasionModal}
                >
                  Add Occasion
                </Button>
              </HStack>
            </Flex>
            <Badge colorScheme="blue" fontSize="md" mt={1}>
              {currentRecipient.relationship}
            </Badge>
          </Box>

          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Heading size="md">Birthday</Heading>
            </CardHeader>
            <CardBody>
              {typeof currentRecipient.birthdate === 'string' && currentRecipient.birthdate ? (
                <Flex align="center" gap={2}>
                  <Text>{formatBirthdayMonthDay(currentRecipient.birthdate as string)}</Text>
                  <Text color="gray.500">({calculateAge(currentRecipient.birthdate as string)} years old)</Text>
                </Flex>
              ) : (
                <Text color="gray.500">No birthdate set.</Text>
              )}
            </CardBody>
          </Card>

          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Heading size="md">Interests</Heading>
            </CardHeader>
            <CardBody>
              {currentRecipient.interests && currentRecipient.interests.length > 0 ? (
                <Flex gap={2} flexWrap="wrap">
                  {currentRecipient.interests.map((interest, index) => (
                    <Badge key={index} colorScheme="green" variant="solid" px={2} py={1}>
                      {interest}
                    </Badge>
                  ))}
                </Flex>
              ) : (
                <Text color="gray.500">No interests added yet.</Text>
              )}
            </CardBody>
          </Card>

          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Heading size="md">Gift Occasions</Heading>
            </CardHeader>
            <CardBody>
              {id && occasions && occasions[id] && occasions[id].length > 0 ? (
                <VStack align="start" spacing={3}>
                  {occasions[id].map((occasion: any) => (
                    <Flex key={occasion.id} align="center" justify="space-between" w="full" p={2} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                      <Flex align="center" gap={2}>
                        <FaGift color="purple" />
                        <Box>
                          <Text fontWeight="bold">{occasion.name}</Text>
                          <Text fontSize="sm" color="gray.500">{formatMonthDay(occasion.date)}</Text>
                        </Box>
                      </Flex>
                      <IconButton
                        aria-label="Delete occasion"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteOccasion(occasion.id)}
                      />
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">No gift occasions yet.</Text>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
      <Modal isOpen={isOccasionModalOpen} onClose={closeOccasionModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Occasion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentRecipient && (
              <OccasionForm
                recipient={currentRecipient}
                loading={occasionLoading}
                onSubmit={async (occasionData) => {
                  setOccasionLoading(true);
                  const result = await addOccasion(id || '', occasionData);
                  if (!result) {
                    toast({ title: 'Failed to add occasion', status: 'error', duration: 4000, isClosable: true });
                  } else {
                    toast({ title: 'Occasion added', status: 'success', duration: 2000, isClosable: true });
                    await fetchOccasions(id || '');
                    closeOccasionModal();
                  }
                  setOccasionLoading(false);
                }}
                onCancel={closeOccasionModal}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 