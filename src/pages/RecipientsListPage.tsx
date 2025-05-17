import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { 
  AddIcon, 
  SearchIcon, 
  EditIcon, 
  DeleteIcon 
} from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { formatDate } from '../utils/dateUtils';
import { format } from 'date-fns';

const RecipientsListPage: React.FC = () => {
  const toast = useToast();
  const { 
    recipients, 
    loading, 
    error, 
    fetchRecipients, 
    deleteRecipient 
  } = useRecipientStore();
  
  // Debug: Log recipients and store state
  console.log('RecipientsListPage - Recipients:', recipients);
  console.log('RecipientsListPage - Store state:', useRecipientStore.getState());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load recipients on mount
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Monitor recipients changes
  useEffect(() => {
    console.log('Recipients array changed:', recipients);
    if (recipients.length > 0) {
      toast({
        title: `Found ${recipients.length} recipients`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [recipients, toast]);

  // Filter recipients by search query
  const filteredRecipients = recipients.filter(recipient => 
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recipient.relationship && recipient.relationship.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      setIsDeleting(id);
      try {
        await deleteRecipient(id);
        toast({
          title: 'Recipient deleted',
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
        setIsDeleting(null);
      }
    }
  };

  // Format birthdate to readable format
  const formatBirthdate = (date: Date | string | number | undefined) => {
    if (!date) return 'Not set';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  console.log('Recipients:', recipients);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="xl">Recipients</Heading>
        <Button
          as={RouterLink}
          to="/recipients/add"
          colorScheme="blue"
          leftIcon={<AddIcon />}
        >
          Add Recipient
        </Button>
      </Flex>

      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search recipients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          bg={bgColor}
          borderColor={borderColor}
        />
      </InputGroup>

      {loading && !recipients.length ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : error ? (
        <Box p={4} bg="red.50" color="red.500" borderRadius="md">
          <Text>Error: {error}</Text>
        </Box>
      ) : filteredRecipients.length === 0 ? (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg" mb={4}>No recipients found</Text>
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            leftIcon={<AddIcon />}
          >
            Add Your First Recipient
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredRecipients.map(recipient => (
            <Card key={recipient.id} shadow="md" borderRadius="lg" bg={bgColor}>
              <CardHeader pb={0}>
                <Flex gap={4}>
                  <Flex flex="1" gap="4" alignItems="center" flexWrap="wrap">
                    <Avatar 
                      name={recipient.name} 
                      size="md" 
                    />
                    <Box>
                      <Heading size="md">{recipient.name}</Heading>
                      <Badge colorScheme="blue">{recipient.relationship || 'Not specified'}</Badge>
                    </Box>
                  </Flex>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  {recipient.birthdate && (
                    <Text fontSize="sm">
                      <strong>Birthday:</strong> {formatBirthdate(recipient.birthdate)}
                    </Text>
                  )}
                  
                  {recipient.interests && recipient.interests.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={1}>
                        Interests:
                      </Text>
                      <Flex gap={1} flexWrap="wrap">
                        {recipient.interests.map((interest, index) => (
                          <Badge key={index} colorScheme="green" variant="subtle">
                            {interest}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </VStack>
              </CardBody>
              <CardFooter>
                <HStack spacing={2} width="100%" justifyContent="space-between">
                  <Button
                    as={RouterLink}
                    to={`/recipients/${recipient.id}`}
                    colorScheme="blue"
                    size="sm"
                    variant="outline"
                  >
                    View Details
                  </Button>
                  <HStack>
                    <IconButton
                      as={RouterLink}
                      to={`/recipients/${recipient.id}/edit`}
                      aria-label="Edit recipient"
                      icon={<EditIcon />}
                      colorScheme="teal"
                      size="sm"
                      variant="ghost"
                    />
                    <IconButton
                      aria-label="Delete recipient"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      size="sm"
                      variant="ghost"
                      isLoading={isDeleting === recipient.id}
                      onClick={() => handleDelete(recipient.id)}
                    />
                  </HStack>
                </HStack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default RecipientsListPage; 