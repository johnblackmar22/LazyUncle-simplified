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
  Container,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';
import { useOccasionStore } from '../../store/occasionStore';
import { FaGift, FaCalendarAlt, FaUser, FaClock } from 'react-icons/fa';
import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { formatDistanceToNow, isWithinInterval, addDays, parseISO, format, startOfDay } from 'date-fns';
import { getNextBirthday, getNextChristmas } from '../../utils/dateUtils';
import GiftSuggestionWorkflowService from '../../services/giftSuggestionWorkflow';

const DashboardPage: React.FC = () => {
  const { recipients, fetchRecipients } = useRecipientStore();
  const { demoMode } = useAuthStore();
  const { occasions, addOccasion, fetchOccasions } = useOccasionStore();
  const { user } = useAuthStore();
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (demoMode) {
        const recipients = JSON.parse(localStorage.getItem('lazyuncle_recipients') || '[]');
        if (!recipients.length) {
          initializeDemoData();
        }
      }
      
      await fetchRecipients();
    };
    
    loadData();
  }, [fetchRecipients, demoMode]);

  // Load occasions when recipients change (separate effect)
  useEffect(() => {
    console.log('DashboardPage - Loading occasions for recipients:', recipients.length);
    if (recipients.length > 0) {
      recipients.forEach(recipient => {
        console.log(`DashboardPage - Fetching occasions for recipient: ${recipient.name} (${recipient.id})`);
        fetchOccasions(recipient.id);
      });
    }
  }, [recipients.length, fetchOccasions]);
  
  // Calculate stats
  const totalRecipients = recipients.length;
  const totalOccasions = Object.values(occasions).flat().length;
  
  // Get pending suggestions count (occasions that need gift suggestions)
  const pendingSuggestions = Object.values(occasions).flat().filter(occasion => {
    // Check if occasion has suggestions that are ready for review or no suggestions yet
    const preview = GiftSuggestionWorkflowService.getPreview(occasion.id);
    if (!preview) {
      // No suggestions generated yet - this counts as pending
      return true;
    }
    // Count as pending if suggestions are shown but not approved/rejected
    return preview.status === 'preview_shown';
  }).length;

  // Get upcoming occasions (within next 60 days)
  const upcomingOccasions = Object.entries(occasions)
    .flatMap(([recipientId, recipientOccasions]) => 
      recipientOccasions.map(occasion => ({
        ...occasion,
        recipientId,
        recipient: recipients.find(r => r.id === recipientId)
      }))
    )
    .filter(occasion => {
      if (!occasion.date) return false;
      try {
        let occasionDate: Date;
        
        // Handle recurring annual events (birthday, Christmas, anniversary)
        if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'anniversary') {
          // For annual events, we need to find the next occurrence in local timezone
          const [year, month, day] = occasion.date.split('-').map(Number);
          const currentYear = new Date().getFullYear();
          const today = startOfDay(new Date());
          
          // Create this year's date in local timezone
          let thisYearDate = new Date(currentYear, month - 1, day);
          
          // If this year's date has passed, use next year
          if (thisYearDate < today) {
            thisYearDate = new Date(currentYear + 1, month - 1, day);
          }
          
          occasionDate = thisYearDate;
        } else {
          // For one-time events, parse in local timezone
          const [year, month, day] = occasion.date.split('-').map(Number);
          occasionDate = new Date(year, month - 1, day);
        }
        
        const today = startOfDay(new Date());
        const in60Days = addDays(today, 60);
        return isWithinInterval(occasionDate, { start: today, end: in60Days });
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        // Calculate the actual next occurrence date for sorting
        const getNextOccurrenceDate = (occasion: any) => {
          if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'anniversary') {
            const [year, month, day] = occasion.date.split('-').map(Number);
            const currentYear = new Date().getFullYear();
            const today = startOfDay(new Date());
            let thisYearDate = new Date(currentYear, month - 1, day);
            if (thisYearDate < today) {
              thisYearDate = new Date(currentYear + 1, month - 1, day);
            }
            return thisYearDate;
          }
          const [year, month, day] = occasion.date.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        return getNextOccurrenceDate(a).getTime() - getNextOccurrenceDate(b).getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 5); // Show only next 5

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

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

  // Helper function to format birthday
  const formatBirthdayWithAge = (birthdate?: string) => {
    if (!birthdate) return null;
    
    try {
      // Parse date in local timezone
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

  return (
    <Container maxW="container.xl" mt={4}>
      <VStack spacing={8} align="stretch">
        {/* Welcome Header with Add Recipient Button */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" mb={2}>
              Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Here's what's happening with your gift management
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

        {/* Overview Stats */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Flex align="center" gap={2}>
              <Icon as={FaGift} color="blue.500" />
              <Heading size="md">Overview</Heading>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaUser} color="blue.500" />
                    <Text>Recipients</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="3xl" color="blue.500">
                  {totalRecipients}
                </StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaCalendarAlt} color="purple.500" />
                    <Text>Gift Occasions</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="3xl" color="purple.500">
                  {totalOccasions}
                </StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={FaClock} color="orange.500" />
                    <Text>Pending Reviews</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="3xl" color="orange.500">
                  {pendingSuggestions}
                </StatNumber>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Recipients Grid */}
          {recipients.length > 0 && (
            <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={2}>
                    <Icon as={FaUser} color="blue.500" />
                    <Heading size="md">Your Recipients</Heading>
                  </Flex>
                  <Button
                    as={RouterLink}
                    to="/recipients"
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                  >
                    View All
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {recipients.slice(0, 6).map((recipient) => (
                    <Card 
                      key={recipient.id}
                      size="sm"
                      variant="outline"
                      cursor="pointer"
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                      onClick={() => navigate(`/recipients/${recipient.id}`)}
                    >
                      <CardBody p={3}>
                        <Flex align="center" gap={3}>
                          <Avatar name={recipient.name} size="sm" />
                          <Box flex="1" minW="0">
                            <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                              {recipient.name}
                            </Text>
                            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                              {recipient.relationship || 'Recipient'}
                            </Badge>
                          </Box>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                {recipients.length > 6 && (
                  <Text textAlign="center" mt={4} fontSize="sm" color="gray.500">
                    +{recipients.length - 6} more recipients
                  </Text>
                )}
              </CardBody>
            </Card>
          )}

          {/* Upcoming Occasions */}
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Flex align="center" gap={2}>
                <Icon as={FaCalendarAlt} color="purple.500" />
                <Heading size="md">Upcoming Occasions</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              {upcomingOccasions.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {upcomingOccasions.map((occasion) => {
                    // Calculate the display date (next occurrence for annual events)
                    let displayDate: Date;
                    if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'anniversary') {
                      const [year, month, day] = occasion.date.split('-').map(Number);
                      const currentYear = new Date().getFullYear();
                      const today = startOfDay(new Date());
                      displayDate = new Date(currentYear, month - 1, day);
                      if (displayDate < today) {
                        displayDate = new Date(currentYear + 1, month - 1, day);
                      }
                    } else {
                      const [year, month, day] = occasion.date.split('-').map(Number);
                      displayDate = new Date(year, month - 1, day);
                    }

                    return (
                      <Box 
                        key={`${occasion.recipientId}-${occasion.id}`}
                        p={3}
                        borderRadius="md"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        cursor="pointer"
                        _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                        onClick={() => navigate(`/recipients/${occasion.recipientId}`)}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Avatar name={occasion.recipient?.name} size="sm" />
                            <Box>
                              <Text fontWeight="medium" fontSize="sm">
                                {occasion.recipient?.name} - {occasion.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {format(displayDate, 'MMM dd, yyyy')}
                              </Text>
                            </Box>
                          </HStack>
                          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                            {formatDistanceToNow(displayDate, { addSuffix: true })}
                          </Badge>
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              ) : (
                <Box textAlign="center" py={8}>
                  <Icon as={FaCalendarAlt} size="2xl" color="gray.400" mb={3} />
                  <Text color="gray.500" fontSize="sm">
                    No upcoming occasions in the next 60 days
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Add occasions to your recipients to see them here
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Getting Started (for new users) */}
        {totalRecipients === 0 && (
          <Card bg="blue.50" shadow="md" borderRadius="lg" borderColor="blue.200" borderWidth="1px">
            <CardBody>
              <VStack spacing={4} textAlign="center">
                <Icon as={FaGift} size="3xl" color="blue.500" />
                <Heading size="lg" color="blue.700">
                  Ready to start gifting?
                </Heading>
                <Text color="blue.600" maxW="md">
                  Add your first recipient to begin setting up automated gift suggestions and delivery.
                </Text>
                <Button
                  as={RouterLink}
                  to="/recipients/add"
                  colorScheme="blue"
                  size="lg"
                  leftIcon={<AddIcon />}
                >
                  Add Your First Recipient
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default DashboardPage; 