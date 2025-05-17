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
  Select,
  Flex,
  Badge,
  Checkbox
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon, CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';

const AddRecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addRecipient, loading, error, resetError } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [addBirthdayGift, setAddBirthdayGift] = useState(true);
  
  // Interest management
  const [interest, setInterest] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const suggestedInterests = ['Gaming', 'Music', 'Tech', 'Travel', 'Sports', 'Food', 'Books', 'Movies', 'Fashion', 'Outdoors'];
  
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

  const handleSuggestedInterest = (suggestedInterest: string) => {
    if (!interests.includes(suggestedInterest)) {
      setInterests([...interests, suggestedInterest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    
    if (!name.trim() || !relationship.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      console.log('Adding recipient:', { name, relationship, birthdate, interests });
      
      // Create a birthdate Date object if provided
      const birthdateObj = birthdate ? new Date(birthdate) : undefined;
      
      const result = await addRecipient({
        name,
        relationship,
        birthdate: birthdateObj,
        interests,
        giftPreferences: {
          priceRange: {
            min: 0,
            max: 100 // Default budget
          }
        }
      });
      
      console.log('Recipient added successfully');
      
      toast({
        title: "Success!",
        description: `${name} added successfully!`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // If checkbox is checked, redirect to add gift page with the recipient ID
      if (addBirthdayGift && birthdateObj) {
        // If we have the result with ID, use it
        if (result && result.id) {
          setTimeout(() => {
            navigate(`/gifts/add/${result.id}`);
          }, 500);
          return;
        }
        
        // Otherwise try to find the recipient we just added
        const lastAddedRecipient = useRecipientStore.getState().recipients.find(
          r => r.name === name && r.relationship === relationship
        );
        
        if (lastAddedRecipient && lastAddedRecipient.id) {
          setTimeout(() => {
            navigate(`/gifts/add/${lastAddedRecipient.id}`);
          }, 500);
          return;
        }
      }
      
      // Default navigation to recipients list
      setTimeout(() => {
        navigate('/recipients');
      }, 1000);
    } catch (err) {
      console.error('Error adding recipient:', err);
      toast({
        title: "Error adding recipient",
        description: (err as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading>Add Recipient</Heading>
          <Button
            leftIcon={<ArrowBackIcon />}
            onClick={() => navigate('/recipients')}
            variant="ghost"
          >
            Back to Recipients
          </Button>
        </Flex>
        
        <Box bg={bgColor} borderRadius="lg" p={6} boxShadow="md">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Their name"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Relationship</FormLabel>
                <Select 
                  value={relationship} 
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Select relationship"
                >
                  <option value="Nephew">Nephew</option>
                  <option value="Niece">Niece</option>
                  <option value="Family">Other Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Birthday (Optional)</FormLabel>
                <Input 
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </FormControl>
              
              {birthdate && (
                <FormControl>
                  <Checkbox 
                    isChecked={addBirthdayGift} 
                    onChange={(e) => setAddBirthdayGift(e.target.checked)}
                    colorScheme="purple"
                  >
                    Add a birthday gift after creating recipient
                  </Checkbox>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Interests</FormLabel>
                <InputGroup>
                  <Input
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="Add interests (e.g. gaming, books)"
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
                
                {/* Suggested interests */}
                <Box mt={3}>
                  <Text fontSize="sm" mb={2}>Suggested interests:</Text>
                  <Flex flexWrap="wrap" gap={2}>
                    {suggestedInterests.map((si) => (
                      <Badge
                        key={si}
                        px={2}
                        py={1}
                        borderRadius="full"
                        colorScheme={interests.includes(si) ? "green" : "gray"}
                        cursor="pointer"
                        onClick={() => handleSuggestedInterest(si)}
                      >
                        {si}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              </FormControl>
              
              <Divider />
              
              <Flex justify="flex-end">
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Adding..."
                  rightIcon={<CheckIcon />}
                >
                  Add Recipient
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default AddRecipientPage; 