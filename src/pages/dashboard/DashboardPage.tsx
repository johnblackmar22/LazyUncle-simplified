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
import { formatDistanceToNow, isWithinInterval, addDays, parseISO, format, startOfDay, differenceInDays } from 'date-fns';
import { getNextBirthday, getNextChristmas } from '../../utils/dateUtils';

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
      const today = startOfDay(new Date());
      
      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'anniversary') {
        // For annual events, get the next occurrence
        const [, month, day] = occasion.date.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        
        // Try this year first
        let nextOccurrence = new Date(currentYear, month - 1, day);
        if (nextOccurrence < today) {
          // If it's already passed this year, use next year
          nextOccurrence = new Date(currentYear + 1, month - 1, day);
        }
        
        const daysUntil = differenceInDays(nextOccurrence, today);
        return daysUntil >= 0 && daysUntil <= 60;
      } else {
        // For one-time events, use the actual date
        const [year, month, day] = occasion.date.split('-').map(Number);
        const occasionDate = new Date(year, month - 1, day);
        const daysUntil = differenceInDays(occasionDate, today);
        return daysUntil >= 0 && daysUntil <= 60;
      }
    })
    .sort((a, b) => {
      // Sort by next occurrence date
      const getNextOccurrenceDate = (occasion: any) => {
        if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'anniversary') {
          const [, month, day] = occasion.date.split('-').map(Number);
          const currentYear = new Date().getFullYear();
          const today = startOfDay(new Date());
          
          let nextOccurrence = new Date(currentYear, month - 1, day);
          if (nextOccurrence < today) {
            nextOccurrence = new Date(currentYear + 1, month - 1, day);
          }
          return nextOccurrence;
        } else {
          const [year, month, day] = occasion.date.split('-').map(Number);
          return new Date(year, month - 1, day);
        }
      };
      
      return getNextOccurrenceDate(a).getTime() - getNextOccurrenceDate(b).getTime();
    });

  // Calculate stats
  const totalRecipients = recipients.length;
  const totalOccasions = upcomingOccasions.length;

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
        userId: user?.id || '',
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
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading 
            as="h1" 
            size="2xl" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
            mb={4}
          >
            Welcome back!
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Here's what's happening with your gift planning
          </Text>
        </Box>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6}>
          <Card bg="linear-gradient(135deg, blue.400, blue.600)" color="white" shadow="lg" borderRadius="xl">
            <CardBody p={6}>
              <VStack spacing={2} align="start">
                <HStack justify="space-between" w="full">
                  <Icon as={FaUser} boxSize="24px" opacity={0.8} />
                  <Text fontSize="sm" fontWeight="medium" opacity={0.9}>Recipients</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
                  {totalRecipients}
                </Text>
                <Text fontSize="xs" opacity={0.8}>
                  {totalRecipients === 1 ? 'person' : 'people'} to gift
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="linear-gradient(135deg, purple.400, purple.600)" color="white" shadow="lg" borderRadius="xl">
            <CardBody p={6}>
              <VStack spacing={2} align="start">
                <HStack justify="space-between" w="full">
                  <Icon as={FaCalendarAlt} boxSize="24px" opacity={0.8} />
                  <Text fontSize="sm" fontWeight="medium" opacity={0.9}>Occasions</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
                  {totalOccasions}
                </Text>
                <Text fontSize="xs" opacity={0.8}>
                  in next 60 days
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="linear-gradient(135deg, green.400, green.600)" color="white" shadow="lg" borderRadius="xl">
            <CardBody p={6}>
              <VStack spacing={2} align="start">
                <HStack justify="space-between" w="full">
                  <Icon as={FaGift} boxSize="24px" opacity={0.8} />
                  <Text fontSize="sm" fontWeight="medium" opacity={0.9}>Gifts Ready</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
                  0
                </Text>
                <Text fontSize="xs" opacity={0.8}>
                  awaiting approval
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="linear-gradient(135deg, orange.400, orange.600)" color="white" shadow="lg" borderRadius="xl">
            <CardBody p={6}>
              <VStack spacing={2} align="start">
                <HStack justify="space-between" w="full">
                  <Icon as={FaClock} boxSize="24px" opacity={0.8} />
                  <Text fontSize="sm" fontWeight="medium" opacity={0.9}>Time Saved</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
                  {totalOccasions * 2}h
                </Text>
                <Text fontSize="xs" opacity={0.8}>
                  this month
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Quick Actions */}
        <Card bg={bgColor} shadow="md" borderRadius="xl" borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={3}>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Button
                as={RouterLink}
                to="/recipients/add"
                leftIcon={<Icon as={FaUser} />}
                colorScheme="blue"
                variant="outline"
                size="lg"
                h="auto"
                py={4}
                flexDirection="column"
                gap={2}
              >
                <Text fontWeight="semibold">Add Recipient</Text>
                <Text fontSize="xs" opacity={0.7}>Start gifting someone new</Text>
              </Button>

              <Button
                as={RouterLink}
                to="/recipients"
                leftIcon={<Icon as={FaCalendarAlt} />}
                colorScheme="purple"
                variant="outline"
                size="lg"
                h="auto"
                py={4}
                flexDirection="column"
                gap={2}
              >
                <Text fontWeight="semibold">Add Occasion</Text>
                <Text fontSize="xs" opacity={0.7}>Set up gift timing</Text>
              </Button>

              <Button
                leftIcon={<Icon as={FaGift} />}
                colorScheme="green"
                variant="outline"
                size="lg"
                h="auto"
                py={4}
                flexDirection="column"
                gap={2}
                isDisabled
              >
                <Text fontWeight="semibold">View Suggestions</Text>
                <Text fontSize="xs" opacity={0.7}>Coming soon</Text>
              </Button>

              <Button
                leftIcon={<Icon as={FaClock} />}
                colorScheme="orange"
                variant="outline"
                size="lg"
                h="auto"
                py={4}
                flexDirection="column"
                gap={2}
                isDisabled
              >
                <Text fontWeight="semibold">Auto-Send Setup</Text>
                <Text fontSize="xs" opacity={0.7}>Coming soon</Text>
              </Button>
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
                  <Icon as={FaCalendarAlt} boxSize="48px" color="gray.400" mb={3} />
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
                <Icon as={FaGift} boxSize="60px" color="blue.500" />
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