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
import { showErrorToast } from '../utils/toastUtils';

const EditGiftPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { 
    selectedGift, 
    loading, 
    error, 
    clearError, 
    fetchGift,
    updateGift 
  } = useGiftStore();
  const { recipients, fetchRecipients, loading: recipientsLoading } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [status, setStatus] = useState<GiftStatus>('idea');
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [url, setUrl] = useState('');
  const [retailer, setRetailer] = useState('');
  const [category, setCategory] = useState('');
  
  // Auto-send options
  const [autoSend, setAutoSend] = useState(false);
  const [autoSendDate, setAutoSendDate] = useState(getCurrentDateISO());
  
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
  
  // Load gift and recipients on mount
  useEffect(() => {
    fetchRecipients();
    if (id) {
      fetchGift(id);
    }
  }, [id, fetchGift, fetchRecipients]);
  
  // Populate form with gift data when available
  useEffect(() => {
    if (selectedGift) {
      setName(selectedGift.name);
      setDescription(selectedGift.description || '');
      setPrice(selectedGift.price ? selectedGift.price.toString() : '');
      setCurrency(selectedGift.currency || 'USD');
      setSelectedRecipientId(selectedGift.recipientId);
      setStatus(selectedGift.status);
      setOccasion(selectedGift.occasion || '');
      setDate(selectedGift.date || '');
      setImageURL(selectedGift.imageURL || '');
      setUrl(selectedGift.url || '');
      setRetailer(selectedGift.retailer || '');
      setCategory(selectedGift.category || '');
      setAutoSend(!!selectedGift.autoSend);
      setAutoSendDate(selectedGift.autoSendDate || getCurrentDateISO());
    }
  }, [selectedGift]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      selectedRecipientId: true
    });
    
    if (isNameInvalid || isRecipientInvalid || !id) {
      return;
    }
    
    try {
      await updateGift(id, {
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
        autoSendStatus: autoSend ? (selectedGift?.autoSendStatus || 'scheduled') : undefined
      });
      
      toast({
        title: 'Gift updated',
        description: `${name} has been updated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate(`/gifts/${id}`);
    } catch (err) {
      showErrorToast(toast, err, { title: 'Error updating gift' });
    }
  };
  
  if (loading || recipientsLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  if (!selectedGift && !loading) {
    return (
      <Box textAlign="center" p={8}>
        <Text fontSize="lg" mb={4}>Gift not found</Text>
        <Button
          as={RouterLink}
          to="/gifts"
          colorScheme="blue"
          leftIcon={<ArrowBackIcon />}
        >
          Back to Gifts
        </Button>
      </Box>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate(`/gifts/${id}`)}
            mb={4}
          >
            Back to Gift
          </Button>
          
          <Heading size="xl" mb={2}>Edit Gift</Heading>
          <Text color="gray.600">
            Update gift details and auto-send options.
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
                    <option value="shipped">Shipped</option>
                    <option value="given">Given</option>
                    <option value="archived">Archived</option>
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
                loadingText="Updating..."
                width="full"
                size="lg"
                mt={4}
              >
                Update Gift
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default EditGiftPage; 