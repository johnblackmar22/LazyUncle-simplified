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
  IconButton,
  Collapse,
  Tooltip,
  Center,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';
import { useOccasionStore } from '../../store/occasionStore';
import { useGiftStore } from '../../store/giftStore';
import { 
  FaGift, 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaExpand, 
  FaCompress, 
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaRedo,
  FaEdit
} from 'react-icons/fa';
import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { 
  formatDistanceToNow, 
  isWithinInterval, 
  addDays, 
  parseISO, 
  format, 
  startOfDay, 
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
} from 'date-fns';
import { getNextBirthday, getNextChristmas } from '../../utils/dateUtils';

const DashboardPage: React.FC = () => {
  const { recipients, fetchRecipients } = useRecipientStore();
  const { demoMode } = useAuthStore();
  const { occasions, addOccasion, fetchOccasions } = useOccasionStore();
  const { gifts, fetchGifts } = useGiftStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [expandedRecipients, setExpandedRecipients] = useState<Set<string>>(new Set());

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

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
      await fetchGifts();
    };
    
    loadData();
  }, [fetchRecipients, fetchGifts, demoMode]);

  // Load occasions when recipients change
  useEffect(() => {
    console.log('🗓️ Dashboard - Loading occasions for recipients:', recipients.length);
    if (recipients.length > 0) {
      recipients.forEach(recipient => {
        console.log(`🗓️ Dashboard - Fetching occasions for: ${recipient.name} (${recipient.id})`);
        fetchOccasions(recipient.id);
      });
    }
  }, [recipients.length, fetchOccasions]);
  
  // Get all occasions with recipients
  const allOccasions = Object.entries(occasions)
    .flatMap(([recipientId, recipientOccasions]) => 
      recipientOccasions.map(occasion => ({
        ...occasion,
        recipientId,
        recipient: recipients.find(r => r.id === recipientId)
      }))
    )
    .filter(occasion => occasion.recipient);

  // Debug logging for occasions
  useEffect(() => {
    console.log('🗓️ Dashboard - Occasions state:', occasions);
    console.log('🗓️ Dashboard - All occasions processed:', allOccasions.length);
    console.log('🗓️ Dashboard - Recipients with occasions:', Object.keys(occasions));
  }, [occasions, allOccasions.length]);

  // Get upcoming occasions (next 30 days)
  const upcomingOccasions = allOccasions
    .filter(occasion => {
      const today = startOfDay(new Date());
      const thirtyDaysFromNow = addDays(today, 30);
      
      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
        const [, month, day] = occasion.date.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        
        let nextOccurrence = new Date(currentYear, month - 1, day);
        if (nextOccurrence < today) {
          nextOccurrence = new Date(currentYear + 1, month - 1, day);
        }
        
        return nextOccurrence <= thirtyDaysFromNow;
      } else {
        const [year, month, day] = occasion.date.split('-').map(Number);
        const occasionDate = new Date(year, month - 1, day);
        return occasionDate >= today && occasionDate <= thirtyDaysFromNow;
      }
    })
    .sort((a, b) => {
      const getNextOccurrenceDate = (occasion: any) => {
        if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
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
    })
    .slice(0, 5);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days from previous month
    const startDay = getDay(start);
    const paddingDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      paddingDays.push(addDays(start, -i - 1));
    }
    
    return [...paddingDays, ...days];
  };

  const getOccasionsForDate = (date: Date) => {
    return allOccasions.filter(occasion => {
      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
        const [, month, day] = occasion.date.split('-').map(Number);
        return date.getMonth() === month - 1 && date.getDate() === day;
      } else {
        const [year, month, day] = occasion.date.split('-').map(Number);
        const occasionDate = new Date(year, month - 1, day);
        return isSameDay(date, occasionDate);
      }
    });
  };

  // Stats calculations
  const totalRecipients = recipients.length;
  const totalOccasions = allOccasions.length;
  const upcomingCount = upcomingOccasions.length;
  const completedGifts = gifts.filter(g => g.status === 'delivered').length;

  const daysInMonth = getDaysInMonth(currentDate);
  const monthsInYear = eachMonthOfInterval({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });

  return (
    <Container maxW="container.xl" mt={{ base: 2, md: 4 }} px={{ base: 2, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <Flex 
          direction={{ base: "column", sm: "row" }} 
          justify="space-between" 
          align={{ base: "stretch", sm: "center" }} 
          gap={{ base: 3, md: 0 }}
        >
          <Box>
            <Heading size={{ base: "lg", md: "xl" }} mb={2}>Gift Calendar</Heading>
            <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
              Your gift planning overview
            </Text>
          </Box>
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            size={{ base: "md", md: "lg" }}
            width={{ base: "full", sm: "auto" }}
          >
            Add Recipient
          </Button>
        </Flex>

        {/* Top Row: Mini Calendar + Upcoming Events + Quick Stats */}
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "300px 1fr 250px" }} gap={{ base: 4, md: 6 }}>
          {/* Mini Calendar */}
          <Card bg={bgColor} shadow="md" borderRadius="lg" order={{ base: 2, lg: 1 }}>
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="semibold" fontSize="sm">
                  {format(currentDate, 'MMMM yyyy')}
                </Text>
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<FaChevronLeft />}
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    aria-label="Previous month"
                  />
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<FaChevronRight />}
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    aria-label="Next month"
                  />
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <Grid templateColumns="repeat(7, 1fr)" gap={1} fontSize="xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <Center key={day} h="6" fontWeight="semibold" color="gray.500">
                    {day}
                  </Center>
                ))}
                {daysInMonth.map((day, index) => {
                  const dayOccasions = getOccasionsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <Tooltip
                      key={index}
                      label={dayOccasions.length > 0 ? 
                        dayOccasions.map(o => `${o.recipient?.name}: ${o.name}`).join(', ') : 
                        ''
                      }
                      isDisabled={dayOccasions.length === 0}
                      placement="top"
                      hasArrow
                    >
                      <Center
                        h="6"
                        borderRadius="sm"
                        bg={isToday ? 'blue.500' : dayOccasions.length > 0 ? 'purple.100' : 'transparent'}
                        color={isToday ? 'white' : !isCurrentMonth ? 'gray.400' : dayOccasions.length > 0 ? 'purple.700' : 'inherit'}
                        fontWeight={isToday || dayOccasions.length > 0 ? 'semibold' : 'normal'}
                        cursor={dayOccasions.length > 0 ? 'pointer' : 'default'}
                        position="relative"
                      >
                        {day.getDate()}
                        {dayOccasions.length > 0 && (
                          <Box
                            position="absolute"
                            top="0"
                            right="0"
                            w="2"
                            h="2"
                            bg="purple.500"
                            borderRadius="full"
                          />
                        )}
                      </Center>
                    </Tooltip>
                  );
                })}
              </Grid>
            </CardBody>
          </Card>

          {/* Upcoming Events */}
          <Card bg={bgColor} shadow="md" borderRadius="lg" order={{ base: 1, lg: 2 }}>
            <CardHeader>
              <Flex align="center" gap={2}>
                <Icon as={FaCalendarAlt} color="purple.500" />
                <Heading size="sm">Next 30 Days</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              {upcomingOccasions.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {upcomingOccasions.map((occasion) => {
                    const getNextOccurrenceDate = (occasion: any) => {
                      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
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

                    const displayDate = getNextOccurrenceDate(occasion);
                    const daysUntil = differenceInDays(displayDate, startOfDay(new Date()));

                    return (
                      <Flex 
                        key={`${occasion.recipientId}-${occasion.id}`}
                        p={3}
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: hoverBg }}
                        onClick={() => navigate(`/recipients/${occasion.recipientId}`)}
                        justify="space-between"
                        align="center"
                        borderLeft="3px solid"
                        borderLeftColor="purple.500"
                      >
                        <Flex align="center" gap={3}>
                          <Avatar name={occasion.recipient?.name} size="sm" />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium" fontSize="sm">
                              {occasion.recipient?.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {occasion.name}
                              {occasion.recurring && (
                                <Tooltip label="Recurring annually" fontSize="sm" placement="top" hasArrow>
                                  <Icon as={FaRedo} color="gray.400" ml={1} boxSize="2.5" />
                                </Tooltip>
                              )}
                              {occasion.giftWrap && (
                                <Tooltip label="Gift wrap included" fontSize="sm" placement="top" hasArrow>
                                  <Icon as={FaGift} color="gray.400" ml={1} boxSize="2.5" />
                                </Tooltip>
                              )}
                              {occasion.personalizedNote && (
                                <Tooltip label="Personalized note included" fontSize="sm" placement="top" hasArrow>
                                  <Icon as={FaEdit} color="gray.400" ml={1} boxSize="2.5" />
                                </Tooltip>
                              )}
                            </Text>
                          </VStack>
                        </Flex>
                        
                        <VStack align="end" spacing={0}>
                          <Text fontSize="xs" fontWeight="medium">
                            {format(displayDate, 'MMM dd')}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </Text>
                        </VStack>
                      </Flex>
                    );
                  })}
                </VStack>
              ) : (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Icon as={FaCalendarAlt} boxSize="40px" color="gray.400" />
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      No upcoming occasions
                    </Text>
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card bg={bgColor} shadow="md" borderRadius="lg" order={{ base: 3, lg: 3 }}>
            <CardHeader>
              <Flex align="center" gap={2}>
                <Icon as={FaGift} color="green.500" />
                <Heading size="sm">Overview</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4}>
                <Stat textAlign="center">
                  <StatNumber fontSize="2xl" color="blue.500">{totalRecipients}</StatNumber>
                  <StatLabel fontSize="xs">Recipients</StatLabel>
                </Stat>
                <Stat textAlign="center">
                  <StatNumber fontSize="2xl" color="purple.500">{totalOccasions}</StatNumber>
                  <StatLabel fontSize="xs">Occasions</StatLabel>
                </Stat>
                <Stat textAlign="center">
                  <StatNumber fontSize="2xl" color="green.500">{upcomingCount}</StatNumber>
                  <StatLabel fontSize="xs">Upcoming</StatLabel>
                </Stat>
                <Stat textAlign="center">
                  <StatNumber fontSize="2xl" color="orange.500">{completedGifts}</StatNumber>
                  <StatLabel fontSize="xs">Completed</StatLabel>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Expandable Annual Timeline */}
        <Card bg={bgColor} shadow="md" borderRadius="lg">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Icon as={FaCalendarAlt} color="blue.500" />
                <Heading size="md">Annual Timeline</Heading>
              </Flex>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={calendarView === 'month' ? 'solid' : 'ghost'}
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={calendarView === 'year' ? 'solid' : 'ghost'}
                  onClick={() => setCalendarView('year')}
                >
                  Year
                </Button>
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={isCalendarExpanded ? <FaCompress /> : <FaExpand />}
                  onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                  aria-label={isCalendarExpanded ? "Collapse calendar" : "Expand calendar"}
                />
              </HStack>
            </Flex>
          </CardHeader>
          <Collapse in={isCalendarExpanded} animateOpacity>
            <CardBody pt={0}>
              {calendarView === 'year' ? (
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                  {monthsInYear.map((month) => {
                    const monthOccasions = allOccasions.filter(occasion => {
                      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
                        const [, occasionMonth] = occasion.date.split('-').map(Number);
                        return month.getMonth() === occasionMonth - 1;
                      } else {
                        const [year, occasionMonth] = occasion.date.split('-').map(Number);
                        return month.getMonth() === occasionMonth - 1 && month.getFullYear() === year;
                      }
                    });

                    return (
                      <Card key={month.getTime()} variant="outline" size="sm">
                        <CardBody>
                          <Text fontWeight="semibold" fontSize="sm" mb={2}>
                            {format(month, 'MMM yyyy')}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            {monthOccasions.slice(0, 3).map(occasion => (
                              <Text key={occasion.id} fontSize="xs" color="gray.600">
                                {occasion.recipient?.name}: {occasion.name}
                                {occasion.recurring && (
                                  <Tooltip label="Recurring annually" fontSize="sm" placement="top" hasArrow>
                                    <Icon as={FaRedo} color="gray.400" ml={1} boxSize="2.5" />
                                  </Tooltip>
                                )}
                                {occasion.giftWrap && (
                                  <Tooltip label="Gift wrap included" fontSize="sm" placement="top" hasArrow>
                                    <Icon as={FaGift} color="gray.400" ml={1} boxSize="2.5" />
                                  </Tooltip>
                                )}
                                {occasion.personalizedNote && (
                                  <Tooltip label="Personalized note included" fontSize="sm" placement="top" hasArrow>
                                    <Icon as={FaEdit} color="gray.400" ml={1} boxSize="2.5" />
                                  </Tooltip>
                                )}
                              </Text>
                            ))}
                            {monthOccasions.length > 3 && (
                              <Text fontSize="xs" color="gray.400">
                                +{monthOccasions.length - 3} more
                              </Text>
                            )}
                            {monthOccasions.length === 0 && (
                              <Text fontSize="xs" color="gray.400">No occasions</Text>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <Box>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Text fontWeight="semibold">
                      {format(currentDate, 'MMMM yyyy')}
                    </Text>
                    <HStack>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FaChevronLeft />}
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        aria-label="Previous month"
                      />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FaChevronRight />}
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        aria-label="Next month"
                      />
                    </HStack>
                  </Flex>
                  <Grid templateColumns="repeat(7, 1fr)" gap={2}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <Text key={day} fontWeight="semibold" fontSize="sm" textAlign="center" py={2}>
                        {day}
                      </Text>
                    ))}
                    {daysInMonth.map((day, index) => {
                      const dayOccasions = getOccasionsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <Card
                          key={index}
                          variant="outline"
                          minH="100px"
                          bg={isToday ? 'blue.50' : !isCurrentMonth ? 'gray.50' : 'white'}
                          opacity={!isCurrentMonth ? 0.5 : 1}
                        >
                          <CardBody p={2}>
                            <Text fontWeight={isToday ? 'bold' : 'normal'} fontSize="sm" mb={1}>
                              {day.getDate()}
                            </Text>
                            <VStack spacing={1} align="stretch">
                              {dayOccasions.slice(0, 2).map(occasion => (
                                <Badge
                                  key={occasion.id}
                                  colorScheme="purple"
                                  variant="subtle"
                                  fontSize="xs"
                                  textAlign="center"
                                >
                                  {occasion.recipient?.name}: {occasion.name}
                                  {occasion.recurring && (
                                    <Tooltip label="Recurring annually" fontSize="sm" placement="top" hasArrow>
                                      <Icon as={FaRedo} color="gray.400" ml={1} boxSize="2.5" />
                                    </Tooltip>
                                  )}
                                  {occasion.giftWrap && (
                                    <Tooltip label="Gift wrap included" fontSize="sm" placement="top" hasArrow>
                                      <Icon as={FaGift} color="gray.400" ml={1} boxSize="2.5" />
                                    </Tooltip>
                                  )}
                                  {occasion.personalizedNote && (
                                    <Tooltip label="Personalized note included" fontSize="sm" placement="top" hasArrow>
                                      <Icon as={FaEdit} color="gray.400" ml={1} boxSize="2.5" />
                                    </Tooltip>
                                  )}
                                </Badge>
                              ))}
                              {dayOccasions.length > 2 && (
                                <Text fontSize="xs" color="gray.500" textAlign="center">
                                  +{dayOccasions.length - 2}
                                </Text>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </CardBody>
          </Collapse>
        </Card>

        {/* Compact Recipient Grid */}
        <Card bg={bgColor} shadow="md" borderRadius="lg">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Icon as={FaUser} color="green.500" />
                <Heading size="md">Recipients ({totalRecipients})</Heading>
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
            {recipients.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                {recipients.map((recipient) => {
                  const recipientOccasions = occasions[recipient.id] || [];
                  const isExpanded = expandedRecipients.has(recipient.id);
                  
                  // Get upcoming occasions for this recipient with actual dates
                  const upcomingRecipientOccasions = recipientOccasions
                    .map(occasion => {
                      let displayDate: Date;
                      if (occasion.type === 'birthday' || occasion.type === 'christmas' || occasion.type === 'custom') {
                        const [, month, day] = occasion.date.split('-').map(Number);
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
                      return { ...occasion, displayDate };
                    })
                    .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());

                  const displayOccasions = isExpanded ? upcomingRecipientOccasions : upcomingRecipientOccasions.slice(0, 2);
                  const hasMoreOccasions = upcomingRecipientOccasions.length > 2;

                  const toggleExpanded = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setExpandedRecipients(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(recipient.id)) {
                        newSet.delete(recipient.id);
                      } else {
                        newSet.add(recipient.id);
                      }
                      return newSet;
                    });
                  };

                  return (
                    <Card
                      key={recipient.id}
                      variant="outline"
                      cursor="pointer"
                      _hover={{ bg: hoverBg, borderColor: 'blue.300' }}
                      onClick={() => navigate(`/recipients/${recipient.id}`)}
                      size="sm"
                    >
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <Flex align="center" gap={3}>
                            <Avatar name={recipient.name} size="md" />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="semibold" fontSize="sm">
                                {recipient.name}
                              </Text>
                              <Badge colorScheme="blue" size="sm">
                                {recipient.relationship || 'Recipient'}
                              </Badge>
                            </VStack>
                          </Flex>

                          {/* Occasions list */}
                          {displayOccasions.length > 0 ? (
                            <VStack spacing={2} align="stretch">
                              {displayOccasions.map((occasion, index) => (
                                <Flex 
                                  key={occasion.id} 
                                  justify="space-between" 
                                  align="center" 
                                  p={2} 
                                  bg={index === 0 ? "purple.50" : "gray.50"} 
                                  borderRadius="md"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Text fontSize="xs" fontWeight="medium">
                                    {occasion.name}
                                    {occasion.recurring && (
                                      <Tooltip label="Recurring annually" fontSize="sm" placement="top" hasArrow>
                                        <Icon as={FaRedo} color="gray.400" ml={1} boxSize="2.5" />
                                      </Tooltip>
                                    )}
                                    {occasion.giftWrap && (
                                      <Tooltip label="Gift wrap included" fontSize="sm" placement="top" hasArrow>
                                        <Icon as={FaGift} color="gray.400" ml={1} boxSize="2.5" />
                                      </Tooltip>
                                    )}
                                    {occasion.personalizedNote && (
                                      <Tooltip label="Personalized note included" fontSize="sm" placement="top" hasArrow>
                                        <Icon as={FaEdit} color="gray.400" ml={1} boxSize="2.5" />
                                      </Tooltip>
                                    )}
                                  </Text>
                                  <Text fontSize="xs" color={index === 0 ? "purple.600" : "gray.600"}>
                                    {format(occasion.displayDate, 'MMM dd, yyyy')}
                                  </Text>
                                </Flex>
                              ))}
                              
                              {/* Expand/Collapse button */}
                              {hasMoreOccasions && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={toggleExpanded}
                                  color="blue.500"
                                >
                                  {isExpanded 
                                    ? `Show Less` 
                                    : `Show ${upcomingRecipientOccasions.length - 2} More`
                                  }
                                </Button>
                              )}
                            </VStack>
                          ) : (
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              No occasions
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Center py={8}>
                <VStack spacing={4}>
                  <Icon as={FaUser} boxSize="48px" color="gray.400" />
                  <Text color="gray.500" mb={4}>
                    No recipients yet
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/recipients/add"
                    colorScheme="blue"
                    leftIcon={<AddIcon />}
                  >
                    Add Your First Recipient
                  </Button>
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Getting Started (for new users) */}
        {totalRecipients === 0 && (
          <Card bg="blue.50" shadow="md" borderRadius="lg" borderColor="blue.200" borderWidth="1px">
            <CardBody>
              <VStack spacing={4} textAlign="center">
                <Icon as={FaGift} boxSize={{ base: "50px", md: "60px" }} color="blue.500" />
                <Heading size={{ base: "md", md: "lg" }} color="blue.700">
                  Ready to start planning gifts?
                </Heading>
                <Text color="blue.600" maxW="md" fontSize={{ base: "sm", md: "md" }}>
                  Add your first recipient to begin setting up your gift calendar and automated reminders.
                </Text>
                <Button
                  as={RouterLink}
                  to="/recipients/add"
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  leftIcon={<AddIcon />}
                  width={{ base: "full", sm: "auto" }}
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