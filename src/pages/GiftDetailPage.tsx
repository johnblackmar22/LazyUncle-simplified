import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Image,
  Badge,
  IconButton,
  HStack,
  VStack,
  SimpleGrid,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Link,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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
  useDisclosure,
  useColorModeValue,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { 
  EditIcon, 
  DeleteIcon, 
  ArrowBackIcon, 
  ExternalLinkIcon, 
  TimeIcon,
  CalendarIcon 
} from '@chakra-ui/icons';
import { useGiftStore } from '../store/giftStore';
import { useRecipientStore } from '../store/recipientStore';
import { formatDate } from '../utils/dateUtils';
import type { GiftStatus, AutoSendStatus } from '../types';

// Status color mappings
const statusColors: Record<GiftStatus, string> = {
  idea: 'gray',
  planning: 'blue',
  purchased: 'green',
  wrapped: 'purple',
  shipped: 'orange',
  given: 'pink',
  archived: 'red'
};

const autoSendStatusColors: Record<AutoSendStatus, string> = {
  scheduled: 'blue',
  processing: 'yellow',
  ordered: 'orange',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'gray',
  failed: 'red'
};

const GiftDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State for modals
  const { 
    isOpen: isScheduleModalOpen, 
    onOpen: onScheduleModalOpen, 
    onClose: onScheduleModalClose 
  } = useDisclosure();
  const { 
    isOpen: isStatusModalOpen, 
    onOpen: onStatusModalOpen, 
    onClose: onStatusModalClose 
  } = useDisclosure();
  
  // Form states
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newStatus, setNewStatus] = useState<GiftStatus>('idea');
  
  // Store hooks
  const { 
    selectedGift, 
    loading, 
    error, 
    fetchGift,
    updateGift,
    removeGift,
    scheduleAutoSend,
    cancelAutoSend
  } = useGiftStore();
  
  const {
    recipients,
    loading: recipientsLoading,
    fetchRecipients
  } = useRecipientStore();
  
  // UI colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load gift and recipients on mount
  useEffect(() => {
    if (id) {
      fetchGift(id);
      fetchRecipients();
    }
  }, [id, fetchGift, fetchRecipients]);

  // Find recipient info
  const recipient = selectedGift 
    ? recipients.find(r => r.id === selectedGift.recipientId) 
    : null;

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this gift?')) {
      setIsDeleting(true);
      try {
        await removeGift(id!);
        toast({
          title: 'Gift deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/gifts');
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsDeleting(false);
      }
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedGift) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateGift(selectedGift.id, { status: newStatus });
      toast({
        title: 'Status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onStatusModalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle auto-send scheduling
  const handleScheduleAutoSend = async () => {
    if (!selectedGift) return;
    
    setIsScheduling(true);
    try {
      await scheduleAutoSend(selectedGift.id, scheduledDate);
      toast({
        title: 'Auto-send scheduled',
        description: `The gift will be sent on ${formatDate(scheduledDate)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onScheduleModalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle auto-send cancellation
  const handleCancelAutoSend = async () => {
    if (!selectedGift) return;
    
    if (window.confirm('Are you sure you want to cancel the auto-send for this gift?')) {
      setIsCancelling(true);
      try {
        await cancelAutoSend(selectedGift.id);
        toast({
          title: 'Auto-send cancelled',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsCancelling(false);
      }
    }
  };

  if (loading || recipientsLoading) {
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

  if (!selectedGift) {
    return (
      <Box textAlign="center" p={8}>
        <Text fontSize="lg" mb={4}>Gift not found</Text>
        <Button
          as={RouterLink}
          to="/gifts"
          colorScheme="blue"
          leftIcon={<ArrowBackIcon />}
        >
          Back to Gifts
        </Button>
      </Box>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate('/gifts')}
            mb={4}
          >
            Back to Gifts
          </Button>
          
          <Flex 
            justify="space-between" 
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Box>
              <Heading size="xl" mb={2}>{selectedGift.name}</Heading>
              <HStack>
                <Badge 
                  colorScheme={statusColors[selectedGift.status as GiftStatus]}
                  fontSize="md"
                >
                  {selectedGift.status.charAt(0).toUpperCase() + selectedGift.status.slice(1)}
                </Badge>
                
                {selectedGift.autoSend && (
                  <Badge 
                    colorScheme="purple" 
                    fontSize="md"
                    display="flex"
                    alignItems="center"
                  >
                    <TimeIcon mr={1} /> Auto-Send
                  </Badge>
                )}
              </HStack>
            </Box>
            
            <HStack spacing={2}>
              <Button
                onClick={onStatusModalOpen}
                size="sm"
                colorScheme="blue"
                variant="outline"
              >
                Update Status
              </Button>
              
              <IconButton
                as={RouterLink}
                to={`/gifts/${selectedGift.id}/edit`}
                aria-label="Edit"
                icon={<EditIcon />}
                colorScheme="blue"
                size="sm"
              />
              
              <IconButton
                aria-label="Delete"
                icon={isDeleting ? <Spinner size="sm" /> : <DeleteIcon />}
                colorScheme="red"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDelete}
              />
            </HStack>
          </Flex>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="md">Gift Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                {selectedGift.imageURL && (
                  <Image 
                    src={selectedGift.imageURL} 
                    alt={selectedGift.name}
                    borderRadius="md"
                    maxH="300px"
                    mx="auto"
                  />
                )}
                
                {selectedGift.description && (
                  <Box>
                    <Text fontWeight="bold">Description</Text>
                    <Text>{selectedGift.description}</Text>
                  </Box>
                )}
                
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {selectedGift.price && (
                    <Box>
                      <Text fontWeight="bold">Price</Text>
                      <Text>
                        {selectedGift.currency || '$'}{selectedGift.price.toFixed(2)}
                      </Text>
                    </Box>
                  )}
                  
                  {selectedGift.category && (
                    <Box>
                      <Text fontWeight="bold">Category</Text>
                      <Text>{selectedGift.category}</Text>
                    </Box>
                  )}
                  
                  {selectedGift.retailer && (
                    <Box>
                      <Text fontWeight="bold">Retailer</Text>
                      <Text>{selectedGift.retailer}</Text>
                    </Box>
                  )}
                  
                  {selectedGift.occasion && (
                    <Box>
                      <Text fontWeight="bold">Occasion</Text>
                      <Text>{selectedGift.occasion}</Text>
                    </Box>
                  )}
                  
                  {selectedGift.date && (
                    <Box>
                      <Text fontWeight="bold">Gift Date</Text>
                      <Text>{formatDate(selectedGift.date)}</Text>
                    </Box>
                  )}
                </SimpleGrid>
                
                {selectedGift.url && (
                  <Box width="100%">
                    <Text fontWeight="bold">Where to Buy</Text>
                    <Link 
                      href={selectedGift.url} 
                      color="blue.500" 
                      isExternal
                      display="flex"
                      alignItems="center"
                    >
                      {selectedGift.url}
                      <ExternalLinkIcon mx="2px" />
                    </Link>
                  </Box>
                )}
                
                {recipient && (
                  <Box width="100%">
                    <Text fontWeight="bold">For</Text>
                    <Button
                      as={RouterLink}
                      to={`/recipients/${recipient.id}`}
                      variant="link"
                      colorScheme="blue"
                    >
                      {recipient.name} ({recipient.relationship})
                    </Button>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="md">Auto-Send Status</Heading>
            </CardHeader>
            <CardBody>
              {selectedGift.autoSend ? (
                <VStack align="start" spacing={4}>
                  <Alert 
                    status="info" 
                    variant="subtle" 
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Auto-Send Enabled</AlertTitle>
                      <AlertDescription>
                        This gift is scheduled to be automatically sent to {recipient?.name}.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <Box width="100%">
                    <Text fontWeight="bold">Scheduled Date</Text>
                    <Text>{formatDate(selectedGift.autoSendDate || '')}</Text>
                  </Box>
                  
                  {selectedGift.autoSendStatus && (
                    <Box width="100%">
                      <Text fontWeight="bold">Status</Text>
                      <Badge 
                        colorScheme={autoSendStatusColors[selectedGift.autoSendStatus as AutoSendStatus]}
                      >
                        {selectedGift.autoSendStatus.charAt(0).toUpperCase() + selectedGift.autoSendStatus.slice(1)}
                      </Badge>
                    </Box>
                  )}
                  
                  <Button
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<TimeIcon />}
                    onClick={handleCancelAutoSend}
                    isLoading={isCancelling}
                    width="100%"
                  >
                    Cancel Auto-Send
                  </Button>
                </VStack>
              ) : (
                <VStack align="start" spacing={4}>
                  <Text>
                    Auto-send is not enabled for this gift. Enable it to have the gift automatically purchased and delivered to {recipient?.name}.
                  </Text>
                  
                  <Button
                    colorScheme="purple"
                    leftIcon={<CalendarIcon />}
                    onClick={onScheduleModalOpen}
                    width="100%"
                  >
                    Schedule Auto-Send
                  </Button>
                </VStack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
      
      {/* Status Update Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={onStatusModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Gift Status</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value as GiftStatus)}
              >
                <option value="idea">Idea</option>
                <option value="planning">Planning</option>
                <option value="purchased">Purchased</option>
                <option value="wrapped">Wrapped</option>
                <option value="shipped">Shipped</option>
                <option value="given">Given</option>
                <option value="archived">Archived</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onStatusModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUpdateStatus} 
              isLoading={isUpdatingStatus}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Schedule Auto-Send Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={onScheduleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Auto-Send</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              We'll automatically purchase and send this gift to {recipient?.name} on the selected date.
            </Text>
            <FormControl>
              <FormLabel>Send Date</FormLabel>
              <Input 
                type="date" 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onScheduleModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleScheduleAutoSend} 
              isLoading={isScheduling}
            >
              Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default GiftDetailPage; 