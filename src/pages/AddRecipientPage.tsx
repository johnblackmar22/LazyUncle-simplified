import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { getCurrentDateISO } from '../utils/dateUtils';
import type { ImportantDate } from '../types';

const AddRecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { createRecipient, loading, error, clearError } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Interest management
  const [interest, setInterest] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  
  // Date management
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [dateType, setDateType] = useState<'birthday' | 'anniversary' | 'custom'>('birthday');
  const [dateValue, setDateValue] = useState(getCurrentDateISO());
  const [dateName, setDateName] = useState('');
  
  // Validation
  const [touched, setTouched] = useState({
    name: false,
    relationship: false
  });
  
  const isNameInvalid = touched.name && name.trim() === '';
  const isRelationshipInvalid = touched.relationship && relationship.trim() === '';
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAddInterest = () => {
    if (interest.trim() !== '' && !interests.includes(interest.trim())) {
      setInterests([...interests, interest.trim()]);
      setInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleAddDate = () => {
    if (dateValue) {
      const newDate: ImportantDate = {
        id: `date-${Date.now()}`,
        type: dateType,
        date: dateValue,
        ...(dateType === 'custom' && dateName ? { name: dateName } : {})
      };
      
      setDates([...dates, newDate]);
      setDateValue(getCurrentDateISO());
      setDateName('');
      setDateType('birthday');
    }
  };

  const handleRemoveDate = (dateId: string) => {
    setDates(dates.filter(d => d.id !== dateId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Mark fields as touched for validation
    setTouched({
      name: true,
      relationship: true
    });
    
    if (isNameInvalid || isRelationshipInvalid) {
      return;
    }
    
    try {
      await createRecipient({
        name,
        relationship,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
        interests,
        importantDates: dates
      });
      
      toast({
        title: 'Recipient added',
        description: `${name} has been added to your recipients.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/recipients');
    } catch (err) {
      toast({
        title: 'Error adding recipient',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate('/recipients')}
            mb={4}
          >
            Back to Recipients
          </Button>
          <Heading size="xl" mb={2}>Add New Recipient</Heading>
          <Text color="gray.600">
            Add someone you'd like to keep track of for gifts and special occasions.
          </Text>
        </Box>

        <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="start">
              <Heading size="md">Basic Information</Heading>
              
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
                <Input 
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  onBlur={() => setTouched({ ...touched, relationship: true })}
                  placeholder="e.g., Friend, Family, Colleague"
                />
                {isRelationshipInvalid && (
                  <FormErrorMessage>Relationship is required</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address (optional)"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Home address (optional)"
                />
              </FormControl>
              
              <Divider my={2} />
              
              <Heading size="md">Interests & Preferences</Heading>
              
              <FormControl>
                <FormLabel>Interests</FormLabel>
                <InputGroup>
                  <Input 
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="Add an interest (e.g., Cooking, Reading, Golf)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Add interest"
                      icon={<AddIcon />}
                      size="sm"
                      onClick={handleAddInterest}
                    />
                  </InputRightElement>
                </InputGroup>
                
                <Box mt={2}>
                  <HStack spacing={2} flexWrap="wrap">
                    {interests.map((item, index) => (
                      <Tag
                        key={index}
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                        my={1}
                      >
                        <TagLabel>{item}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveInterest(item)} />
                      </Tag>
                    ))}
                  </HStack>
                </Box>
              </FormControl>
              
              <Divider my={2} />
              
              <Heading size="md">Important Dates</Heading>
              
              <HStack width="100%">
                <FormControl flex="1">
                  <FormLabel>Date Type</FormLabel>
                  <select
                    value={dateType}
                    onChange={(e) => setDateType(e.target.value as any)}
                    style={{
                      padding: '8px',
                      borderRadius: '0.375rem',
                      width: '100%',
                      borderColor: borderColor
                    }}
                  >
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="custom">Custom</option>
                  </select>
                </FormControl>
                
                <FormControl flex="1">
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                  />
                </FormControl>
                
                {dateType === 'custom' && (
                  <FormControl flex="1">
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={dateName}
                      onChange={(e) => setDateName(e.target.value)}
                      placeholder="e.g., Graduation"
                    />
                  </FormControl>
                )}
                
                <IconButton
                  aria-label="Add date"
                  icon={<AddIcon />}
                  onClick={handleAddDate}
                  alignSelf="flex-end"
                  mb="2px"
                />
              </HStack>
              
              <Box width="100%">
                {dates.length > 0 ? (
                  <VStack align="stretch" spacing={2} mt={2}>
                    {dates.map((date) => (
                      <HStack key={date.id} p={2} borderWidth="1px" borderRadius="md">
                        <Text flex="1">
                          <strong>
                            {date.type === 'custom' ? date.name : date.type.charAt(0).toUpperCase() + date.type.slice(1)}:
                          </strong> {new Date(date.date).toLocaleDateString()}
                        </Text>
                        <IconButton
                          aria-label="Remove date"
                          icon={<TagCloseButton />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveDate(date.id)}
                        />
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" mt={2}>No important dates added yet.</Text>
                )}
              </Box>
              
              <Divider my={2} />
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this recipient"
                  minHeight="100px"
                />
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
              >
                Add Recipient
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default AddRecipientPage; 