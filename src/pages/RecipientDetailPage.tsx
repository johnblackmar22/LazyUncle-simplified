import React, { useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  Badge,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Divider,
  SimpleGrid,
  Avatar,
  HStack,
  VStack,
  Spinner,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useRecipientStore } from '../store/recipientStore';
import { formatDate, getDaysUntil } from '../utils/dateUtils';
import AutoSendPreferences from '../components/AutoSendPreferences';

export const RecipientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { 
    recipients, 
    selectedRecipient, 
    loading, 
    error, 
    fetchRecipients, 
    fetchRecipient,
    removeRecipient
  } = useRecipientStore();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (id) {
      fetchRecipient(id);
    }
  }, [id, fetchRecipient]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await removeRecipient(id!);
        toast({
          title: 'Recipient deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/recipients');
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.500" borderRadius="md">
        <Text>Error: {error}</Text>
      </Box>
    );
  }

  if (!selectedRecipient) {
    return (
      <Box textAlign="center" p={8}>
        <Text fontSize="lg" mb={4}>Recipient not found</Text>
        <Button
          as={RouterLink}
          to="/recipients"
          colorScheme="blue"
          leftIcon={<ArrowBackIcon />}
        >
          Back to Recipients
        </Button>
      </Box>
    );
  }

  // Sort important dates by days until
  const sortedDates = [...selectedRecipient.importantDates].sort((a, b) => {
    return getDaysUntil(a.date) - getDaysUntil(b.date);
  });

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
          
          <Flex justify="space-between" align="center">
            <Heading size="xl" mb={2}>{selectedRecipient.name}</Heading>
            <HStack spacing={2}>
              <IconButton
                as={RouterLink}
                to={`/recipients/${selectedRecipient.id}/edit`}
                aria-label="Edit"
                icon={<EditIcon />}
                colorScheme="blue"
                variant="outline"
              />
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="outline"
                onClick={handleDelete}
              />
            </HStack>
          </Flex>
          
          <Badge colorScheme="blue" fontSize="md" mt={1}>
            {selectedRecipient.relationship}
          </Badge>
        </Box>

        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={0}>
            <Heading size="md">Contact Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {selectedRecipient.email && (
                <Box>
                  <Text fontWeight="bold">Email</Text>
                  <Text>{selectedRecipient.email}</Text>
                </Box>
              )}
              
              {selectedRecipient.phone && (
                <Box>
                  <Text fontWeight="bold">Phone</Text>
                  <Text>{selectedRecipient.phone}</Text>
                </Box>
              )}
              
              {selectedRecipient.address && (
                <Box gridColumn={{ md: 'span 2' }}>
                  <Text fontWeight="bold">Address</Text>
                  <Text>{selectedRecipient.address}</Text>
                </Box>
              )}
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={0}>
            <Heading size="md">Interests</Heading>
          </CardHeader>
          <CardBody>
            {selectedRecipient.interests.length > 0 ? (
              <Flex gap={2} flexWrap="wrap">
                {selectedRecipient.interests.map((interest, index) => (
                  <Badge key={index} colorScheme="green" variant="solid" px={2} py={1}>
                    {interest}
                  </Badge>
                ))}
              </Flex>
            ) : (
              <Text color="gray.500">No interests added yet.</Text>
            )}
          </CardBody>
        </Card>

        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={0}>
            <Heading size="md">Important Dates</Heading>
          </CardHeader>
          <CardBody>
            {sortedDates.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {sortedDates.map((date) => {
                  const daysUntil = getDaysUntil(date.date);
                  let colorScheme = "blue";
                  if (daysUntil <= 7) colorScheme = "red";
                  else if (daysUntil <= 30) colorScheme = "orange";
                  
                  return (
                    <Box key={date.id} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                      <Flex justify="space-between" align="center">
                        <Box>
                          <Text fontWeight="bold">
                            {date.type === 'birthday' ? 'Birthday' : 
                             date.type === 'anniversary' ? 'Anniversary' : 
                             date.name || 'Custom Date'}
                          </Text>
                          <Text>{formatDate(date.date)}</Text>
                        </Box>
                        <Badge colorScheme={colorScheme} fontSize="sm">
                          {daysUntil === 0 ? 'Today!' : 
                           daysUntil === 1 ? 'Tomorrow!' : 
                           `${daysUntil} days`}
                        </Badge>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            ) : (
              <Text color="gray.500">No important dates added yet.</Text>
            )}
          </CardBody>
        </Card>

        {selectedRecipient.notes && (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Heading size="md">Notes</Heading>
            </CardHeader>
            <CardBody>
              <Text whiteSpace="pre-wrap">{selectedRecipient.notes}</Text>
            </CardBody>
          </Card>
        )}
        
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader pb={0}>
            <Heading size="md">Auto-Send Preferences</Heading>
          </CardHeader>
          <CardBody>
            <AutoSendPreferences recipient={selectedRecipient} />
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}; 