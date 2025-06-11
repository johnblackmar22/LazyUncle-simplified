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
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { FaUser, FaHeart, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
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
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([]);
  
  // Validation
  const [touched, setTouched] = useState({
    name: false,
    relationship: false,
    birthdate: false,
    birthdateComplete: false,
    deliveryAddress: false
  });
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Calculate birthdate string and get suggestions
  const birthdate = useMemo(() => {
    if (birthYear && birthMonth && birthDay) {
      return `${birthYear}-${birthMonth}-${birthDay}`;
    }
    return '';
  }, [birthYear, birthMonth, birthDay]);

  const allInterestSuggestions = useMemo(() => {
    if (!birthdate) return [];
    return getInterestSuggestions(birthdate, gender);
  }, [birthdate, gender]);

  const ageGroupLabel = useMemo(() => {
    if (!birthdate) return '';
    return getAgeGroupLabel(birthdate);
  }, [birthdate]);

  // Manage displayed suggestions (show ~10 at a time)
  useEffect(() => {
    if (allInterestSuggestions.length > 0) {
      // Filter out already selected interests
      const availableSuggestions = allInterestSuggestions.filter(
        suggestion => !interests.includes(suggestion)
      );
      
      // Take up to 10 suggestions
      const newDisplayed = availableSuggestions.slice(0, 10);
      setDisplayedSuggestions(newDisplayed);
    } else {
      setDisplayedSuggestions([]);
    }
  }, [allInterestSuggestions, interests]);

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number): string => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow', 'green'];
    return colors[index % colors.length];
  };

  // Validation checks
  const isNameInvalid = touched.name && name.trim() === '';
  const isRelationshipInvalid = touched.relationship && relationship.trim() === '';
  const isBirthdateInvalid = (touched.birthdate || touched.birthdateComplete) && (!birthYear || !birthMonth || !birthDay);
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
    // The useEffect above will automatically update displayedSuggestions to replace the selected one
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      relationship: true,
      birthdate: true,
      birthdateComplete: true,
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
                <Heading size="md">Add New Recipient</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="start">
                {/* Basic Info Row */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                  <FormControl isRequired isInvalid={isNameInvalid}>
                    <FormLabel fontSize="sm">Name</FormLabel>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched({ ...touched, name: true })}
                      placeholder="Enter recipient's name"
                      size="sm"
                    />
                    {isNameInvalid && (
                      <FormErrorMessage fontSize="xs">Name is required</FormErrorMessage>
                    )}
                  </FormControl>
                  
                  <FormControl isRequired isInvalid={isRelationshipInvalid}>
                    <FormLabel fontSize="sm">Relationship</FormLabel>
                    <Select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      onBlur={() => setTouched({ ...touched, relationship: true })}
                      placeholder="Select relationship"
                      size="sm"
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
                        size="sm"
                      />
                    )}
                    {isRelationshipInvalid && (
                      <FormErrorMessage fontSize="xs">Relationship is required</FormErrorMessage>
                    )}
                  </FormControl>
                </SimpleGrid>

                {/* Birthdate and Gender Row */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} width="100%">
                  <FormControl isRequired isInvalid={isBirthdateInvalid}>
                    <Flex align="center" gap={2} mb={1}>
                      <Icon as={FaBirthdayCake} color="pink.500" boxSize={3} />
                      <FormLabel mb={0} fontSize="sm">Birthdate</FormLabel>
                    </Flex>
                    <HStack>
                      <Select
                        placeholder="Month"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        onBlur={() => {
                          if (birthYear && birthDay) {
                            setTouched({ ...touched, birthdateComplete: true });
                          }
                        }}
                        size="sm"
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
                        onBlur={() => {
                          if (birthYear && birthMonth) {
                            setTouched({ ...touched, birthdateComplete: true });
                          }
                        }}
                        size="sm"
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
                        onBlur={() => {
                          if (birthMonth && birthDay) {
                            setTouched({ ...touched, birthdateComplete: true });
                          }
                        }}
                        size="sm"
                      >
                        {years.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    </HStack>
                    {isBirthdateInvalid && (
                      <FormErrorMessage fontSize="xs">Birthdate is required</FormErrorMessage>
                    )}
                    {ageGroupLabel && (
                      <Text fontSize="xs" color="blue.600" mt={1}>
                        Age Group: {ageGroupLabel}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <Flex align="center" gap={2} mb={1}>
                      <Icon as={FaVenusMars} color="purple.500" boxSize={3} />
                      <FormLabel mb={0} fontSize="sm">Gender (Optional)</FormLabel>
                    </Flex>
                    <Select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      placeholder="Select gender"
                      size="sm"
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <Divider />

                {/* Interests Section */}
                <Box width="100%">
                  <Flex align="center" gap={2} mb={2}>
                    <Icon as={FaHeart} color="red.500" boxSize={3} />
                    <FormLabel mb={0} fontSize="sm">Interests</FormLabel>
                  </Flex>
                  
                  <HStack mb={2}>
                    <Input
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder="Add an interest"
                      size="sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <Button onClick={() => handleAddInterest()} leftIcon={<AddIcon />} colorScheme="blue" size="sm">
                      Add
                    </Button>
                  </HStack>

                  {/* Interest Suggestions - Inline Style */}
                  {displayedSuggestions.length > 0 && (
                    <Box mb={2}>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Suggested ({displayedSuggestions.length}):
                      </Text>
                      <Flex gap={1} flexWrap="wrap">
                        {displayedSuggestions.map((suggestion, index) => (
                          <Badge
                            key={suggestion}
                            colorScheme={getInterestColor(index)}
                            variant="outline"
                            cursor="pointer"
                            onClick={() => handleSuggestionClick(suggestion)}
                            _hover={{ 
                              variant: 'solid',
                              transform: 'scale(1.05)'
                            }}
                            _active={{
                              transform: 'scale(0.95)'
                            }}
                            transition="all 0.15s ease"
                            fontSize="xs"
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </Flex>
                      {interests.length > 0 && displayedSuggestions.length < 10 && (
                        <Text fontSize="xs" color="gray.500" mt={1} fontStyle="italic">
                          More suggestions will appear as you add interests
                        </Text>
                      )}
                    </Box>
                  )}

                  {interests.length > 0 && (
                    <Box mb={2}>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Added interests:</Text>
                      <Flex gap={1} flexWrap="wrap">
                        {interests.map((int, index) => (
                          <Badge
                            key={int}
                            colorScheme={getInterestColor(index)}
                            variant="solid"
                            cursor="pointer"
                            onClick={() => handleRemoveInterest(int)}
                            _hover={{ opacity: 0.8 }}
                            fontSize="xs"
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
                </Box>

                <Divider />
                
                {/* Description Section */}
                <FormControl>
                  <FormLabel fontSize="sm">Tell us about them (Optional)</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Share a few sentences about this person and your relationship..."
                    rows={3}
                    size="sm"
                  />
                </FormControl>

                <Divider />

                {/* Address Section */}
                <FormControl isRequired isInvalid={isDeliveryAddressInvalid} width="100%">
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
                    <FormErrorMessage fontSize="xs">Delivery address is required</FormErrorMessage>
                  )}
                </FormControl>
              </VStack>
            </CardBody>
            <CardFooter>
              <HStack spacing={3} width="100%" justifyContent="space-between">
                <Button variant="ghost" as={RouterLink} to="/recipients" size="sm">
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit" 
                  isLoading={loading}
                  leftIcon={<AddIcon />}
                  size="sm"
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