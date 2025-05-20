import React from 'react';
import { Box, Container, Heading, Text, VStack, List, ListItem, ListIcon, Button } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export default function HowItWorksPage() {
  return (
    <Box bg="gray.50" minH="100vh">
      <Navbar />
      <Container maxW="container.md" py={12}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">How Lazy Uncle Works</Heading>
          <Text fontSize="lg" textAlign="center">
            Lazy Uncle is the easiest way to never forget a birthday or special occasion again. Here's how it works:
          </Text>
          <List spacing={6} fontSize="lg">
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              <b>Register</b> and create your account in seconds.
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              <b>Add your recipients</b> (kids, family, friends) and tell us a bit about them.
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              <b>Set your budget and occasions</b> (birthdays, holidays, etc.).
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              <b>Approve or customize our gift recommendations</b>—or let us handle it all automatically.
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              <b>We buy, wrap, and ship the gifts</b> so you never have to worry.
            </ListItem>
          </List>
          <Text fontSize="lg" textAlign="center">
            That's it! Set it and forget it. We'll handle the rest.
          </Text>
          <Button as={RouterLink} to="/register" colorScheme="blue" size="lg" alignSelf="center">
            Get Started
          </Button>
        </VStack>
      </Container>
    </Box>
  );
} 