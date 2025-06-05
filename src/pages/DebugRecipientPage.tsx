import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Code,
} from '@chakra-ui/react';
import { useRecipientStore } from '../store/recipientStore';

const DebugRecipientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { recipients, loading, fetchRecipients, updateRecipient } = useRecipientStore();
  
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState<any>(null);

  useEffect(() => {
    if (recipients.length === 0) {
      fetchRecipients();
    }
  }, [recipients, fetchRecipients]);

  useEffect(() => {
    if (id && recipients.length > 0) {
      const foundRecipient = recipients.find(r => r.id === id);
      if (foundRecipient) {
        setRecipient(foundRecipient);
        setDescription(foundRecipient.description || '');
        console.log('🐛 DEBUG: Found recipient:', foundRecipient);
      }
    }
  }, [id, recipients]);

  const handleSave = async () => {
    if (!id) return;
    
    try {
      console.log('🐛 DEBUG: Saving description:', description);
      await updateRecipient(id, { description: description.trim() || undefined });
      
      toast({
        title: 'Description saved!',
        status: 'success',
        duration: 3000,
      });
      
      // Refresh data to verify save
      await fetchRecipients();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error saving description',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!recipient) {
    return <Text>Recipient not found</Text>;
  }

  return (
    <Container maxW="container.md" mt={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Debug: {recipient.name}</Heading>
        
        <Box>
          <Text fontWeight="bold" mb={2}>Current Recipient Data:</Text>
          <Box fontSize="sm" bg="gray.100" p={4} borderRadius="md" overflow="auto">
            {JSON.stringify(recipient, null, 2)}
          </Box>
        </Box>

        <FormControl>
          <FormLabel>Description (Debug Test)</FormLabel>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Test the description field saving and loading
          </Text>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description here to test saving..."
            rows={4}
          />
        </FormControl>

        <Button colorScheme="blue" onClick={handleSave}>
          Save Description
        </Button>

        <Box>
          <Text fontWeight="bold" mb={2}>Debug Info:</Text>
          <Code fontSize="sm">
            Description value: "{description}"<br/>
            Original description: "{recipient.description || 'undefined'}"<br/>
            Recipient ID: {id}
          </Code>
        </Box>
      </VStack>
    </Container>
  );
};

export default DebugRecipientPage; 