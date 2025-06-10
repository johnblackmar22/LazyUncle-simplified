import React, { useState, useEffect, useMemo } from 'react';
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
  SimpleGrid,
  Collapse,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaUser, FaHeart, FaMapMarkerAlt, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
import { useRecipientStore } from '../store/recipientStore';
import { months, days, years } from '../utils/dateUtils';
import { showErrorToast } from '../utils/toastUtils';
import { getInterestSuggestions, getAgeGroupLabel } from '../utils/interestSuggestions';
import type { Address } from '../types';
import AddressForm from '../components/AddressForm';

const relationshipOptions = [
  'Nephew', 'Niece', 'Son', 'Daughter', 'Wife', 'Husband', 'Brother', 'Sister', 'Mom', 'Dad', 'Friend', 'Colleague', 'Other'
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other/Prefer not to say' }
];

const AddRecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addRecipient, loading } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [description, setDescription] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<Address | undefined>(undefined);
  
  // Interest management
  const [interest, setInterest] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Validation
  const [touched, setTouched] = useState({
    name: false,
    relationship: false,
    birthdate: false,
    deliveryAddress: false
  });
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const suggestionBg = useColorModeValue('gray.50', 'gray.700');

  // Calculate birthdate string and get suggestions
  const birthdate = useMemo(() => {
    if (birthYear && birthMonth && birthDay) {
      return `${birthYear}-${birthMonth}-${birthDay}`;
    }
    return '';
  }, [birthYear, birthMonth, birthDay]);

  const interestSuggestions = useMemo(() => {
    if (!birthdate) return [];
    return getInterestSuggestions(birthdate, gender);
  }, [birthdate, gender]);

  const ageGroupLabel = useMemo(() => {
    if (!birthdate) return '';
    return getAgeGroupLabel(birthdate);
  }, [birthdate]);

  // Auto-show suggestions when birthdate is complete
  useEffect(() => {
    if (birthdate && interestSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [birthdate, interestSuggestions.length]);

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number): string => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow', 'green'];
    return colors[index % colors.length];
  };

  // Validation checks
  const isNameInvalid = touched.name && name.trim() === '';
  const isRelationshipInvalid = touched.relationship && relationship.trim() === '';
  const isBirthdateInvalid = touched.birthdate && (!birthYear || !birthMonth || !birthDay);
  const isDeliveryAddressInvalid = touched.deliveryAddress && !deliveryAddress;

  const handleAddInterest = (interestToAdd?: string): void => {
    const newInterest = interestToAdd || interest.trim();
    if (newInterest !== '' && !interests.includes(newInterest)) {
      setInterests([...interests, newInterest]);
      if (!interestToAdd) {
        setInterest('');
      }
    }
  };

  const handleRemoveInterest = (interestToRemove: string): void => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleSuggestionClick = (suggestion: string): void => {
    handleAddInterest(suggestion);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      relationship: true,
      birthdate: true,
      deliveryAddress: true
    });
    
    if (isNameInvalid || isRelationshipInvalid || isBirthdateInvalid || isDeliveryAddressInvalid) {
      return;
    }
    
    try {
      const finalRelationship = relationship === 'Other' ? customRelationship : relationship;
      
      await addRecipient({
        name,
        relationship: finalRelationship,
        birthdate,
        gender: gender as 'male' | 'female' | 'other',
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
    <Container maxW="container.xl" mt={4}>
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
                  {relationship === 'Other' && (
                    <Input
                      value={customRelationship}
                      onChange={(e) => setCustomRelationship(e.target.value)}
                      placeholder="Enter custom relationship"
                      mt={2}
                    />
                  )}
                  {isRelationshipInvalid && (
                    <FormErrorMessage>Relationship is required</FormErrorMessage>
                  )}
                </FormControl>

                <Divider />

                <FormControl isRequired isInvalid={isBirthdateInvalid}>
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaBirthdayCake} color="pink.500" />
                    <FormLabel mb={0}>Birthdate</FormLabel>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    This helps us recommend age-appropriate gifts and remember important dates.
                  </Text>
                  <HStack>
                    <Select
                      placeholder="Month"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      onBlur={() => setTouched({ ...touched, birthdate: true })}
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
                      onBlur={() => setTouched({ ...touched, birthdate: true })}
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
                      onBlur={() => setTouched({ ...touched, birthdate: true })}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  {isBirthdateInvalid && (
                    <FormErrorMessage>Birthdate is required</FormErrorMessage>
                  )}
                  {ageGroupLabel && (
                    <Text fontSize="sm" color="blue.600" mt={2} fontWeight="medium">
                      Age Group: {ageGroupLabel}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaVenusMars} color="purple.500" />
                    <FormLabel mb={0}>Gender</FormLabel>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Optional - helps us suggest more personalized gifts.
                  </Text>
                  <Select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Select gender (optional)"
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
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
                    <Button onClick={() => handleAddInterest()} leftIcon={<AddIcon />} colorScheme="blue">
                      Add
                    </Button>
                  </HStack>

                  {/* Interest Suggestions */}
                  {interestSuggestions.length > 0 && (
                    <Box mb={4}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        rightIcon={showSuggestions ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        mb={2}
                      >
                        Suggested interests for {ageGroupLabel && `${ageGroupLabel}s`} ({interestSuggestions.length})
                      </Button>
                      <Collapse in={showSuggestions}>
                        <Box bg={suggestionBg} p={3} borderRadius="md">
                          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={2}>
                            {interestSuggestions.map((suggestion, index) => (
                              <Badge
                                key={suggestion}
                                colorScheme={interests.includes(suggestion) ? 'green' : 'gray'}
                                variant={interests.includes(suggestion) ? 'solid' : 'outline'}
                                cursor="pointer"
                                onClick={() => handleSuggestionClick(suggestion)}
                                _hover={{ 
                                  bg: interests.includes(suggestion) ? 'green.600' : 'gray.100',
                                  transform: 'scale(1.05)'
                                }}
                                transition="all 0.2s"
                                p={2}
                                textAlign="center"
                                fontSize="xs"
                              >
                                {suggestion}
                                {interests.includes(suggestion) && ' ✓'}
                              </Badge>
                            ))}
                          </SimpleGrid>
                        </Box>
                      </Collapse>
                    </Box>
                  )}

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
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Click any interest to remove it
                      </Text>
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