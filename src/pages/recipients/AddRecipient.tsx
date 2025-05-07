import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Tag,
  TagLabel,
  TagCloseButton,
  Text,
  Textarea,
  useColorModeValue,
  HStack,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import type { Address } from '../../types';

const AddRecipient = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addRecipient } = useRecipientStore();
  
  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newInterest, setNewInterest] = useState('');
  
  // Address state
  const [address, setAddress] = useState<Partial<Address>>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  
  // Error state
  const [errors, setErrors] = useState<{
    name?: string;
    relationship?: string;
  }>({});
  
  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };
  
  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };
  
  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress({
      ...address,
      [field]: value,
    });
  };
  
  const validateForm = () => {
    const newErrors: {name?: string; relationship?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!relationship) {
      newErrors.relationship = 'Relationship is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare address if any field is filled
    const hasAddress = Object.values(address).some(value => value.trim() !== '');
    const recipientAddress = hasAddress ? address as Address : undefined;
    
    addRecipient({
      name,
      relationship,
      interests,
      notes: notes || undefined,
      address: recipientAddress,
    });
    
    toast({
      title: 'Recipient added',
      description: `${name} has been added to your recipients.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    navigate('/recipients');
  };
  
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Container maxW="container.md" py={5}>
      <Heading as="h1" size="lg" mb={6}>
        Add New Recipient
      </Heading>
      
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={boxBg}
        p={6}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Stack spacing={4}>
          <FormControl isRequired isInvalid={!!errors.name}>
            <FormLabel>Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipient name"
            />
            {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.relationship}>
            <FormLabel>Relationship</FormLabel>
            <Select
              placeholder="Select relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Colleague">Colleague</option>
              <option value="Acquaintance">Acquaintance</option>
              <option value="Other">Other</option>
            </Select>
            {errors.relationship && <FormErrorMessage>{errors.relationship}</FormErrorMessage>}
          </FormControl>
          
          <FormControl>
            <FormLabel>Interests</FormLabel>
            <HStack mb={2}>
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <Button onClick={handleAddInterest}>Add</Button>
            </HStack>
            <Box>
              {interests.length > 0 ? (
                <Flex flexWrap="wrap" gap={2}>
                  {interests.map((interest, index) => (
                    <Tag key={index} colorScheme="blue" size="md">
                      <TagLabel>{interest}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveInterest(interest)} />
                    </Tag>
                  ))}
                </Flex>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Add interests to help you find better gifts
                </Text>
              )}
            </Box>
          </FormControl>
          
          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this recipient"
              rows={3}
            />
          </FormControl>
          
          <Divider my={4} />
          
          <Heading as="h3" size="md" mb={2}>
            Address (Optional)
          </Heading>
          
          <FormControl>
            <FormLabel>Street Address</FormLabel>
            <Input
              value={address.line1}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              placeholder="Street address, P.O. box"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Apartment, suite, etc.</FormLabel>
            <Input
              value={address.line2}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </FormControl>
          
          <Flex gap={4}>
            <FormControl>
              <FormLabel>City</FormLabel>
              <Input
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="City"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>State/Province</FormLabel>
              <Input
                value={address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="State/Province"
              />
            </FormControl>
          </Flex>
          
          <Flex gap={4}>
            <FormControl>
              <FormLabel>ZIP / Postal code</FormLabel>
              <Input
                value={address.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                placeholder="ZIP or postal code"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Country</FormLabel>
              <Input
                value={address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="Country"
              />
            </FormControl>
          </Flex>
          
          <Flex justify="space-between" mt={6}>
            <Button
              variant="outline"
              onClick={() => navigate('/recipients')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
            >
              Save Recipient
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Container>
  );
};

export default AddRecipient; 