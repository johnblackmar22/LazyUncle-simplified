import React from 'react';
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
} from '@chakra-ui/react';

export default function DashboardPage() {
  // In a real app, these would come from API calls or state management
  const stats = {
    totalRecipients: 0,
    totalGifts: 0,
    upcomingGifts: 0
  };
  
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Stack spacing={8}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="lg">
            Welcome to LazyUncle
          </Heading>
          <Text mt={1} color="gray.500">
            Here's an overview of your gift management
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
          <Button
            as={RouterLink}
            to="/gifts/add"
            colorScheme="green"
            size="sm"
          >
            Add Gift
          </Button>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Stat
          px={4}
          py={5}
          bg={boxBg}
          rounded="lg"
          boxShadow="sm"
          borderColor={borderColor}
          borderWidth="1px"
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel color="gray.500">Total Recipients</StatLabel>
              <StatNumber fontSize="3xl">{stats.totalRecipients}</StatNumber>
            </Box>
            <Box
              bg="blue.50"
              p={2}
              rounded="full"
              color="blue.500"
              alignSelf="center"
            >
              👥
            </Box>
          </Flex>
        </Stat>

        <Stat
          px={4}
          py={5}
          bg={boxBg}
          rounded="lg"
          boxShadow="sm"
          borderColor={borderColor}
          borderWidth="1px"
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel color="gray.500">Total Gifts</StatLabel>
              <StatNumber fontSize="3xl">{stats.totalGifts}</StatNumber>
            </Box>
            <Box
              bg="purple.50"
              p={2}
              rounded="full"
              color="purple.500"
              alignSelf="center"
            >
              🎁
            </Box>
          </Flex>
        </Stat>

        <Stat
          px={4}
          py={5}
          bg={boxBg}
          rounded="lg"
          boxShadow="sm"
          borderColor={borderColor}
          borderWidth="1px"
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel color="gray.500">Upcoming Gifts</StatLabel>
              <StatNumber fontSize="3xl">{stats.upcomingGifts}</StatNumber>
            </Box>
            <Box
              bg="green.50"
              p={2}
              rounded="full"
              color="green.500"
              alignSelf="center"
            >
              📅
            </Box>
          </Flex>
        </Stat>
      </SimpleGrid>

      <Box
        bg={boxBg}
        rounded="lg"
        boxShadow="sm"
        borderColor={borderColor}
        borderWidth="1px"
        p={6}
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h2" size="md">
            Upcoming Gifts (Next 30 Days)
          </Heading>
          <Button
            as={RouterLink}
            to="/gifts"
            size="sm"
            variant="ghost"
            colorScheme="blue"
          >
            View All
          </Button>
        </Flex>

        <Text color="gray.500" textAlign="center" py={10}>
          No upcoming gifts in the next 30 days.
        </Text>
      </Box>
    </Stack>
  );
} 