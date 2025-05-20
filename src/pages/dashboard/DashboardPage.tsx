import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useGiftStore } from '../../store/giftStore';
import { differenceInDays, format, isBefore, addDays, isValid } from 'date-fns';
import type { Gift } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';

export default function DashboardPage() {
  // Get state and actions from stores
  const { recipients, fetchRecipients } = useRecipientStore();
  const { gifts, fetchGifts } = useGiftStore();
  const { demoMode } = useAuthStore();
  const [upcomingGifts, setUpcomingGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // If in demo mode, ensure demo data is initialized properly
      if (demoMode) {
        // Check if demo data is missing and re-initialize if needed
        const recipients = JSON.parse(localStorage.getItem('recipients') || '[]');
        const gifts = JSON.parse(localStorage.getItem('gifts') || '[]');
        if (!recipients.length || !gifts.length) {
          initializeDemoData();
        }
      }
      
      await fetchRecipients();
      await fetchGifts();
      
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchRecipients, fetchGifts, demoMode]);
  
  // Add this useEffect to always fetch recipients when dashboard mounts or regains focus
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);
  
  // Helper function to safely parse dates from various formats
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    // If it's already a Date object
    if (dateValue instanceof Date) return dateValue;
    
    // If it's a timestamp number
    if (typeof dateValue === 'number') return new Date(dateValue);
    
    // If it's an ISO string or other string format
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isValid(parsed) ? parsed : new Date();
    }
    
    // Default fallback
    return new Date();
  };
  
  // Filter gifts to find upcoming ones (next 30 days)
  useEffect(() => {
    if (gifts.length > 0 && recipients.length > 0) {
      const now = new Date();
      const thirtyDaysFromNow = addDays(now, 30);
      
      // Create a map of recipients by ID for faster lookup
      const recipientMap = new Map();
      recipients.forEach(recipient => {
        recipientMap.set(recipient.id, recipient);
      });
      
      const upcoming = gifts.filter(gift => {
        const giftDate = parseDate(gift.date);
        const isUpcoming = !isBefore(giftDate, now) && isBefore(giftDate, thirtyDaysFromNow);
        
        return isUpcoming;
      }).sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      setUpcomingGifts(upcoming);
    }
  }, [gifts, recipients]);
  
  // Calculate stats
  const stats = {
    totalRecipients: recipients.length,
    totalGifts: gifts.length,
    upcomingGifts: upcomingGifts.length
  };
  
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Stack spacing={8}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="lg" mb={2}>
            Welcome to LazyUncle
          </Heading>
          <Text color="gray.600" mb={6}>
            Your gifting is on autopilot. We'll tee up gifts for your approval—no action needed.
          </Text>
        </Box>
        <Flex gap={3}>
          <Button
            as={RouterLink}
            to="/recipients/add"
            colorScheme="blue"
            size="sm"
          >
            Add Recipient
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Text>Loading your gift dashboard...</Text>
        </Box>
      ) : (
        <>
          {stats.totalRecipients === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="xl" mb={4}>Add your first recipient to get started!</Text>
              <Button as={RouterLink} to="/recipients/add" colorScheme="blue" size="lg">
                Add Recipient
              </Button>
            </Box>
          ) : (
            <>
              <Box mb={8}>
                <Heading as="h2" size="md" mb={4}>Upcoming Gifts</Heading>
                {upcomingGifts.length > 0 ? (
                  <Stack spacing={4}>
                    {(() => {
                      const recipientMap = new Map();
                      recipients.forEach(recipient => {
                        recipientMap.set(recipient.id, recipient);
                      });
                      return upcomingGifts.map(gift => {
                        const recipient = recipientMap.get(gift.recipientId);
                        const giftDate = parseDate(gift.date);
                        const daysUntil = differenceInDays(giftDate, new Date());
                        return (
                          <Box key={gift.id} p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                            <Flex justify="space-between" align="center">
                              <HStack spacing={4}>
                                <Avatar size="md" name={recipient?.name || 'Gift Recipient'} />
                                <Box>
                                  <Heading as="h3" size="sm">{gift.name}</Heading>
                                  <Text color="gray.500">
                                    For: {recipient?.name || 'Gift Recipient'} • {gift.occasion}
                                  </Text>
                                  <Text fontSize="sm" mt={1}>
                                    {format(giftDate, 'MMM d, yyyy')}
                                  </Text>
                                </Box>
                              </HStack>
                              <Badge colorScheme={daysUntil <= 7 ? 'red' : daysUntil <= 14 ? 'orange' : 'green'}>
                                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                              </Badge>
                            </Flex>
                          </Box>
                        );
                      });
                    })()}
                  </Stack>
                ) : (
                  <Text color="gray.500" textAlign="center" py={10}>
                    No upcoming gifts in the next 30 days.
                  </Text>
                )}
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={4}>Recipients</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {recipients.map(recipient => (
                    <Box key={recipient.id} p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                      <Flex align="center" gap={4}>
                        <Avatar size="md" name={recipient.name} />
                        <Box>
                          <Text fontWeight="bold">{recipient.name}</Text>
                          <Text color="gray.500">{recipient.relationship}</Text>
                        </Box>
                      </Flex>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </>
          )}
        </>
      )}
    </Stack>
  );
} 