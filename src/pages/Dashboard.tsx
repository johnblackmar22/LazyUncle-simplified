import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Grid, 
  GridItem, 
  Heading, 
  Text, 
  Stack, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useRecipients } from '../hooks/useRecipients';
import { GiftReminders } from '../components/GiftReminders';
import { UpcomingDates } from '../components/UpcomingDates';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { recipients } = useRecipients();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">Dashboard</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          onClick={() => navigate('/recipients/new')}
        >
          Add Recipient
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <GridItem>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={borderColor}>
            <Heading size="md" mb={4}>Recipients Overview</Heading>
            <Stack>
              <Stat>
                <StatLabel>Total Recipients</StatLabel>
                <StatNumber>{recipients.length}</StatNumber>
                <StatHelpText>
                  Manage all your gift recipients in one place
                </StatHelpText>
              </Stat>
              <Button variant="link" colorScheme="blue" onClick={() => navigate('/recipients')}>
                View All Recipients →
              </Button>
            </Stack>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={borderColor}>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <Stack spacing={3}>
              <Button colorScheme="blue" onClick={() => navigate('/recipients/new')}>
                Add New Recipient
              </Button>
              <Button colorScheme="green" onClick={() => navigate('/gifts/add')}>
                Add New Gift
              </Button>
              <Button colorScheme="purple" onClick={() => navigate('/gifts')}>
                View All Gifts
              </Button>
            </Stack>
          </Box>
        </GridItem>
      </Grid>

      <Box mt={8}>
        <GiftReminders />
      </Box>

      <Box mt={8}>
        <Heading size="md" mb={4}>Upcoming Special Dates</Heading>
        <UpcomingDates />
      </Box>
    </Container>
  );
}; 