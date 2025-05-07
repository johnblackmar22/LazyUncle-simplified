import React, { useState, useEffect } from 'react';
import { useRecipients } from '../hooks/useRecipients';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text, Badge, Button, VStack, HStack, Divider, useColorModeValue } from '@chakra-ui/react';
import { format, isAfter, isBefore, addDays, parseISO, differenceInDays } from 'date-fns';

export const GiftReminders = () => {
  const { recipients } = useRecipients();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{
    recipientId: string;
    recipientName: string;
    dateType: string;
    dateName?: string;
    date: Date;
    daysUntil: number;
  }>>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const events: Array<{
      recipientId: string;
      recipientName: string;
      dateType: string;
      dateName?: string;
      date: Date;
      daysUntil: number;
    }> = [];

    // Look ahead 60 days for upcoming events
    const lookAheadDate = addDays(new Date(), 60);
    const today = new Date();

    recipients.forEach(recipient => {
      // Check birthdate
      if (recipient.birthdate) {
        const birthdate = new Date(recipient.birthdate);
        const thisYearBirthday = new Date(today.getFullYear(), birthdate.getMonth(), birthdate.getDate());
        
        // If birthday already passed this year, look to next year
        const targetBirthday = isBefore(thisYearBirthday, today) 
          ? new Date(today.getFullYear() + 1, birthdate.getMonth(), birthdate.getDate())
          : thisYearBirthday;
        
        if (isBefore(targetBirthday, lookAheadDate)) {
          events.push({
            recipientId: recipient.id,
            recipientName: recipient.name,
            dateType: 'Birthday',
            date: targetBirthday,
            daysUntil: differenceInDays(targetBirthday, today)
          });
        }
      }

      // Check anniversary
      if (recipient.anniversary) {
        const anniversary = new Date(recipient.anniversary);
        const thisYearAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());
        
        // If anniversary already passed this year, look to next year
        const targetAnniversary = isBefore(thisYearAnniversary, today) 
          ? new Date(today.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate())
          : thisYearAnniversary;
        
        if (isBefore(targetAnniversary, lookAheadDate)) {
          events.push({
            recipientId: recipient.id,
            recipientName: recipient.name,
            dateType: 'Anniversary',
            date: targetAnniversary,
            daysUntil: differenceInDays(targetAnniversary, today)
          });
        }
      }

      // Check special dates
      if (recipient.specialDates && recipient.specialDates.length > 0) {
        recipient.specialDates.forEach(specialDate => {
          try {
            let dateObj: Date;
            
            if (typeof specialDate.date === 'string') {
              dateObj = parseISO(specialDate.date);
            } else if (specialDate.date instanceof Date) {
              dateObj = specialDate.date;
            } else {
              // If date is a timestamp number
              dateObj = new Date(specialDate.date);
            }
            
            const thisYearSpecialDate = new Date(today.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            
            // If special date already passed this year, look to next year
            const targetSpecialDate = isBefore(thisYearSpecialDate, today) 
              ? new Date(today.getFullYear() + 1, dateObj.getMonth(), dateObj.getDate())
              : thisYearSpecialDate;
            
            if (isBefore(targetSpecialDate, lookAheadDate)) {
              events.push({
                recipientId: recipient.id,
                recipientName: recipient.name,
                dateType: specialDate.type || 'Special Date',
                dateName: specialDate.name || specialDate.description,
                date: targetSpecialDate,
                daysUntil: differenceInDays(targetSpecialDate, today)
              });
            }
          } catch (error) {
            console.error('Error processing date:', specialDate, error);
          }
        });
      }
    });

    // Sort events by how soon they're coming up
    events.sort((a, b) => a.daysUntil - b.daysUntil);
    setUpcomingEvents(events);
  }, [recipients]);

  const getBadgeColor = (daysUntil: number) => {
    if (daysUntil <= 7) return 'red';
    if (daysUntil <= 30) return 'orange';
    return 'blue';
  };

  const navigateToRecipient = (recipientId: string) => {
    navigate(`/recipients/${recipientId}`);
  };

  const navigateToAddGift = (recipientId: string) => {
    navigate(`/gifts/add?recipientId=${recipientId}`);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={bgColor} width="100%">
      <Heading size="md" mb={4}>Upcoming Gift Occasions</Heading>
      
      {upcomingEvents.length === 0 ? (
        <Text>No upcoming occasions in the next 60 days.</Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {upcomingEvents.map((event, index) => (
            <Box key={`${event.recipientId}-${event.dateType}-${index}`} p={3} borderWidth="1px" borderRadius="md">
              <HStack justifyContent="space-between" mb={2}>
                <Box>
                  <HStack>
                    <Heading size="sm">{event.recipientName}'s {event.dateType}</Heading>
                    <Badge colorScheme={getBadgeColor(event.daysUntil)}>
                      {event.daysUntil === 0 ? 'Today!' : `${event.daysUntil} days`}
                    </Badge>
                  </HStack>
                  {event.dateName && <Text fontSize="sm" color="gray.600">{event.dateName}</Text>}
                  <Text fontSize="sm">{format(event.date, 'MMMM d, yyyy')}</Text>
                </Box>
                <HStack>
                  <Button size="sm" colorScheme="blue" variant="outline" onClick={() => navigateToRecipient(event.recipientId)}>
                    View Profile
                  </Button>
                  <Button size="sm" colorScheme="green" onClick={() => navigateToAddGift(event.recipientId)}>
                    Add Gift
                  </Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}; 