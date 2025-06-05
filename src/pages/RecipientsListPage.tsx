import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useBreakpointValue,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  SettingsIcon,
  ChevronDownIcon,
  CalendarIcon,
  EmailIcon,
  PhoneIcon,
  ExternalLinkIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { useAuthStore } from '../store/authStore';
import { DEMO_USER_ID } from '../utils/constants';
import { showErrorToast } from '../utils/toastUtils';
import type { Recipient } from '../types';
import { formatDate, safeFormatDate } from '../utils/dateUtils';
import { format } from 'date-fns';
import { useOccasionStore } from '../store/occasionStore';
import { FaGift, FaUser } from 'react-icons/fa';

const RecipientsListPage: React.FC = () => {
  const toast = useToast();
  const { 
    recipients, 
    loading, 
    error, 
    fetchRecipients, 
    deleteRecipient 
  } = useRecipientStore();
  const { occasions, fetchOccasions } = useOccasionStore();
  const { user, demoMode } = useAuthStore();
  const planId = user?.planId || 'free';

  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

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

  // Load recipients on mount
  useEffect(() => {
    fetchRecipients();
  }, []);

  // Load occasions for all recipients - only when recipients change
  useEffect(() => {
    console.log('RecipientsListPage - Loading occasions for recipients:', recipients.length);
    if (recipients.length > 0) {
      recipients.forEach(recipient => {
        console.log(`RecipientsListPage - Fetching occasions for: ${recipient.name} (${recipient.id})`);
        fetchOccasions(recipient.id);
      });
    }
  }, [recipients.length, fetchOccasions]); // Only trigger when number of recipients changes

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

  return (
    <Container maxW="container.xl" mt={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>Recipients</Heading>
            <Text color="gray.600">
              Manage your gift recipients and their preferences.
            </Text>
          </Box>
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            size="lg"
          >
            Add Recipient
          </Button>
        </Flex>

        {/* Search */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardBody py={4}>
            <InputGroup>
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
          </CardBody>
        </Card>

        {/* Recipients Grid */}
        {loading && !recipients.length ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : error ? (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Box p={4} bg="red.50" color="red.500" borderRadius="md">
                <Text>Error: {error}</Text>
              </Box>
            </CardBody>
          </Card>
        ) : filteredRecipients.length === 0 ? (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardBody>
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
            </CardBody>
          </Card>
        ) : (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Flex align="center" gap={2}>
                <Icon as={FaUser} color="blue.500" />
                <Heading size="md">Your Recipients ({filteredRecipients.length})</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
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
                        {recipient.birthdate && (() => {
                          const birthdayInfo = formatBirthdayWithAge(recipient.birthdate);
                          return birthdayInfo && (
                            <>
                              <Text fontSize="sm">
                                <strong>Birthday:</strong> {birthdayInfo.monthDay}
                              </Text>
                              <Text fontSize="sm">
                                <strong>Age:</strong> {birthdayInfo.age} years old
                              </Text>
                            </>
                          );
                        })()}
                        
                        {recipient.interests && recipient.interests.length > 0 && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={1}>
                              Interests:
                            </Text>
                            <Flex gap={1} flexWrap="wrap">
                              {recipient.interests.slice(0, 3).map((interest, index) => (
                                <Badge key={index} colorScheme={getInterestColor(index)} variant="subtle">
                                  {interest}
                                </Badge>
                              ))}
                              {recipient.interests.length > 3 && (
                                <Badge colorScheme="gray" variant="subtle">
                                  +{recipient.interests.length - 3} more
                                </Badge>
                              )}
                            </Flex>
                          </Box>
                        )}
                        
                        {occasions && occasions[recipient.id] && occasions[recipient.id].length > 0 && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={1}>
                              Gift Occasions:
                            </Text>
                            <Flex gap={1} flexWrap="wrap">
                              {occasions[recipient.id].slice(0, 3).map((occasion) => (
                                <Badge key={occasion.id} colorScheme="purple" variant="subtle" fontSize="xs" display="flex" alignItems="center">
                                  <FaGift style={{ marginRight: 4 }} /> {occasion.name}
                                </Badge>
                              ))}
                              {occasions[recipient.id].length > 3 && (
                                <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                                  +{occasions[recipient.id].length - 3} more
                                </Badge>
                              )}
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
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default RecipientsListPage; 