import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  InputGroup,
  InputRightElement,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  Spinner,
  Flex,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { FaUser, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { useRecipientStore } from '../store/recipientStore';
import { getCurrentDateISO, months, days, years } from '../utils/dateUtils';
import { showErrorToast } from '../utils/toastUtils';
import type { Address } from '../types';
import AddressForm from '../components/AddressForm';

const relationshipOptions = [
  'Nephew', 'Niece', 'Wife', 'Husband', 'Brother', 'Sister', 'Mom', 'Dad', 'Friend', 'Colleague', 'Other'
];

const EditRecipientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { recipients, loading, error, resetError, fetchRecipients, updateRecipient } = useRecipientStore();
  
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
    relationship: false
  });
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Helper function to get diverse colors for interests
  const getInterestColor = (index: number) => {
    const colors = ['purple', 'teal', 'blue', 'orange', 'pink', 'cyan', 'red', 'yellow'];
    return colors[index % colors.length];
  };

  // Fetch recipient data
  useEffect(() => {
    if (id && recipients.length > 0) {
      const recipient = recipients.find(r => r.id === id);
      if (recipient) {
        setName(recipient.name);
        setRelationship(recipient.relationship);
        setDescription(recipient.description || '');
        setDeliveryAddress(recipient.deliveryAddress);
        if (recipient.birthdate) {
          let birthdateStr = '';
          if (typeof recipient.birthdate === 'string') {
            birthdateStr = recipient.birthdate;
          } else if (Object.prototype.toString.call(recipient.birthdate) === '[object Date]') {
            birthdateStr = (recipient.birthdate as Date).toISOString().split('T')[0];
          }
          const [year, month, day] = birthdateStr.split('-');
          setBirthMonth(month || '');
          setBirthDay(day || '');
          setBirthYear(year || '');
        } else {
          setBirthMonth('');
          setBirthDay('');
          setBirthYear('');
        }
        setInterests([...recipient.interests]);
      }
    }
  }, [id, recipients]);
  
  // In useEffect, fetch recipients if not already loaded
  useEffect(() => {
    if (recipients.length === 0) {
      fetchRecipients();
    }
  }, [recipients, fetchRecipients]);
  
  const isNameInvalid = touched.name && name.trim() === '';
  const isRelationshipInvalid = touched.relationship && relationship.trim() === '';

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
    resetError();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      relationship: true
    });
    
    if (isNameInvalid || isRelationshipInvalid || !id) {
      return;
    }
    
    try {
      let birthdateStr = '';
      if (birthYear && birthMonth && birthDay) {
        birthdateStr = `${birthYear}-${birthMonth}-${birthDay}`;
      }
      await updateRecipient(id, {
        name,
        relationship,
        birthdate: birthdateStr || undefined,
        interests,
        description: description.trim() || undefined,
        deliveryAddress,
      });
      
      toast({
        title: 'Recipient updated',
        description: `${name} has been updated successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate(`/recipients/${id}`);
    } catch (err) {
      showErrorToast(toast, err, { title: 'Error updating recipient' });
    }
  };

  if (loading && !recipients.length) {
    return (
      <Container maxW="container.md" mt={4}>
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  const currentRecipient = recipients.find(r => r.id === id);
  if (!currentRecipient && !loading) {
    return (
      <Container maxW="container.md" mt={4}>
        <Box textAlign="center" p={8}>
          <Text fontSize="lg" mb={4}>Recipient not found</Text>
          <Button as={RouterLink} to="/recipients" leftIcon={<ArrowBackIcon />}>
            Back to Recipients
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" mt={4}>
      <VStack spacing={6} align="stretch">
        {/* Header with back navigation */}
        <Box>
          <IconButton
            as={RouterLink}
            to={`/recipients/${id}`}
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            variant="ghost"
            mb={4}
          />
          <Heading size="xl" mb={2}>Edit {name}</Heading>
          <Text color="gray.600">
            Update their information to get better gift recommendations.
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
                      <Text fontSize="sm" fontWeight="bold" mb={2}>Current interests:</Text>
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
                    onChange={setDeliveryAddress}
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
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="For example: 'My brother loves outdoor adventures and craft beer. He's always been the adventurous one in our family and enjoys trying new things...'"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </CardBody>
            <CardFooter>
              <HStack spacing={3} width="100%" justifyContent="space-between">
                <Button variant="ghost" as={RouterLink} to={`/recipients/${id}`}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit" 
                  isLoading={loading}
                  leftIcon={<Icon as={FaUser} />}
                >
                  Update Recipient
                </Button>
              </HStack>
            </CardFooter>
          </form>
        </Card>
      </VStack>
    </Container>
  );
};

export default EditRecipientPage; 