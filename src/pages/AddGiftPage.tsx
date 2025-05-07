import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  HStack,
  Heading,
  Text,
  Select,
  Checkbox,
  Divider,
  SimpleGrid,
  Image,
  IconButton,
  Badge,
  Flex,
  useColorModeValue,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, CheckIcon } from '@chakra-ui/icons';
import { useGiftStore } from '../store/giftStore';
import { useRecipientStore } from '../store/recipientStore';
import { getCurrentDateISO } from '../utils/dateUtils';
import type { GiftStatus } from '../types';

const AddGiftPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { createGift, loading, error, clearError } = useGiftStore();
  const { recipients, fetchRecipients, loading: recipientsLoading } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipientId || '');
  const [status, setStatus] = useState<GiftStatus>('idea');
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [url, setUrl] = useState('');
  const [retailer, setRetailer] = useState('');
  const [category, setCategory] = useState('');
  
  // Auto-send options
  const [autoSend, setAutoSend] = useState(false);
  const [autoSendDate, setAutoSendDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // Validation
  const [touched, setTouched] = useState({
    name: false,
    selectedRecipientId: false
  });
  
  const isNameInvalid = touched.name && name.trim() === '';
  const isRecipientInvalid = touched.selectedRecipientId && selectedRecipientId === '';
  
  // UI colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Load recipients on mount
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      selectedRecipientId: true
    });
    
    if (isNameInvalid || isRecipientInvalid) {
      return;
    }
    
    try {
      const newGift = await createGift({
        recipientId: selectedRecipientId,
        name,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || undefined,
        status,
        occasion: occasion || undefined,
        date: date || undefined,
        imageURL: imageURL || undefined,
        url: url || undefined,
        retailer: retailer || undefined,
        category: category || undefined,
        autoSend,
        autoSendDate: autoSend ? autoSendDate : undefined,
        autoSendStatus: autoSend ? 'scheduled' : undefined
      });
      
      toast({
        title: 'Gift added',
        description: `${name} has been added to your gifts.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate(`/gifts/${newGift.id}`);
    } catch (err) {
      toast({
        title: 'Error adding gift',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (recipientsLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate('/gifts')}
            mb={4}
          >
            Back to Gifts
          </Button>
          
          <Heading size="xl" mb={2}>Add New Gift</Heading>
          <Text color="gray.600">
            Add a gift idea or purchase for your recipient. Enable auto-send to have it delivered automatically.
          </Text>
        </Box>
        
        <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="start">
              <Heading size="md">Gift Information</Heading>
              
              <FormControl isRequired isInvalid={isNameInvalid}>
                <FormLabel>Gift Name</FormLabel>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  placeholder="Enter gift name"
                />
                {isNameInvalid && (
                  <FormErrorMessage>Gift name is required</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl isRequired isInvalid={isRecipientInvalid}>
                <FormLabel>For Recipient</FormLabel>
                <Select 
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  onBlur={() => setTouched({ ...touched, selectedRecipientId: true })}
                  placeholder="Select a recipient"
                >
                  {recipients.map(recipient => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} ({recipient.relationship})
                    </option>
                  ))}
                </Select>
                {isRecipientInvalid && (
                  <FormErrorMessage>Recipient is required</FormErrorMessage>
                )}
                {recipients.length === 0 && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    You need to add a recipient first. <Button as={RouterLink} to="/recipients/add" variant="link" colorScheme="blue">Add Recipient</Button>
                  </Text>
                )}
              </FormControl>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Price</FormLabel>
                  <Input 
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Currency</FormLabel>
                  <Select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description of the gift"
                  rows={3}
                />
              </FormControl>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GiftStatus)}
                  >
                    <option value="idea">Idea</option>
                    <option value="planning">Planning</option>
                    <option value="purchased">Purchased</option>
                    <option value="wrapped">Wrapped</option>
                    <option value="shipped">Shipped</option>
                    <option value="given">Given</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Input 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Electronics, Books"
                  />
                </FormControl>
              </SimpleGrid>
              
              <Divider />
              
              <Heading size="md">Purchase Information</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Where to Buy</FormLabel>
                  <Input 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter store URL"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Retailer</FormLabel>
                  <Input 
                    value={retailer}
                    onChange={(e) => setRetailer(e.target.value)}
                    placeholder="e.g., Amazon, Best Buy"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Occasion</FormLabel>
                  <Input 
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g., Birthday, Christmas"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Image URL</FormLabel>
                <Input 
                  value={imageURL}
                  onChange={(e) => setImageURL(e.target.value)}
                  placeholder="Enter image URL"
                />
              </FormControl>
              
              <Divider />
              
              <Heading size="md">Auto-Send Options</Heading>
              
              <FormControl>
                <Checkbox 
                  isChecked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  colorScheme="purple"
                  size="lg"
                >
                  Enable Auto-Send
                </Checkbox>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  We'll automatically purchase this gift and send it to your recipient on the selected date.
                </Text>
              </FormControl>
              
              {autoSend && (
                <FormControl>
                  <FormLabel>Send Date</FormLabel>
                  <Input 
                    type="date"
                    value={autoSendDate}
                    onChange={(e) => setAutoSendDate(e.target.value)}
                  />
                </FormControl>
              )}
              
              {error && (
                <Text color="red.500">{error}</Text>
              )}
              
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                loadingText="Adding..."
                width="full"
                size="lg"
                mt={4}
              >
                Add Gift
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default AddGiftPage; 