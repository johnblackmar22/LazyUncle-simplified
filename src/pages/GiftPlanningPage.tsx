import React, { useEffect, useState } from 'react';
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
  Card,
  CardBody,
  CardHeader,
  useToast,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  HStack,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, StarIcon } from '@chakra-ui/icons';
import { FaUser, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
import { useRecipientStore } from '../store/recipientStore';
import { useOccasionStore } from '../store/occasionStore';
import { useGiftStore } from '../store/giftStore';
import type { Recipient, Occasion } from '../types';
import { safeFormatDate } from '../utils/dateUtils';

export const GiftPlanningPage: React.FC = () => {
  const { recipientId, occasionId } = useParams<{ recipientId: string; occasionId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { recipients, loading: recipientsLoading, fetchRecipients } = useRecipientStore();
  const { occasions, loading: occasionsLoading, fetchOccasions } = useOccasionStore();
  const { recipientGifts, fetchGiftsByRecipient } = useGiftStore();

  const [currentRecipient, setCurrentRecipient] = useState<Recipient | null>(null);
  const [currentOccasion, setCurrentOccasion] = useState<Occasion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      console.log('🎁 Gift Planning Page - Loading data for:', { recipientId, occasionId });
      
      if (!recipientId || !occasionId) {
        console.error('Missing recipientId or occasionId');
        navigate('/recipients');
        return;
      }

      setIsLoading(true);
      
      try {
        // Load recipients and occasions
        await fetchRecipients();
        await fetchOccasions(recipientId);
        
        // Also fetch any existing gifts for this recipient
        await fetchGiftsByRecipient(recipientId);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load gift planning data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [recipientId, occasionId, fetchRecipients, fetchOccasions, fetchGiftsByRecipient, navigate, toast]);

  // Find current recipient and occasion
  useEffect(() => {
    if (recipientId && recipients.length > 0) {
      const recipient = recipients.find(r => r.id === recipientId);
      setCurrentRecipient(recipient || null);
      
      if (!recipient) {
        console.warn('Recipient not found:', recipientId);
      }
    }
  }, [recipientId, recipients]);

  useEffect(() => {
    if (recipientId && occasionId && occasions && occasions[recipientId]) {
      const occasion = occasions[recipientId].find((o: any) => o.id === occasionId);
      setCurrentOccasion(occasion || null);
      
      if (!occasion) {
        console.warn('Occasion not found:', occasionId, 'in occasions:', occasions[recipientId]);
      }
    }
  }, [recipientId, occasionId, occasions]);

  // Get past gifts for this recipient (for AI context)
  const pastGifts = recipientId ? recipientGifts[recipientId] || [] : [];

  // Handle gift selection
  const handleGiftSelected = (gift: any) => {
    console.log('Gift selected in planning page:', gift);
    toast({
      title: 'Gift Selected',
      description: `${gift.name} has been added to your gift plan`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle save for later
  const handleSaveForLater = (gift: any) => {
    console.log('Gift saved for later:', gift);
    toast({
      title: 'Gift Saved',
      description: `${gift.name} has been saved for later consideration`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Loading state
  if (isLoading || recipientsLoading || occasionsLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading gift planning...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  // Error states
  if (!currentRecipient) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Recipient Not Found</AlertTitle>
          <AlertDescription>
            The requested recipient could not be found.
          </AlertDescription>
        </Alert>
        <Button
          as={RouterLink}
          to="/recipients"
          leftIcon={<ArrowBackIcon />}
          mt={4}
        >
          Back to Recipients
        </Button>
      </Container>
    );
  }

  if (!currentOccasion) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Occasion Not Found</AlertTitle>
          <AlertDescription>
            The requested occasion could not be found for this recipient.
          </AlertDescription>
        </Alert>
        <Button
          as={RouterLink}
          to={`/recipients/${recipientId}`}
          leftIcon={<ArrowBackIcon />}
          mt={4}
        >
          Back to {currentRecipient.name}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <Stack spacing={6}>
        {/* Header */}
        <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Flex justify="space-between" align="center" mb={4}>
              <Button
                as={RouterLink}
                to={`/recipients/${recipientId}`}
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
                size="sm"
              >
                Back to {currentRecipient.name}
              </Button>
            </Flex>
            
            <VStack align="start" spacing={3}>
              <Heading size="lg">
                🎁 Gift Planning for {currentRecipient.name}
              </Heading>
              
              <HStack spacing={4} flexWrap="wrap">
                <HStack>
                  <FaUser color="blue" />
                  <Text fontWeight="medium">
                    {currentRecipient.relationship}
                  </Text>
                </HStack>
                
                <HStack>
                  <CalendarIcon color="green" />
                  <Text fontWeight="medium">
                    {currentOccasion.name}
                  </Text>
                </HStack>
                
                <HStack>
                  <FaCalendarAlt color="orange" />
                  <Text>
                    {safeFormatDate(currentOccasion.date)}
                  </Text>
                </HStack>
                
                {currentOccasion.budget && (
                  <HStack>
                    <FaDollarSign color="green" />
                    <Text fontWeight="medium">
                      ${currentOccasion.budget} budget
                    </Text>
                  </HStack>
                )}
              </HStack>
              
              {currentRecipient.interests && currentRecipient.interests.length > 0 && (
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Interests:
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {currentRecipient.interests.map((interest, index) => (
                      <Badge key={index} colorScheme="purple" variant="subtle">
                        {interest}
                      </Badge>
                    ))}
                  </Flex>
                </VStack>
              )}
            </VStack>
          </CardHeader>
        </Card>

        {/* Gift Recommendations */}
        <Box>
          {/* Placeholder for AIGiftRecommendations component */}
        </Box>

        {/* Selected Gifts Summary */}
        {pastGifts.length > 0 && (
          <Card bg={bgColor} shadow="md" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">Previously Selected Gifts</Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="sm" color="gray.600" mb={3}>
                You have {pastGifts.length} gift{pastGifts.length !== 1 ? 's' : ''} for {currentRecipient.name}
              </Text>
              <Stack spacing={2}>
                {pastGifts.slice(0, 3).map((gift: any) => (
                  <HStack key={gift.id} spacing={3}>
                    <Badge colorScheme="green" size="sm">
                      {gift.status}
                    </Badge>
                    <Text fontSize="sm">{gift.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      ${(gift.price / 100).toFixed(2)}
                    </Text>
                  </HStack>
                ))}
                {pastGifts.length > 3 && (
                  <Text fontSize="sm" color="gray.500">
                    ... and {pastGifts.length - 3} more
                  </Text>
                )}
              </Stack>
            </CardBody>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default GiftPlanningPage; 