import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Text,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { useAuthStore } from '../store/authStore';
import type { Recipient } from '../types';
import { showErrorToast } from '../utils/toastUtils';

const relationshipOptions = [
  'Nephew', 'Niece', 'Wife', 'Husband', 'Brother', 'Sister', 'Mom', 'Dad', 'Friend', 'Colleague', 'Other'
];
const suggestedInterests = ['Gaming', 'Music', 'Tech', 'Travel', 'Sports', 'Food', 'Books', 'Movies', 'Fashion', 'Outdoors'];

const AddRecipientPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { addRecipient, recipients } = useRecipientStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const cancelRef = React.useRef(null);
  
  const [recipient, setRecipient] = useState({
    name: '',
    relationship: '',
    birthdate: '',
    interests: [] as string[],
  });
  const [interestInput, setInterestInput] = useState('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<Address | undefined>(undefined);

  // Debug logging for delivery address
  React.useEffect(() => {
    console.log('AddRecipientPage - deliveryAddress changed:', deliveryAddress);
  }, [deliveryAddress]);

  // Add debug logging for the setDeliveryAddress function
  const handleAddressChange = React.useCallback((address: Address | undefined) => {
    console.log('AddRecipientPage - handleAddressChange called with:', address);
    setDeliveryAddress(address);
  }, []);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

  // Add/Remove Interests
  const addInterest = () => {
    if (interestInput.trim() && !recipient.interests.includes(interestInput.trim())) {
      setRecipient(r => ({ ...r, interests: [...r.interests, interestInput.trim()] }));
      setInterestInput('');
    }
  };
  const removeInterest = (i: string) => {
    setRecipient(r => ({ ...r, interests: r.interests.filter(x => x !== i) }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !recipient.relationship.trim()) {
      toast({
        title: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    let birthdateStr = '';
    if (birthYear && birthMonth && birthDay) {
      birthdateStr = `${birthYear}-${birthMonth}-${birthDay}`;
    }
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    console.log('AddRecipientPage - About to submit recipient with delivery address:', deliveryAddress);
    
    const submissionData = {
      ...recipient,
      name: fullName,
      birthdate: birthdateStr || undefined,
      description: description.trim() || undefined,
      deliveryAddress,
    };
    
    console.log('AddRecipientPage - Final submission data:', submissionData);
    console.log('AddRecipientPage - deliveryAddress in submission:', submissionData.deliveryAddress);
    
    try {
      const result = await addRecipient(submissionData);
      console.log('AddRecipientPage - addRecipient result:', result);
      toast({
        title: 'Recipient added!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    } catch (error) {
      console.error('AddRecipientPage - Error adding recipient:', error);
      toast({
        title: 'Error adding recipient',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" mt={4}>
      <VStack spacing={6} align="stretch">
        {/* Header with back navigation */}
        <Box>
          <IconButton
            as={RouterLink}
            to="/recipients"
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            variant="ghost"
            mb={4}
          />
          <Heading size="xl" mb={2}>Add Recipient</Heading>
          <Text color="gray.600">
            Add someone special to your gift list and let us handle the rest.
          </Text>
        </Box>

        {/* Main form card */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <Flex align="center" gap={2}>
                <Icon as={FaUser} color="blue.500" />
                <Heading size="md">Basic Information</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      placeholder="Their first name" 
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      placeholder="Their last name" 
                    />
                  </FormControl>
                </HStack>
                
                <FormControl isRequired>
                  <FormLabel>Relationship</FormLabel>
                  <Select 
                    value={recipient.relationship} 
                    onChange={e => setRecipient(r => ({ ...r, relationship: e.target.value }))} 
                    placeholder="Select relationship"
                  >
                    {relationshipOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </FormControl>
                
                <Divider />
                
                <FormControl>
                  <FormLabel>Birthdate (Optional)</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    This helps us recommend age-appropriate gifts and remember important dates.
                  </Text>
                  <HStack>
                    <Select 
                      placeholder="Month" 
                      value={birthMonth} 
                      onChange={e => setBirthMonth(e.target.value)}
                    >
                      {months.map((m: string, i: number) => (
                        <option key={i} value={String(i+1).padStart(2, '0')}>{m}</option>
                      ))}
                    </Select>
                    <Select 
                      placeholder="Day" 
                      value={birthDay} 
                      onChange={e => setBirthDay(e.target.value)}
                    >
                      {days.map((d: number) => (
                        <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                      ))}
                    </Select>
                    <Select 
                      placeholder="Year" 
                      value={birthYear} 
                      onChange={e => setBirthYear(e.target.value)}
                    >
                      {years.map((y: number) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Select>
                  </HStack>
                </FormControl>
                
                <Divider />
                
                <FormControl>
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaHeart} color="red.500" />
                    <FormLabel mb={0}>Interests</FormLabel>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    What do they love? This helps us find the perfect gifts.
                  </Text>
                  
                  <HStack mb={3}>
                    <Input 
                      value={interestInput} 
                      onChange={e => setInterestInput(e.target.value)} 
                      placeholder="Add an interest" 
                      onKeyDown={e => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          addInterest(); 
                        } 
                      }} 
                    />
                    <Button onClick={addInterest} leftIcon={<AddIcon />} colorScheme="blue">
                      Add
                    </Button>
                  </HStack>
                  
                  {recipient.interests.length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>Added interests:</Text>
                      <Flex gap={2} flexWrap="wrap">
                        {recipient.interests.map((interest, index) => (
                          <Badge 
                            key={interest} 
                            colorScheme={getInterestColor(index)} 
                            variant="solid" 
                            cursor="pointer"
                            onClick={() => removeInterest(interest)}
                            _hover={{ opacity: 0.8 }}
                          >
                            {interest} ×
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Quick suggestions:</Text>
                    <Flex gap={2} flexWrap="wrap">
                      {suggestedInterests
                        .filter(si => !recipient.interests.includes(si))
                        .map(si => (
                          <Badge 
                            key={si} 
                            variant="outline" 
                            colorScheme="gray" 
                            cursor="pointer"
                            onClick={() => setRecipient(r => ({ ...r, interests: [...r.interests, si] }))}
                            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                          >
                            {si}
                          </Badge>
                        ))}
                    </Flex>
                  </Box>
                </FormControl>
                
                <Divider />
                
                <FormControl>
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaMapMarkerAlt} color="green.500" />
                    <FormLabel mb={0}>Delivery Address (Optional)</FormLabel>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Where should gifts be delivered for this recipient?
                  </Text>
                  <AddressForm
                    address={deliveryAddress}
                    onChange={handleAddressChange}
                    isRequired={false}
                    helperText="We'll use this address to deliver gifts directly to your recipient."
                  />
                </FormControl>
                
                <Divider />
                
                <FormControl>
                  <FormLabel>Tell us about them (Optional)</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Share a few sentences about this person and your relationship with them. This helps us understand their personality and recommend more thoughtful, personalized gifts.
                  </Text>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="For example: 'My brother loves outdoor adventures and craft beer. He's always been the adventurous one in our family and enjoys trying new things...'"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </CardBody>
            <CardFooter>
              <HStack spacing={3} width="100%" justifyContent="space-between">
                <Button variant="ghost" as={RouterLink} to="/recipients">
                  Cancel
                </Button>
                <Button colorScheme="blue" type="submit" isLoading={loading} leftIcon={<AddIcon />}>
                  Save Recipient
                </Button>
              </HStack>
            </CardFooter>
          </form>
        </Card>
      </VStack>
    </Container>
  );
};

export default AddRecipientPage; 