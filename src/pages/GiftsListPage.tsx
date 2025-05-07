import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Badge,
  IconButton,
  HStack,
  VStack,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { 
  AddIcon, 
  SearchIcon, 
  EditIcon, 
  DeleteIcon, 
  ChevronDownIcon, 
  TimeIcon,
  CheckIcon 
} from '@chakra-ui/icons';
import { useGiftStore } from '../store/giftStore';
import { formatDate } from '../utils/dateUtils';
import type { GiftStatus } from '../types';

const statusColors: Record<GiftStatus, string> = {
  idea: 'gray',
  planning: 'blue',
  purchased: 'green',
  wrapped: 'purple',
  shipped: 'orange',
  given: 'pink',
  archived: 'red'
};

const GiftsListPage: React.FC = () => {
  const toast = useToast();
  const { 
    gifts, 
    autoSendGifts,
    loading, 
    error, 
    fetchGifts,
    fetchAutoSendGifts,
    removeGift,
    scheduleAutoSend,
    cancelAutoSend
  } = useGiftStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<GiftStatus | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load gifts on mount
  useEffect(() => {
    fetchGifts();
    fetchAutoSendGifts();
  }, [fetchGifts, fetchAutoSendGifts]);

  // Filter gifts by search query and status
  const filteredGifts = gifts.filter(gift => {
    const matchesSearch = 
      gift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gift.description && gift.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (gift.recipientId && gift.recipientId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || gift.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this gift?')) {
      setIsDeleting(id);
      try {
        await removeGift(id);
        toast({
          title: 'Gift deleted',
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

  // Handle auto-send scheduling
  const handleScheduleAutoSend = async (id: string) => {
    // In a real app, show a date picker or form
    // For demo, we'll use a date 7 days from now
    const sendDate = new Date();
    sendDate.setDate(sendDate.getDate() + 7);
    const sendDateStr = sendDate.toISOString().split('T')[0];
    
    setIsScheduling(id);
    try {
      await scheduleAutoSend(id, sendDateStr);
      toast({
        title: 'Auto-send scheduled',
        description: `The gift will be sent on ${formatDate(sendDateStr)}`,
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
      setIsScheduling(null);
    }
  };

  // Handle auto-send cancellation
  const handleCancelAutoSend = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel the auto-send for this gift?')) {
      setIsCancelling(id);
      try {
        await cancelAutoSend(id);
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
        setIsCancelling(null);
      }
    }
  };

  const renderGiftItem = (gift: any, showAutoSendActions = false) => (
    <Card key={gift.id} shadow="md" borderRadius="lg" overflow="hidden" bg={bgColor}>
      {gift.imageURL && (
        <Image 
          src={gift.imageURL} 
          alt={gift.name}
          height="160px"
          objectFit="cover"
        />
      )}
      <CardHeader pb={2}>
        <Flex justify="space-between" align="flex-start">
          <Heading size="md" noOfLines={2}>{gift.name}</Heading>
          <Badge 
            colorScheme={statusColors[gift.status as GiftStatus] || 'gray'}
            fontSize="0.8em"
            ml={2}
          >
            {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
          </Badge>
        </Flex>
        <Text color="gray.500" fontSize="sm" mt={1}>
          {gift.retailer && `${gift.retailer} • `}
          {gift.price && `$${gift.price.toFixed(2)}`}
        </Text>
      </CardHeader>
      
      <CardBody py={2}>
        <Text fontSize="sm" noOfLines={2} color="gray.600">
          {gift.description || 'No description'}
        </Text>
        
        {gift.occasion && (
          <Text fontSize="sm" mt={2}>
            <strong>Occasion:</strong> {gift.occasion}
          </Text>
        )}
        
        {gift.date && (
          <Text fontSize="sm">
            <strong>Date:</strong> {formatDate(gift.date)}
          </Text>
        )}
        
        {gift.autoSend && (
          <Badge 
            colorScheme="purple" 
            mt={2}
            display="flex"
            alignItems="center"
            width="fit-content"
          >
            <TimeIcon mr={1} /> 
            {gift.autoSendDate ? `Auto-send on ${formatDate(gift.autoSendDate)}` : 'Auto-send scheduled'}
          </Badge>
        )}
      </CardBody>
      
      <CardFooter pt={2}>
        <HStack spacing={2} width="100%" justifyContent="space-between">
          <Button
            as={RouterLink}
            to={`/gifts/${gift.id}`}
            colorScheme="blue"
            size="sm"
            flexGrow={1}
          >
            View Details
          </Button>
          
          <HStack>
            <IconButton
              as={RouterLink}
              to={`/gifts/${gift.id}/edit`}
              aria-label="Edit"
              icon={<EditIcon />}
              colorScheme="blue"
              variant="outline"
              size="sm"
            />
            
            {showAutoSendActions ? (
              <IconButton
                aria-label="Cancel Auto-Send"
                icon={isCancelling === gift.id ? <Spinner size="sm" /> : <TimeIcon />}
                colorScheme="purple"
                variant="outline"
                size="sm"
                isLoading={isCancelling === gift.id}
                onClick={() => handleCancelAutoSend(gift.id)}
              />
            ) : (
              <Menu>
                <MenuButton 
                  as={IconButton}
                  aria-label="More Options"
                  icon={<ChevronDownIcon />}
                  variant="outline"
                  size="sm"
                >
                  Options
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    icon={<TimeIcon />}
                    isDisabled={isScheduling === gift.id}
                    onClick={() => handleScheduleAutoSend(gift.id)}
                  >
                    {isScheduling === gift.id ? 'Scheduling...' : 'Schedule Auto-Send'}
                  </MenuItem>
                  <MenuItem 
                    icon={<DeleteIcon />}
                    color="red.500"
                    isDisabled={isDeleting === gift.id}
                    onClick={() => handleDelete(gift.id)}
                  >
                    {isDeleting === gift.id ? 'Deleting...' : 'Delete Gift'}
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </HStack>
        </HStack>
      </CardFooter>
    </Card>
  );

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="xl">Gifts</Heading>
        <Button
          as={RouterLink}
          to="/gifts/add"
          colorScheme="blue"
          leftIcon={<AddIcon />}
        >
          Add Gift
        </Button>
      </Flex>

      <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue" mb={6}>
        <TabList>
          <Tab>All Gifts</Tab>
          <Tab>Auto-Send Gifts</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={0} pt={4}>
            <Flex mb={4} direction={{ base: 'column', md: 'row' }} gap={4}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={bgColor}
                  borderColor={borderColor}
                />
              </InputGroup>
              
              <Menu>
                <MenuButton 
                  as={Button} 
                  rightIcon={<ChevronDownIcon />}
                  width={{ base: '100%', md: 'auto' }}
                >
                  Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setStatusFilter('all')}>
                    All
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('idea')}>
                    Idea
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('planning')}>
                    Planning
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('purchased')}>
                    Purchased
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('wrapped')}>
                    Wrapped
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('shipped')}>
                    Shipped
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('given')}>
                    Given
                  </MenuItem>
                  <MenuItem onClick={() => setStatusFilter('archived')}>
                    Archived
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>

            {loading && !gifts.length ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : error ? (
              <Box p={4} bg="red.50" color="red.500" borderRadius="md">
                <Text>Error: {error}</Text>
              </Box>
            ) : filteredGifts.length === 0 ? (
              <Box textAlign="center" p={8} bg={bgColor} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Text fontSize="lg" mb={4}>No gifts found</Text>
                <Button
                  as={RouterLink}
                  to="/gifts/add"
                  colorScheme="blue"
                  leftIcon={<AddIcon />}
                >
                  Add Your First Gift
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                {filteredGifts.map(gift => renderGiftItem(gift))}
              </SimpleGrid>
            )}
          </TabPanel>
          
          <TabPanel p={0} pt={4}>
            <Box mb={4} p={4} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
              <Heading size="sm" mb={2} color="purple.700">Auto-Send Gifts</Heading>
              <Text color="purple.700" fontSize="sm">
                These gifts are scheduled to be automatically sent to your recipients. We'll handle the purchase, wrapping, and delivery for you.
              </Text>
            </Box>
            
            {loading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="purple.500" />
              </Flex>
            ) : autoSendGifts.length === 0 ? (
              <Box textAlign="center" p={8} bg={bgColor} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Text fontSize="lg" mb={4}>No auto-send gifts scheduled</Text>
                <Text fontSize="md" mb={4} color="gray.600">
                  Schedule gifts to be automatically sent to your recipients on special dates.
                </Text>
                <Button
                  onClick={() => setTabIndex(0)}
                  colorScheme="purple"
                >
                  View All Gifts
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
                {autoSendGifts.map(gift => renderGiftItem(gift, true))}
              </SimpleGrid>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default GiftsListPage; 