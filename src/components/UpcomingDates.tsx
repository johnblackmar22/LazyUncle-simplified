import React, { useState, useEffect } from 'react';
import { useRecipientStore } from '../store/recipientStore';
import { format, addDays, parseISO, isBefore, differenceInDays } from 'date-fns';
import { Box, Heading, Text, Badge, VStack, HStack, Divider, useColorModeValue } from '@chakra-ui/react';
import type { Recipient as BaseRecipient } from '../types';

// Extend Recipient type locally to include specialDates for demo mode
interface SpecialDate {
  id: string;
  name: string;
  date: number | Date;
  recurring: boolean;
  type: 'birthday' | 'anniversary' | 'holiday' | 'other';
  description: string;
}

interface Recipient extends BaseRecipient {
  specialDates?: SpecialDate[];
}

export const UpcomingDates: React.FC = () => {
  const { recipients } = useRecipientStore();
  const [upcomingDates, setUpcomingDates] = useState<Array<SpecialDate & { recipientName: string }>>([]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const today = new Date();
    const lookAheadDate = addDays(today, 30); // Look ahead 30 days
    const allDates: Array<SpecialDate & { recipientName: string }> = [];

    (recipients as Recipient[]).forEach(recipient => {
      if (recipient.specialDates && recipient.specialDates.length > 0) {
        recipient.specialDates.forEach((date: SpecialDate) => {
          let dateObj;
          try {
            if (typeof date.date === 'string') {
              dateObj = parseISO(date.date as unknown as string);
            } else {
              dateObj = new Date(date.date);
            }

            // Check if date is within our look-ahead period
            if (isBefore(dateObj, lookAheadDate) && !isBefore(dateObj, today)) {
              allDates.push({
                ...date,
                recipientName: recipient.name,
                // Ensure description exists (for compatibility)
                description: date.description || date.name || ''
              });
            }
          } catch (error) {
            console.error('Error processing date:', date, error);
          }
        });
      }
    });

    // Sort by date (soonest first)
    allDates.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    setUpcomingDates(allDates);
  }, [recipients]);

  const getBadgeColor = (date: Date | number) => {
    const daysUntil = differenceInDays(new Date(date), new Date());
    if (daysUntil <= 7) return 'red';
    if (daysUntil <= 14) return 'orange';
    return 'blue';
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={bgColor}>
      {upcomingDates.length === 0 ? (
        <Text>No upcoming dates in the next 30 days.</Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {upcomingDates.map((date) => {
            const dateObj = new Date(date.date);
            const daysUntil = differenceInDays(dateObj, new Date());
            
            return (
              <Box key={date.id} p={3} borderWidth="1px" borderRadius="md">
                <Heading size="sm">{date.recipientName}'s {date.type}</Heading>
                <HStack mt={1}>
                  <Text fontSize="sm">{format(dateObj, 'MMMM d, yyyy')}</Text>
                  <Badge colorScheme={getBadgeColor(date.date)}>
                    {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                  </Badge>
                </HStack>
                {date.description && (
                  <Text fontSize="sm" color="gray.600" mt={1}>{date.description}</Text>
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}; 