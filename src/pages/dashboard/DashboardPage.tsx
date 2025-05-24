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
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useAuthStore } from '../../store/authStore';
import { initializeDemoData } from '../../services/demoData';

export default function DashboardPage() {
  // Get state and actions from stores
  const { recipients, fetchRecipients } = useRecipientStore();
  const { demoMode } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // If in demo mode, ensure demo data is initialized properly
      if (demoMode) {
        // Check if demo data is missing and re-initialize if needed
        const recipients = JSON.parse(localStorage.getItem('recipients') || '[]');
        if (!recipients.length) {
          initializeDemoData();
        }
      }
      
      await fetchRecipients();
      
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchRecipients, demoMode]);
  
  // Add this useEffect to always fetch recipients when dashboard mounts or regains focus
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);
  
  // Calculate stats
  const stats = {
    totalRecipients: recipients.length,
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
              <Box>
                <Heading as="h2" size="md" mb={4}>Recipients</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {recipients.map(recipient => (
                    <Box
                      key={recipient.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor={borderColor}
                      cursor="pointer"
                      _hover={{ boxShadow: 'md', bg: 'gray.50' }}
                      onClick={() => navigate(`/recipients/${recipient.id}`)}
                    >
                      <Flex align="center" gap={4}>
                        <Avatar size="md" name={recipient.name} />
                        <Box>
                          <Text fontWeight="bold">{recipient.name}</Text>
                          <Text color="gray.500">{recipient.relationship}</Text>
                        </Box>
                      </Flex>
                      <Button
                        mt={4}
                        colorScheme="blue"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/gifts/add/${recipient.id}`);
                        }}
                      >
                        Add Gift
                      </Button>
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