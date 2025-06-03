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
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import { FaGift, FaCalendarAlt, FaDollarSign, FaUser, FaHeart, FaComments, FaMapMarkerAlt } from 'react-icons/fa';
import { useRecipientStore } from '../store/recipientStore';
import { format } from 'date-fns';
import type { Recipient } from '../types';
import { showErrorToast } from '../utils/toastUtils';
import { safeFormatDate } from '../utils/dateUtils';
import { useOccasionStore } from '../store/occasionStore';
import OccasionForm from '../components/OccasionForm';
import OccasionCard from '../components/OccasionCard';

export const RecipientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const { recipients, loading, error, fetchRecipients, deleteRecipient } = useRecipientStore();
  const { occasions, addOccasion, updateOccasion, deleteOccasion, fetchOccasions } = useOccasionStore();

  const [currentRecipient, setCurrentRecipient] = useState<Recipient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingOccasionId, setDeletingOccasionId] = useState<string | null>(null);
  const [isDeletingOccasion, setIsDeletingOccasion] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Helper function to format birthday and calculate age
  const formatBirthdayWithAge = (birthdate?: string) => {
    if (!birthdate) return null;
    
    try {
      // Parse date in local timezone to avoid UTC issues
      const [year, month, day] = birthdate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      
      // Calculate age
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      
      // Format as Month DD
      const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      return { monthDay, age };
    } catch {
      return null;
    }
  };

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

  // Load recipients and occasions
  useEffect(() => {
    console.log('RecipientDetailPage useEffect triggered. ID:', id, 'Location search:', location.search);
    const loadData = async () => {
      await fetchRecipients();
      
      // Only fetch occasions if we have an ID
      if (id) {
        console.log('RecipientDetailPage - Fetching occasions for recipient:', id);
        await fetchOccasions(id);
      }
    };
    
    loadData();

    // Check if we should open the occasion modal (from add recipient flow)
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('addOccasion') === 'true') {
      setIsModalOpen(true);
    }
  }, [fetchRecipients, fetchOccasions, id, location.search]);
  
  // Find the current recipient when recipients change or ID changes
  useEffect(() => {
    if (id && recipients.length > 0) {
      const recipient = recipients.find(r => r.id === id);
      if (recipient) {
        setCurrentRecipient(recipient);
      } else {
        console.warn('Recipient not found with ID:', id);
      }
    }
  }, [id, recipients]);

  // Separate effect to refetch occasions when recipient changes
  useEffect(() => {
    if (id && currentRecipient) {
      console.log('RecipientDetailPage - Refetching occasions for current recipient:', currentRecipient.name);
      fetchOccasions(id);
    }
  }, [id, currentRecipient?.id, fetchOccasions]); // Only trigger when recipient ID actually changes

  // Function to check if recipient has delivery address and handle validation
  const checkDeliveryAddressAndProceed = (actionCallback: () => void) => {
    // Remove the address requirement - occasions should be allowed without delivery addresses
    actionCallback();
    return true;
  };

  const handleAddOccasion = async (occasionData: any) => {
    if (!id) return;
    
    try {
      await addOccasion(id, occasionData);
      setIsModalOpen(false);
      setEditingOccasion(null);
      toast({
        title: 'Occasion added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      showErrorToast(toast, error, { title: 'Error adding occasion' });
    }
  };

  const handleEditOccasion = async (occasionData: any) => {
    if (!editingOccasion || !id) return;
    
    try {
      await updateOccasion(editingOccasion.id, occasionData);
      setIsModalOpen(false);
      setEditingOccasion(null);
      toast({
        title: 'Occasion updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      showErrorToast(toast, error, { title: 'Error updating occasion' });
    }
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (!id) return;
    
    setIsDeletingOccasion(true);
    try {
      await deleteOccasion(occasionId, id);
      setIsDeleteDialogOpen(false);
      setDeletingOccasionId(null);
      toast({
        title: 'Occasion deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      showErrorToast(toast, error, { title: 'Error deleting occasion' });
    } finally {
      setIsDeletingOccasion(false);
    }
  };

  const openEditModal = (occasion: any) => {
    setEditingOccasion(occasion);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (occasionId: string) => {
    setDeletingOccasionId(occasionId);
    setIsDeleteDialogOpen(true);
  };

  // Handler for opening add occasion modal with address validation
  const handleOpenAddOccasionModal = () => {
    checkDeliveryAddressAndProceed(() => setIsModalOpen(true));
  };

  if (loading && !currentRecipient) {
    return (
      <Container maxW="container.lg" mt={8}>
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" mt={8}>
        <Box p={4} bg="red.50" color="red.500" borderRadius="md">
          <Text>Error: {error}</Text>
        </Box>
      </Container>
    );
  }

  if (!currentRecipient) {
    return (
      <Container maxW="container.lg" mt={8}>
        <Box textAlign="center" p={8}>
          <Text fontSize="lg" mb={4}>Recipient not found</Text>
          <Button as={RouterLink} to="/recipients" leftIcon={<ArrowBackIcon />}>
            Back to Recipients
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" mt={4}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack>
          <IconButton
            as={RouterLink}
            to="/recipients"
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            variant="ghost"
          />
          <Heading size="lg">{currentRecipient.name}</Heading>
        </HStack>
        <HStack>
          <Button
            as={RouterLink}
            to={`/recipients/${id}/edit`}
            leftIcon={<EditIcon />}
            colorScheme="teal"
            variant="outline"
          >
            Edit Recipient
          </Button>
        </HStack>
      </Flex>

      <Stack spacing={6}>
        {/* Recipient Info Card */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Flex gap={4}>
              <Avatar name={currentRecipient.name} size="lg" />
              <Box>
                <Heading size="md">{currentRecipient.name}</Heading>
                <Badge colorScheme="blue" mt={1}>{currentRecipient.relationship}</Badge>
              </Box>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {currentRecipient.birthdate && (() => {
                const birthdayInfo = formatBirthdayWithAge(currentRecipient.birthdate);
                return birthdayInfo && (
                  <>
                    <HStack>
                      <FaUser color="blue" />
                      <Text>
                        <strong>Birthday:</strong> {birthdayInfo.monthDay}
                      </Text>
                    </HStack>
                    <HStack>
                      <FaUser color="green" />
                      <Text>
                        <strong>Age:</strong> {birthdayInfo.age} years old
                      </Text>
                    </HStack>
                  </>
                );
              })()}
              
              {/* Delivery Address */}
              {currentRecipient.deliveryAddress ? (
                <VStack align="start" spacing={1}>
                  <HStack>
                    <FaMapMarkerAlt color="green" />
                    <Text fontWeight="bold">Delivery Address:</Text>
                  </HStack>
                  <Box pl={6} fontSize="sm">
                    <Text>{currentRecipient.deliveryAddress.line1}</Text>
                    {currentRecipient.deliveryAddress.line2 && (
                      <Text>{currentRecipient.deliveryAddress.line2}</Text>
                    )}
                    <Text>
                      {currentRecipient.deliveryAddress.city}, {currentRecipient.deliveryAddress.state} {currentRecipient.deliveryAddress.postalCode}
                    </Text>
                  </Box>
                </VStack>
              ) : (
                <VStack align="start" spacing={1}>
                  <HStack>
                    <FaMapMarkerAlt color="gray" />
                    <Text fontWeight="bold" color="gray.500">No Delivery Address</Text>
                  </HStack>
                  <Box pl={6} fontSize="sm">
                    <Text color="gray.600" mb={2}>
                      Add a delivery address for easier gift shipping.
                    </Text>
                    <Button
                      as={RouterLink}
                      to={`/recipients/${id}/edit`}
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<EditIcon />}
                    >
                      Add Address
                    </Button>
                  </Box>
                </VStack>
              )}
              
              {currentRecipient.interests && currentRecipient.interests.length > 0 && (
                <VStack align="start">
                  <HStack>
                    <FaHeart color="red" />
                    <Text fontWeight="bold">Interests:</Text>
                  </HStack>
                  <Flex gap={1} flexWrap="wrap">
                    {currentRecipient.interests.map((interest, index) => (
                      <Badge key={index} colorScheme={getInterestColor(index)} variant="subtle">
                        {interest}
                      </Badge>
                    ))}
                  </Flex>
                </VStack>
              )}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Gift Occasions */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Gift Occasions</Heading>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                variant="outline"
                size="sm"
                onClick={handleOpenAddOccasionModal}
              >
                Add Occasion
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            {id && occasions && occasions[id] && occasions[id].length > 0 ? (
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                {occasions[id].map((occasion: any) => (
                  <OccasionCard
                    key={occasion.id}
                    occasion={occasion}
                    recipient={currentRecipient}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    isDeleting={isDeletingOccasion && deletingOccasionId === occasion.id}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={6}>
                <Text mb={4} color="gray.500">No occasions created yet</Text>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="purple"
                  onClick={handleOpenAddOccasionModal}
                >
                  Add First Occasion
                </Button>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Description */}
        {currentRecipient.description && (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">About {currentRecipient.name}</Heading>
            </CardHeader>
            <CardBody>
              <Text>{currentRecipient.description}</Text>
            </CardBody>
          </Card>
        )}
      </Stack>

      {/* Occasion Modal */}
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingOccasion(null);
      }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingOccasion ? 'Edit Occasion' : 'Add New Occasion'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <OccasionForm
              recipient={currentRecipient}
              initialValues={editingOccasion}
              onSubmit={editingOccasion ? handleEditOccasion : handleAddOccasion}
              onCancel={() => {
                setIsModalOpen(false);
                setEditingOccasion(null);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={React.createRef()}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Occasion</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this occasion? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deletingOccasionId && handleDeleteOccasion(deletingOccasionId)}
                ml={3}
                isLoading={isDeletingOccasion}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}; 