import React, { useEffect, useState, useRef } from 'react';
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
  useToast,
  Tooltip
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
import { showErrorToast } from '../utils/toastUtils';
import { useAuthStore } from '../store/authStore';
import { getPlanById } from '../services/subscription/plans';

const RecipientsListPage: React.FC = () => {
  const toast = useToast();
  const { 
    recipients, 
    loading, 
    error, 
    fetchRecipients, 
    deleteRecipient 
  } = useRecipientStore();
  const { user, demoMode } = useAuthStore();
  const planId = user?.planId || 'free';
  const plan = getPlanById(planId);
  const atRecipientLimit = !demoMode && plan && plan.recipientLimit !== Infinity && recipients.length >= plan.recipientLimit;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const firstLoad = useRef(true);

  // Load recipients on mount
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Monitor recipients changes
  useEffect(() => {
    if (recipients.length > 0 && firstLoad.current) {
      toast({
        title: `Found ${recipients.length} recipients`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      firstLoad.current = false;
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
        showErrorToast(toast, error, { title: 'Error deleting recipient' });
      } finally {
        setIsDeleting(null);
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

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="xl">Recipients</Heading>
        <Tooltip
          label={atRecipientLimit ? 'Upgrade to Pro for unlimited recipients' : ''}
          isDisabled={!atRecipientLimit}
        >
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            isDisabled={atRecipientLimit}
          >
            Add Recipient
          </Button>
        </Tooltip>
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