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
  VStack,
  Heading,
  Text,
  Select,
  Checkbox,
  Divider,
  SimpleGrid,
  Flex,
  useColorModeValue,
  useToast,
  Spinner,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  IconButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import { useGiftStore } from '../store/giftStore';
import { useRecipientStore } from '../store/recipientStore';
import { showErrorToast } from '../utils/toastUtils';
import { useAuthStore } from '../store/authStore';
import { getPlanById } from '../services/subscription/plans';
import { Navbar } from '../components/Navbar';

// Define gift status type based on our schema
type GiftStatus = 'planned' | 'ordered' | 'shipped' | 'delivered';

const AddGiftPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { createGift, loading, error, clearError } = useGiftStore();
  const { recipients, fetchRecipients, loading: recipientsLoading } = useRecipientStore();
  const { user, demoMode } = useAuthStore();
  const planId = user?.planId || 'free';
  const plan = getPlanById(planId);
  
  const { recipientGifts, fetchGiftsByRecipient } = useGiftStore();
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const cancelRef = React.useRef(null);
  
  // Track gifts for the selected recipient
  const [currentYearGiftCount, setCurrentYearGiftCount] = useState(0);
  
  // Form values
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipientId || '');
  const [reminderDate, setReminderDate] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  
  // Interest management
  const [interest, setInterest] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  
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
  
  // Set up default values when recipient is selected or changed
  useEffect(() => {
    if (selectedRecipientId && recipients.length > 0) {
      const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
      
      if (selectedRecipient) {
        // If recipient has birthdate, set up birthday gift
        if (selectedRecipient.birthdate && !name) {
          // Format the birthdate to get month and day
          const birthdateObj = selectedRecipient.birthdate instanceof Date 
            ? selectedRecipient.birthdate 
            : new Date(selectedRecipient.birthdate);
          
          // Set default values for a birthday gift
          setName(`Gift for ${selectedRecipient.name}`);
          
          // Pre-populate interests from recipient's interests
          if (selectedRecipient.interests && selectedRecipient.interests.length > 0) {
            setInterests([...selectedRecipient.interests]);
          }
          
          // Set price range based on recipient preferences if available
          if (selectedRecipient.giftPreferences?.priceRange) {
            const avgPrice = (
              selectedRecipient.giftPreferences.priceRange.min + 
              selectedRecipient.giftPreferences.priceRange.max
            ) / 2;
            setPrice(avgPrice.toString());
          }
          
          // Set the reminder date to 1 week before next birthday
          const today = new Date();
          const thisYearBirthday = new Date(
            today.getFullYear(),
            birthdateObj.getMonth(),
            birthdateObj.getDate()
          );
          
          // If this year's birthday has passed, use next year's
          if (today > thisYearBirthday) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }
          
          // Set reminder date 1 week earlier
          const reminderDay = new Date(thisYearBirthday);
          reminderDay.setDate(reminderDay.getDate() - 7);
          setReminderDate(reminderDay.toISOString().split('T')[0]);
        }
      }
    }
  }, [selectedRecipientId, recipients, name]);
  
  useEffect(() => {
    if (selectedRecipientId) {
      fetchGiftsByRecipient(selectedRecipientId).then(() => {
        const gifts = recipientGifts[selectedRecipientId] || [];
        const currentYear = new Date().getFullYear();
        const count = gifts.filter(gift => {
          const date = new Date(gift.date);
          return date.getFullYear() === currentYear;
        }).length;
        setCurrentYearGiftCount(count);
      });
    }
  }, [selectedRecipientId, fetchGiftsByRecipient, recipientGifts]);
  
  // Check if at or above gift limit
  const atGiftLimit = !demoMode && plan && plan.giftLimit !== Infinity && currentYearGiftCount >= plan.giftLimit;
  
  const handleAddInterest = () => {
    if (interest.trim() !== '' && !interests.includes(interest.trim())) {
      setInterests([...interests, interest.trim()]);
      setInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };
  
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
    if (atGiftLimit) {
      setPaywallOpen(true);
      return;
    }
    
    try {
      const newGift = await createGift({
        recipientId: selectedRecipientId,
        name,
        description: `Interests: ${interests.join(', ')}`,
        price: price ? parseFloat(price) : 0,
        status: 'planned',
        occasion: 'Birthday',
        date: reminderDate ? new Date(reminderDate) : new Date(),
        imageUrl: '',
        notes: autoSend ? 'Auto-send enabled' : '',
        category: interests[0] || 'Other'
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
      showErrorToast(toast, err, { title: 'Error adding gift' });
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
    <Box bg="gray.100" minH="100vh">
      <Navbar />
      <Container maxW="container.md" py={12}>
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
            
            <Heading size="xl" mb={2}>Add Gift</Heading>
            <Text color="gray.600">
              Add a gift for your recipient with a simple reminder system.
            </Text>
          </Box>
          
          <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="start">
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
                
                <FormControl>
                  <FormLabel>Interests</FormLabel>
                  <InputGroup>
                    <Input
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder="Add interests for this gift"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <InputRightElement>
                      <IconButton
                        icon={<AddIcon />}
                        size="sm"
                        aria-label="Add interest"
                        onClick={handleAddInterest}
                      />
                    </InputRightElement>
                  </InputGroup>
                  
                  {/* Display added interests */}
                  {interests.length > 0 && (
                    <Box mt={2}>
                      {interests.map((i, index) => (
                        <Tag key={index} m={1} colorScheme="blue">
                          <TagLabel>{i}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveInterest(i)} />
                        </Tag>
                      ))}
                    </Box>
                  )}
                </FormControl>
                
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
                  <FormLabel>Reminder Date</FormLabel>
                  <Input 
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    When should we remind you about this gift?
                  </Text>
                </FormControl>
                
                <FormControl>
                  <Checkbox 
                    isChecked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    colorScheme="purple"
                    size="lg"
                  >
                    Auto-send gift
                  </Checkbox>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    We'll handle sending this gift automatically at the right time.
                  </Text>
                </FormControl>
                
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
                  disabled={atGiftLimit}
                  onClick={handleSubmit}
                >
                  Add Gift
                </Button>
              </VStack>
            </form>
          </Box>
          <AlertDialog
            isOpen={isPaywallOpen}
            leastDestructiveRef={cancelRef}
            onClose={() => setPaywallOpen(false)}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Upgrade Required
                </AlertDialogHeader>
                <AlertDialogBody>
                  {plan && plan.giftLimit !== Infinity
                    ? `The Free plan allows only ${plan.giftLimit} gifts per recipient per year. Upgrade to Pro for unlimited gifts and more features!`
                    : 'Upgrade to Pro for unlimited gifts and more features!'}
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={() => setPaywallOpen(false)}>
                    Cancel
                  </Button>
                  <Button colorScheme="blue" ml={3} as={RouterLink} to="/subscription/plans">
                    Upgrade Now
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </VStack>
      </Container>
    </Box>
  );
};

export default AddGiftPage; 