import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { showErrorToast } from '../utils/toastUtils';

// Define GiftStatus locally:
type GiftStatus = 'planned' | 'ordered' | 'shipped' | 'delivered' | 'given' | 'archived' | 'idea' | 'purchased';

const statusColors: Record<GiftStatus, string> = {
  idea: 'gray',
  planned: 'blue',
  purchased: 'green',
  ordered: 'yellow',
  shipped: 'orange',
  delivered: 'green',
  given: 'pink',
  archived: 'red'
};

const GiftsListPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
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
        showErrorToast(toast, error, { title: 'Error deleting gift' });
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
      showErrorToast(toast, error, { title: 'Error scheduling auto-send' });
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

  // Hide this page for regular users
  useEffect(() => {
    // In production, redirect to dashboard
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
};

export default GiftsListPage; 