import React from 'react';
import { Container, Heading, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const AddRecipientPage: React.FC = () => {
  return (
    <Container maxW="container.md" mt={8}>
      <Heading size="xl" mb={4}>Add Recipient</Heading>
      <Text mb={4}>This is a temporary simplified page to test navigation.</Text>
      <Button as={RouterLink} to="/recipients" colorScheme="blue">
        Back to Recipients
      </Button>
    </Container>
  );
};

export default AddRecipientPage; 