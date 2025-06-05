import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Text,
  Textarea,
  FormErrorMessage,
  useToast,
  Container,
  Divider,
  useColorModeValue,
  Flex,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { FaUser, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { useRecipientStore } from '../store/recipientStore';
import { months, days, years } from '../utils/dateUtils';
import { showErrorToast } from '../utils/toastUtils';
import type { Address } from '../types';
import AddressForm from '../components/AddressForm';

const relationshipOptions = [
  'Nephew', 'Niece', 'Wife', 'Husband', 'Brother', 'Sister', 'Mom', 'Dad', 'Friend', 'Colleague', 'Other'
];

const AddRecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addRecipient, loading } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [description, setDescription] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<Address | undefined>(undefined);
  
  // Interest management
  const [interest, setInterest] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  
  // Validation
  const [touched, setTouched] = useState({
    name: false,
    relationship: false,
    deliveryAddress: false
  });
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

  const isNameInvalid = touched.name && name.trim() === '';
  const isRelationshipInvalid = touched.relationship && relationship.trim() === '';
  const isDeliveryAddressInvalid = touched.deliveryAddress && !deliveryAddress;

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
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      relationship: true,
      deliveryAddress: true
    });
    
    if (isNameInvalid || isRelationshipInvalid || isDeliveryAddressInvalid) {
      return;
    }
    
    try {
      let birthdateStr = '';
      if (birthYear && birthMonth && birthDay) {
        birthdateStr = `${birthYear}-${birthMonth}-${birthDay}`;
      }
      
      await addRecipient({
        name,
        relationship,
        birthdate: birthdateStr || undefined,
        interests,
        description: description.trim() || undefined,
        deliveryAddress,
      });
      
      toast({
        title: 'Recipient added!',
        description: `${name} has been added successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/recipients');
    } catch (err) {
      showErrorToast(toast, err, { title: 'Error adding recipient' });
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
              <VStack spacing={6} align="start">
                <FormControl isRequired isInvalid={isNameInvalid}>
                  <FormLabel>Name</FormLabel>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched({ ...touched, name: true })}
                    placeholder="Enter recipient's name"
                  />
                  {isNameInvalid && (
                    <FormErrorMessage>Name is required</FormErrorMessage>
                  )}
                </FormControl>
                
                <FormControl isRequired isInvalid={isRelationshipInvalid}>
                  <FormLabel>Relationship</FormLabel>
                  <Select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    onBlur={() => setTouched({ ...touched, relationship: true })}
                    placeholder="Select relationship"
                  >
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                  {isRelationshipInvalid && (
                    <FormErrorMessage>Relationship is required</FormErrorMessage>
                  )}
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
                      onChange={(e) => setBirthMonth(e.target.value)}
                    >
                      {months.map((month, index) => (
                        <option key={index} value={String(index + 1).padStart(2, '0')}>
                          {month}
                        </option>
                      ))}
                    </Select>
                    <Select
                      placeholder="Day"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                    >
                      {days.map(day => (
                        <option key={day} value={String(day).padStart(2, '0')}>
                          {day}
                        </option>
                      ))}
                    </Select>
                    <Select
                      placeholder="Year"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
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
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder="Add an interest"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <Button onClick={handleAddInterest} leftIcon={<AddIcon />} colorScheme="blue">
                      Add
                    </Button>
                  </HStack>

                  {interests.length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>Added interests:</Text>
                      <Flex gap={2} flexWrap="wrap">
                        {interests.map((int, index) => (
                          <Badge
                            key={int}
                            colorScheme={getInterestColor(index)}
                            variant="solid"
                            cursor="pointer"
                            onClick={() => handleRemoveInterest(int)}
                            _hover={{ opacity: 0.8 }}
                          >
                            {int} ×
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </FormControl>

                <Divider />

                <FormControl isRequired isInvalid={isDeliveryAddressInvalid}>
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaMapMarkerAlt} color="green.500" />
                    <FormLabel mb={0}>Delivery Address</FormLabel>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Where should gifts be delivered for this recipient?
                  </Text>
                  <Box
                    onBlur={() => setTouched({ ...touched, deliveryAddress: true })}
                  >
                    <AddressForm
                      address={deliveryAddress}
                      onChange={setDeliveryAddress}
                      isRequired={true}
                      helperText="We'll use this address to deliver gifts directly to your recipient."
                    />
                  </Box>
                  {isDeliveryAddressInvalid && (
                    <FormErrorMessage>Delivery address is required</FormErrorMessage>
                  )}
                </FormControl>
                
                <Divider />
                
                <FormControl>
                  <FormLabel>Tell us about them (Optional)</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Share a few sentences about this person and your relationship with them. This helps us understand their personality and recommend more thoughtful, personalized gifts.
                  </Text>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                <Button 
                  colorScheme="blue" 
                  type="submit" 
                  isLoading={loading}
                  leftIcon={<AddIcon />}
                >
                  Add Recipient
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