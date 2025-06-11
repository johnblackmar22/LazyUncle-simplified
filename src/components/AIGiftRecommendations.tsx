import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Card,
  CardBody,
  Badge,
  Image,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import { FiRefreshCw, FiHeart, FiShoppingCart, FiInfo, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { giftRecommendationEngine, type GiftRecommendationRequest, type GiftRecommendation } from '../services/giftRecommendationEngine';
import { useGiftStorage } from '../hooks/useGiftStorage';
import { useAuthStore } from '../store/authStore';
import type { Recipient, Occasion } from '../types';
import { FaCheck, FaHeart } from 'react-icons/fa';
import AdminService from '../services/adminService';

interface AIGiftRecommendationsProps {
  recipient: Recipient;
  occasion: Occasion;
  budget: { min: number; max: number };
  onGiftSelected?: (gift: GiftRecommendation) => void;
}

export const AIGiftRecommendations: React.FC<AIGiftRecommendationsProps> = ({
  recipient,
  occasion,
  budget,
  onGiftSelected
}) => {
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  
  const { selectGift, saveForLater, getRecommendations, getSelectedGiftsForOccasion } = useGiftStorage();
  const { user } = useAuthStore();
  const toast = useToast();

  // Get selected gifts for this recipient/occasion to check button state
  const selectedGifts = getSelectedGiftsForOccasion(recipient.id, occasion.id);
  const selectedGiftIds = selectedGifts.map(g => g.id);

  // Debug logging for button states
  console.log('🔍 AIGiftRecommendations Debug:', {
    recipientId: recipient.id,
    occasionId: occasion.id,
    selectedGifts: selectedGifts.length,
    selectedGiftIds,
    recommendationsCount: recommendations.length
  });

  const generateRecommendations = async (excludeIds: string[] = []) => {
    setLoading(true);
    setError(null);

    try {
      // Collect previous gift names for this recipient/occasion
      const previousRecs = getRecommendations(recipient.id, occasion.id);
      const previousGiftNames = previousRecs.map((rec: any) => rec.name).filter(Boolean);

      const request: GiftRecommendationRequest = {
        recipient,
        occasion,
        budget,
        excludeCategories: ['inappropriate', 'controversial'],
        preferredCategories: recipient.interests.length > 0 ? recipient.interests : undefined,
        previousGiftNames // <-- send to backend
      };

      console.log('🤖 Generating recommendations for:', {
        recipient: recipient.name,
        occasion: occasion.name,
        budget,
        interests: recipient.interests
      });

      const response = await giftRecommendationEngine.getRecommendations(request);
      
      // Filter out excluded recommendations
      const filteredRecommendations = response.recommendations.filter(
        rec => !excludeIds.includes(rec.id)
      );

      setRecommendations(filteredRecommendations);

      if (filteredRecommendations.length === 0) {
        setError('No recommendations found. Try adjusting your budget or the recipient\'s interests.');
      } else {
        toast({
          title: 'Recommendations Generated!',
          description: `Found ${filteredRecommendations.length} great gift ideas`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateRecommendations = () => {
    const newExcludedIds = [...excludedIds, ...recommendations.map(r => r.id)];
    setExcludedIds(newExcludedIds);
    generateRecommendations(newExcludedIds);
  };

  const handleSelectGift = async (gift: GiftRecommendation) => {
    console.log('🔥 BUTTON CLICKED - handleSelectGift called!');
    try {
      console.log('🖱️ Select Gift button clicked for:', gift.name);
      const selectedGift = await selectGift(gift, recipient.id, occasion.id);
      console.log('✅ Gift selection completed successfully:', selectedGift);
      toast({
        title: 'Gift Selected!',
        description: `"${gift.name}" has been added to your selections and an order has been created for admin processing`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onGiftSelected?.(gift);
    } catch (error) {
      console.error('❌ Error in handleSelectGift (order creation):', error);
      toast({
        title: 'Order Creation Failed',
        description: `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const handleSaveForLater = (gift: GiftRecommendation) => {
    try {
      saveForLater(gift, recipient.id, occasion.id);
      
      toast({
        title: 'Saved!',
        description: `"${gift.name}" has been saved for later`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save gift',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFeedback = async (gift: GiftRecommendation, feedbackType: 'thumbs_up' | 'thumbs_down') => {
    try {
      // Update local state immediately for UI responsiveness
      setFeedback(prev => ({ ...prev, [gift.id]: feedbackType }));
      
      // TODO: Store feedback in database
      // For now, just show toast feedback
      const message = feedbackType === 'thumbs_up' 
        ? 'Thanks! This helps us recommend better gifts.'
        : 'Got it! We\'ll avoid similar suggestions.';
      
      toast({
        title: feedbackType === 'thumbs_up' ? 'Great choice!' : 'Feedback noted',
        description: message,
        status: feedbackType === 'thumbs_up' ? 'success' : 'info',
        duration: 2000,
        isClosable: true,
      });
      
      console.log('📝 Gift feedback:', {
        giftId: gift.id,
        giftName: gift.name,
        feedbackType,
        recipientId: recipient.id,
        occasionId: occasion.id
      });
      
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOrderGift = async (gift: GiftRecommendation) => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to order gifts',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Create admin order for processing
      const adminOrder = {
        userId: user.id,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        // Recipient Info (who receives)
        recipientName: recipient.name,
        recipientRelationship: recipient.relationship,
        recipientAddress: formatAddress(recipient.deliveryAddress),
        // Order Details
        occasion: occasion.name,
        occasionId: occasion.id,
        occasionDate: occasion.date,
        giftTitle: gift.name,
        giftDescription: gift.description || '',
        giftPrice: gift.price,
        giftImageUrl: gift.imageUrl || '',
        giftUrl: gift.purchaseUrl,
        asin: gift.asin, // Use ASIN from AI recommendation
        status: 'pending' as const,
        priority: 'normal' as const,
        notes: `User selected: ${gift.reasoning}`,
        shippingAddress: {
          name: recipient.name,
          street: recipient.deliveryAddress?.line1 || '',
          city: recipient.deliveryAddress?.city || '',
          state: recipient.deliveryAddress?.state || '',
          zipCode: recipient.deliveryAddress?.postalCode || '',
          country: recipient.deliveryAddress?.country || 'US',
        },
        source: 'gift_selection' as const,
        giftWrap: occasion.giftWrap || false,
        personalNote: occasion.noteText || '',
      };

      // Save via AdminService for consistency
      const orderId = await AdminService.addOrder(adminOrder);
      console.log('📋 Created admin order from gift recommendation:', orderId);

      toast({
        title: 'Gift Selected!',
        description: 'Your gift selection has been sent to our team for processing.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      // Call onGiftSelected if provided
      if (onGiftSelected) {
        onGiftSelected(gift);
      }

    } catch (error) {
      console.error('❌ Error creating admin order:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your gift selection. Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Helper function to format address
  const formatAddress = (address: any): string => {
    if (!address) return 'No address provided';
    return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postalCode}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'orange';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'green';
      case 'limited': return 'yellow';
      case 'out_of_stock': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box w="100%">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold">
                AI Gift Recommendations
              </Text>
              <Text fontSize="sm" color="gray.600">
                For {recipient.name}'s {occasion.name} • Budget: ${budget.min} - ${budget.max}
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              leftIcon={<FiRefreshCw />}
              onClick={() => generateRecommendations()}
              isLoading={loading}
              loadingText="Generating..."
              size="md"
            >
              {recommendations.length > 0 ? 'Regenerate' : 'Generate Ideas'}
            </Button>
          </HStack>

          {recommendations.length > 0 && (
            <HStack spacing={2} mb={4}>
              <Text fontSize="sm" color="gray.600">
                Not quite right?
              </Text>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiRefreshCw size={14} />}
                onClick={handleRegenerateRecommendations}
                isDisabled={loading}
              >
                Try Different Options
              </Button>
            </HStack>
          )}
        </Box>

        {/* Loading State */}
        {loading && (
          <VStack spacing={4}>
            <Spinner size="lg" color="blue.500" />
            <Text>Finding the perfect gifts...</Text>
            <HStack spacing={4}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height="200px" width="300px" borderRadius="md" />
              ))}
            </HStack>
          </VStack>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Unable to generate recommendations</Text>
              <Text fontSize="sm">{error}</Text>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => generateRecommendations()}
              >
                Try Again
              </Button>
            </VStack>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && !loading && (
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold">
              Recommended Gifts ({recommendations.length})
            </Text>
            
            <VStack spacing={4}>
              {recommendations.map((gift, index) => (
                <Card key={gift.id} size="md" variant="outline" w="100%">
                  <CardBody>
                    <Flex
                      direction={{ base: 'column', md: 'row' }}
                      align={{ base: 'stretch', md: 'start' }}
                      gap={4}
                    >
                      {/* Gift Image */}
                      <Box flexShrink={0}>
                        {gift.imageUrl ? (
                          <Image
                            src={gift.imageUrl}
                            alt={gift.name}
                            boxSize="120px"
                            objectFit="cover"
                            borderRadius="md"
                            fallback={
                              <Box
                                boxSize="120px"
                                bg="gray.100"
                                borderRadius="md"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text fontSize="xs" color="gray.500" textAlign="center">
                                  No Image
                                </Text>
                              </Box>
                            }
                          />
                        ) : (
                          <Box
                            boxSize="120px"
                            bg="gray.100"
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              No Image
                            </Text>
                          </Box>
                        )}
                      </Box>

                      {/* Gift Details */}
                      <VStack align="start" spacing={3} flex={1} minW={0}>
                        <VStack align="start" spacing={1}>
                          <HStack justify="space-between" w="100%">
                            <Text fontSize="lg" fontWeight="bold">
                              {gift.name}
                            </Text>
                            <Text fontSize="lg" fontWeight="bold" color="blue.600">
                              ${gift.price.toFixed(2)}
                            </Text>
                          </HStack>
                          
                          <HStack spacing={2} wrap="wrap">
                            <Badge colorScheme="blue" variant="subtle">
                              {gift.category}
                            </Badge>
                            <Badge 
                              colorScheme={getAvailabilityColor(gift.availability)}
                              variant="subtle"
                            >
                              {gift.availability}
                            </Badge>
                            {gift.confidence && (
                              <Badge 
                                colorScheme={getConfidenceColor(gift.confidence)}
                                variant="subtle"
                              >
                                {Math.round(gift.confidence * 100)}% match
                              </Badge>
                            )}
                          </HStack>
                        </VStack>

                        <Text fontSize="sm" color="gray.600">
                          {gift.description}
                        </Text>

                        <Box>
                          <HStack spacing={1} mb={2}>
                            <FiInfo size={14} />
                            <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                              Why this gift:
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.600" fontStyle="italic">
                            {gift.reasoning}
                          </Text>
                        </Box>

                        {gift.tags && gift.tags.length > 0 && (
                          <HStack spacing={1} wrap="wrap">
                            {gift.tags.map(tag => (
                              <Badge key={tag} size="sm" variant="outline" colorScheme="gray">
                                {tag}
                              </Badge>
                            ))}
                          </HStack>
                        )}

                        <Text fontSize="xs" color="gray.500">
                          Estimated delivery: {gift.estimatedDelivery}
                        </Text>
                      </VStack>

                      {/* Action Buttons */}
                      <VStack spacing={2} minW="120px" maxW="140px" align="stretch">
                        {/* Feedback Buttons */}
                        <HStack spacing={1} justify="center">
                          <Tooltip label="Great suggestion!">
                            <IconButton
                              aria-label="Thumbs up"
                              icon={<FiThumbsUp />}
                              size="sm"
                              variant={feedback[gift.id] === 'thumbs_up' ? 'solid' : 'outline'}
                              colorScheme={feedback[gift.id] === 'thumbs_up' ? 'green' : 'gray'}
                              onClick={() => handleFeedback(gift, 'thumbs_up')}
                            />
                          </Tooltip>
                          <Tooltip label="Not a good fit">
                            <IconButton
                              aria-label="Thumbs down"
                              icon={<FiThumbsDown />}
                              size="sm"
                              variant={feedback[gift.id] === 'thumbs_down' ? 'solid' : 'outline'}
                              colorScheme={feedback[gift.id] === 'thumbs_down' ? 'red' : 'gray'}
                              onClick={() => handleFeedback(gift, 'thumbs_down')}
                            />
                          </Tooltip>
                        </HStack>
                        
                        <HStack spacing={2} mt={3}>
                          <Button
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            leftIcon={<FaCheck />}
                            onClick={() => handleSelectGift(gift)}
                            isDisabled={selectedGiftIds.includes(gift.id)}
                          >
                            {selectedGiftIds.includes(gift.id) ? 'Selected' : 'Select Gift'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FaHeart />}
                            onClick={() => handleSaveForLater(gift)}
                          >
                            Save for Later
                          </Button>
                        </HStack>
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </VStack>
        )}

        {/* Empty State */}
        {recommendations.length === 0 && !loading && !error && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500" mb={4}>
              Click "Generate Ideas" to get AI-powered gift recommendations
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => generateRecommendations()}
              size="lg"
            >
              Generate Gift Ideas
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default AIGiftRecommendations; 