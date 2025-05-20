import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Flex
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { getCurrentDateISO } from '../utils/dateUtils';
import { showErrorToast } from '../utils/toastUtils';

const EditRecipientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { recipients, loading, error, resetError, fetchRecipients, updateRecipient } = useRecipientStore();
  
  // Form values
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthdate, setBirthdate] = useState(getCurrentDateISO());
  
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

  // Fetch recipient data
  useEffect(() => {
    if (id && recipients.length > 0) {
      const recipient = recipients.find(r => r.id === id);
      if (recipient) {
        setName(recipient.name);
        setRelationship(recipient.relationship);
        setBirthdate(recipient.birthdate ? new Date(recipient.birthdate).toISOString().split('T')[0] : getCurrentDateISO());
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
      await updateRecipient(id, {
        name,
        relationship,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        interests
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
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate(`/recipients/${id}`)}
            mb={4}
          >
            Back to Recipient
          </Button>
          <Heading size="xl" mb={2}>Edit {name}</Heading>
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
                <FormLabel>Birthdate</FormLabel>
                <Input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
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
                Update Recipient
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default EditRecipientPage; 