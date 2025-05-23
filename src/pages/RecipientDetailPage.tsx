import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  useColorModeValue
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { format } from 'date-fns';
import type { Recipient } from '../types';
import { showErrorToast } from '../utils/toastUtils';
import { safeFormatDate } from '../utils/dateUtils';
import { useGiftStore } from '../store/giftStore';
import { useOccasionStore } from '../store/occasionStore';

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
  const { createGift } = useGiftStore();
  const { occasions, fetchOccasions } = useOccasionStore();
  
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

  useEffect(() => {
    fetchRecipients();
    if (id) fetchOccasions(id);
  }, [fetchRecipients, fetchOccasions, id]);
  
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
  
  // Format birthdate to readable format
  const formatBirthdate = (date: string | undefined) => {
    if (!date) return 'Not set';
    try {
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const age = new Date().getFullYear() - year - (new Date() < new Date(new Date().getFullYear(), month - 1, day) ? 1 : 0);
      return `${dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} (${age} years old)`;
    } catch {
      return date;
    }
  };
  
  // Calculate days until birthdate
  const getDaysUntilBirthday = (birthdate: Date | string | number | undefined) => {
    if (!birthdate) return null;
    
    try {
      const birthdateObj = birthdate instanceof Date ? birthdate : new Date(birthdate);
      const today = new Date();
      
      // Create this year's birthday
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthdateObj.getMonth(),
        birthdateObj.getDate()
      );
      
      // If this year's birthday has passed, use next year's
      if (today > thisYearBirthday) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      // Calculate days difference
      const diffTime = Math.abs(thisYearBirthday.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating days until birthday:', error);
      return null;
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
                  as={RouterLink}
                  to={`/gifts/add/${currentRecipient.id}`}
                  colorScheme="purple"
                  leftIcon={<AddIcon />}
                  w={{ base: 'full', md: 'auto' }}
                >
                  Add Gift
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
              {currentRecipient.birthdate ? (
                <Flex justify="space-between" align="center">
                  <Text>{safeFormatDate(currentRecipient.birthdate)}</Text>
                  {getDaysUntilBirthday(currentRecipient.birthdate) !== null && (
                    <Badge 
                      colorScheme={getDaysUntilBirthday(currentRecipient.birthdate)! <= 7 ? "red" : 
                                getDaysUntilBirthday(currentRecipient.birthdate)! <= 30 ? "orange" : "blue"}
                    >
                      {getDaysUntilBirthday(currentRecipient.birthdate) === 0 
                        ? "Today!" 
                        : getDaysUntilBirthday(currentRecipient.birthdate) === 1 
                          ? "Tomorrow!" 
                          : `${getDaysUntilBirthday(currentRecipient.birthdate)} days`}
                    </Badge>
                  )}
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

          {currentRecipient.giftPreferences && (
            <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
              <CardHeader pb={0}>
                <Heading size="md">Gift Preferences</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {currentRecipient.giftPreferences.priceRange && (
                    <Box>
                      <Text fontWeight="bold">Price Range</Text>
                      <Text>${currentRecipient.giftPreferences.priceRange.min} - ${currentRecipient.giftPreferences.priceRange.max}</Text>
                    </Box>
                  )}
                  
                  {currentRecipient.giftPreferences.categories && currentRecipient.giftPreferences.categories.length > 0 && (
                    <Box>
                      <Text fontWeight="bold">Preferred Categories</Text>
                      <Flex gap={1} flexWrap="wrap" mt={1}>
                        {currentRecipient.giftPreferences.categories.map((category, index) => (
                          <Badge key={index} colorScheme="blue" variant="subtle">
                            {category}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </SimpleGrid>
              </CardBody>
            </Card>
          )}

          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Heading size="md">Occasions</Heading>
            </CardHeader>
            <CardBody>
              {id && occasions && Array.isArray(occasions[id]) && occasions[id].length > 0 ? (
                <VStack align="start" spacing={2}>
                  {occasions[id].map((occasion: any) => (
                    <Box key={occasion.id} p={2} borderWidth="1px" borderRadius="md" w="100%">
                      <Text fontWeight="bold">{occasion.name} <Badge ml={2}>{occasion.type}</Badge></Text>
                      <Text fontSize="sm">{new Date(occasion.date).toLocaleDateString()}</Text>
                      {occasion.notes && <Text fontSize="sm" color="gray.500">{occasion.notes}</Text>}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500">No occasions added yet.</Text>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}; 