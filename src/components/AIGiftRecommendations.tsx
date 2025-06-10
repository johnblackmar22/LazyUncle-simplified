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
import { FiRefreshCw, FiHeart, FiShoppingCart, FiInfo } from 'react-icons/fi';
import { giftRecommendationEngine, type GiftRecommendationRequest, type GiftRecommendation } from '../services/giftRecommendationEngine';
import { useGiftStorage } from '../hooks/useGiftStorage';
import { useAuthStore } from '../store/authStore';
import type { Recipient, Occasion } from '../types';

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
  
  const { selectGift, saveForLater, getRecommendations } = useGiftStorage();
  const { user } = useAuthStore();
  const toast = useToast();

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

  const handleSelectGift = (gift: GiftRecommendation) => {
    try {
      const selectedGift = selectGift(gift, recipient.id, occasion.id);
      
      toast({
        title: 'Gift Selected!',
        description: `"${gift.name}" has been added to your selections`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onGiftSelected?.(gift);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to select gift',
        status: 'error',
        duration: 3000,
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

      // Create admin order directly for testing wizard of oz workflow
      const adminOrder = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // Customer Info (who pays)
        customerId: user.id,
        customerName: user.displayName || user.email.split('@')[0],
        customerEmail: user.email,
        customerPlan: user.planId || 'free',
        // Recipient Info (who receives)
        recipientName: recipient.name,
        recipientAddress: formatAddress(recipient.deliveryAddress),
        // Order Details
        occasionName: occasion.name,
        occasionDate: occasion.date,
        giftName: gift.name,
        giftPrice: gift.price,
        giftUrl: gift.purchaseUrl,
        giftASIN: gift.asin, // Use ASIN from AI recommendation
        status: 'pending' as const,
        orderDate: Date.now(),
        amazonOrderId: undefined,
        trackingNumber: undefined,
        notes: `User selected: ${gift.reasoning}`,
        giftWrap: occasion.giftWrap || false,
        personalNote: occasion.noteText,
        // Billing
        billingStatus: 'pending' as const,
        chargeAmount: gift.price,
      };

      // Save to admin orders for wizard of oz processing
      const existingOrders = localStorage.getItem('admin_pending_orders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push(adminOrder);
      localStorage.setItem('admin_pending_orders', JSON.stringify(orders));

      console.log('📋 Created admin order from gift recommendation:', adminOrder.id);

      toast({
        title: 'Order Created! 🎁',
        description: `"${gift.name}" has been ordered for ${recipient.name}! Check the admin dashboard to process it.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onGiftSelected?.(gift);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        status: 'error',
        duration: 3000,
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
                            {gift.asin && (
                              <Badge colorScheme="orange" variant="subtle">
                                ASIN: {gift.asin}
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
                        <Button
                          colorScheme="green"
                          leftIcon={<FiShoppingCart />}
                          size="sm"
                          onClick={() => handleSelectGift(gift)}
                        >
                          Select Gift
                        </Button>
                        
                        <Button
                          colorScheme="orange"
                          size="sm"
                          onClick={() => handleOrderGift(gift)}
                        >
                          🧙‍♂️ Order Now
                        </Button>
                        
                        <Tooltip label="Save for later consideration">
                          <IconButton
                            aria-label="Save for later"
                            icon={<FiHeart />}
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveForLater(gift)}
                          />
                        </Tooltip>
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