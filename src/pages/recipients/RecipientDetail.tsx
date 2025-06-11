import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  Tag,
  useColorModeValue,
  HStack,
  SimpleGrid,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useOccasionStore } from '../../store/occasionStore';
import { getNextBirthday, getCurrentDateISO } from '../../utils/dateUtils';
import { useAuthStore } from '../../store/authStore';

const RecipientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);
  
  const { recipients, deleteRecipient } = useRecipientStore();
  const { occasions, fetchOccasions, addOccasion, deleteOccasion } = useOccasionStore();
  const { user } = useAuthStore();
  const [newOccasion, setNewOccasion] = useState<{ name: string; date: string; type: 'birthday' | 'custom'; notes: string; userId?: string; recurring?: boolean }>({ name: '', date: '', type: 'custom', notes: '', userId: '', recurring: true });
  const [adding, setAdding] = useState(false);
  
  const recipient = id ? recipients.find(r => r.id === id) : undefined;
  
  useEffect(() => {
    if (id) fetchOccasions(id);
  }, [id, fetchOccasions]);
  
  const recipientOccasions = id && occasions[id] ? occasions[id] : [];
  
  // Redirect if recipient not found
  useEffect(() => {
    if (id && !recipient && recipients.length > 0) {
      toast({
        title: 'Recipient not found',
        description: 'The recipient you are looking for does not exist.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    }
  }, [id, recipient, recipients, navigate, toast]);
  
  // Auto-fill date when occasion type changes
  useEffect(() => {
    if (newOccasion.type === 'birthday' && recipient?.birthdate) {
      const nextBirthday = getNextBirthday(recipient.birthdate);
      setNewOccasion(prev => ({ ...prev, date: nextBirthday, name: 'Birthday' }));
    } else if (newOccasion.type === 'birthday' && !recipient?.birthdate) {
      // If no birthdate set, use a date in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
      const futureDateISO = futureDate.toISOString().split('T')[0];
      setNewOccasion(prev => ({ ...prev, date: futureDateISO, name: 'Birthday' }));
    } else if (newOccasion.type === 'custom') {
      setNewOccasion(prev => ({ ...prev, name: '' }));
    }
  }, [newOccasion.type, recipient?.birthdate]);
  
  const handleDelete = () => {
    if (id) {
      deleteRecipient(id);
      toast({
        title: 'Recipient deleted',
        description: 'The recipient has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    }
    onClose();
  };
  
  const handleAddOccasion = async () => {
    if (!id || !newOccasion.name || !newOccasion.date) return;
    
    // Check if recipient has delivery address
    if (!recipient?.deliveryAddress) {
      toast({
        title: 'Delivery Address Required',
        description: `Please add a delivery address for ${recipient?.name} before creating gift occasions.`,
        status: 'warning',
        duration: 6000,
        isClosable: true,
      });
      return;
    }
    
    setAdding(true);
    try {
      console.log('Adding occasion:', { recipientId: id, ...newOccasion });
      const occasionData = {
        name: newOccasion.name,
        date: newOccasion.date,
        type: newOccasion.type,
        notes: newOccasion.notes,
        recurring: newOccasion.recurring,
        userId: user?.id || ''
      };
      const result = await addOccasion(id, occasionData);
      if (!result) {
        toast({
          title: 'Failed to add occasion',
          description: 'No occasion was created. Check your connection and permissions.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Occasion added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        // Refetch occasions to update UI
        await fetchOccasions(id);
      }
    } catch (error) {
      console.error('Error adding occasion:', error);
      toast({
        title: 'Error adding occasion',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    setNewOccasion({ name: '', date: '', type: 'custom', notes: '', userId: '', recurring: true });
    setAdding(false);
  };
  
  const handleDeleteOccasion = async (occasionId: string) => {
    if (!id) return;
    await deleteOccasion(occasionId, id);
  };
  
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (!recipient) {
    return (
      <Container maxW="container.lg" py={5}>
        <Box textAlign="center" py={10}>
          <Text>Loading recipient information...</Text>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.lg" py={5}>
      <Flex justify="space-between" align="center" mb={5}>
        <Heading as="h1" size="lg">{recipient.name}</Heading>
        <HStack>
          <Button
            as={RouterLink}
            to={`/recipients/edit/${id}`}
            colorScheme="blue"
            variant="outline"
          >
            Edit
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
          >
            Delete
          </Button>
        </HStack>
      </Flex>
      
      <Box
        bg={boxBg}
        p={6}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Heading as="h3" size="md" mb={3}>
              Basic Information
            </Heading>
            <Stack spacing={3}>
              <Box>
                <Text fontWeight="bold">Relationship</Text>
                <Text>{recipient.relationship}</Text>
              </Box>
              
              {recipient.interests.length > 0 && (
                <Box>
                  <Text fontWeight="bold">Interests</Text>
                  <Flex wrap="wrap" gap={2} mt={1}>
                    {recipient.interests.map((interest: string, index: number) => (
                      <Tag key={index} colorScheme="blue">
                        {interest}
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              )}
            </Stack>
          </Box>
        </SimpleGrid>
      </Box>
      
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Gifts</Tab>
          <Tab>Important Dates</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <Heading as="h3" size="md" mb={4}>Occasions for {recipient.name}</Heading>
            {recipientOccasions.length === 0 ? (
              <Text mb={4}>No occasions added yet.</Text>
            ) : (
              <Stack spacing={3} mb={4}>
                {recipientOccasions.map(occasion => (
                  <Box key={occasion.id} p={3} borderWidth="1px" borderRadius="md" display="flex" alignItems="center" justifyContent="space-between">
                    <Box textAlign="left">
                      <Text fontWeight="bold">
                        {occasion.name} 
                        <Badge ml={2} colorScheme="blue">{occasion.type}</Badge>
                        {occasion.recurring && <Badge ml={2} colorScheme="purple">🔄 Annual</Badge>}
                      </Text>
                      <Text fontSize="sm">{new Date(occasion.date).toLocaleDateString()}</Text>
                      {occasion.notes && <Text fontSize="sm" color="gray.500">{occasion.notes}</Text>}
                    </Box>
                    <Button size="xs" colorScheme="red" onClick={() => handleDeleteOccasion(occasion.id)}>Delete</Button>
                  </Box>
                ))}
              </Stack>
            )}
            <Box mt={6} textAlign="left">
              <Heading as="h5" size="sm" mb={2}>Add New Occasion</Heading>
              {!recipient.deliveryAddress && (
                <Box mb={4} p={3} bg="orange.50" borderColor="orange.200" borderWidth="1px" borderRadius="md">
                  <Text fontSize="sm" color="orange.800" mb={2}>
                    <strong>Delivery Address Required:</strong> Please add a delivery address for {recipient.name} before creating gift occasions.
                  </Text>
                  <Button
                    as={RouterLink}
                    to={`/recipients/edit/${id}`}
                    size="xs"
                    colorScheme="orange"
                    variant="outline"
                  >
                    Add Address
                  </Button>
                </Box>
              )}
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={2} mb={2}>
                <input
                  type="text"
                  placeholder="Occasion Name"
                  value={newOccasion.name}
                  onChange={e => setNewOccasion({ ...newOccasion, name: e.target.value })}
                  className="border rounded p-2"
                  disabled={!recipient.deliveryAddress}
                />
                <input
                  type="date"
                  value={newOccasion.date}
                  onChange={e => setNewOccasion({ ...newOccasion, date: e.target.value })}
                  className="border rounded p-2"
                  disabled={!recipient.deliveryAddress}
                />
                <select
                  value={newOccasion.type}
                  onChange={e => setNewOccasion({ ...newOccasion, type: e.target.value as 'birthday' | 'custom' })}
                  className="border rounded p-2"
                  disabled={!recipient.deliveryAddress}
                >
                  <option value="birthday">Birthday</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newOccasion.notes}
                  onChange={e => setNewOccasion({ ...newOccasion, notes: e.target.value })}
                  className="border rounded p-2"
                  disabled={!recipient.deliveryAddress}
                />
              </SimpleGrid>
              <Button 
                colorScheme="blue" 
                size="sm" 
                onClick={handleAddOccasion} 
                isLoading={adding} 
                mt={2}
                isDisabled={!recipient.deliveryAddress}
              >
                Add Occasion
              </Button>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Recipient
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {recipient.name}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default RecipientDetail; 