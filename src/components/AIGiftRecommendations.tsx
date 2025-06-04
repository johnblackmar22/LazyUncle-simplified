import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Image,
  Badge,
  SimpleGrid,
  Stack,
  useToast,
  Skeleton,
  useColorModeValue,
  Card,
  CardBody,
  CardFooter,
  IconButton,
  Tooltip,
  VStack,
  HStack,
  Progress,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiHeart, FiShoppingCart, FiExternalLink, FiInfo, FiStar, FiCheck, FiX } from 'react-icons/fi';
import { getGiftRecommendationsFromAI, type EnhancedGiftSuggestion } from '../services/giftRecommendationEngine';
import type { Recipient, Occasion, Gift } from '../types';
import { useGiftSelectionSync } from '../hooks/useGiftSelectionSync';

interface AIGiftRecommendationsProps {
  recipient: Recipient;
  occasion: Occasion;
  pastGifts?: any[];
  onSelectGift?: (gift: EnhancedGiftSuggestion) => void;
  onSaveForLater?: (gift: EnhancedGiftSuggestion) => void;
}

export default function AIGiftRecommendations({ 
  recipient, 
  occasion, 
  pastGifts = [],
  onSelectGift,
  onSaveForLater 
}: AIGiftRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<EnhancedGiftSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Use the new sync hook for better persistence
  const {
    selectedGifts,
    selectedGiftsCount,
    totalBudgetUsed,
    selectGift: syncSelectGift,
    unselectGift: syncUnselectGift,
    isGiftSelected,
    syncState,
    isLoading: isSyncing
  } = useGiftSelectionSync({
    recipientId: recipient.id,
    occasionId: occasion.id,
    autoSync: true
  });
  
  // Debug logging
  useEffect(() => {
    console.log('🎁 === AI GIFT RECOMMENDATIONS DEBUG ===');
    console.log('🎁 Component props:', {
      recipientId: recipient.id,
      occasionId: occasion.id,
      recipientName: recipient.name,
      occasionName: occasion.name,
      occasionDate: occasion.date,
      occasionBudget: occasion.budget
    });
    console.log('🎁 Current selected gifts count:', selectedGiftsCount);
    console.log('🎁 Selected gifts:', selectedGifts.map(g => ({
      id: g.id,
      name: g.name,
      source: g.source,
      isSelected: g.isSelected
    })));
    console.log('🎁 Sync state:', syncState);
    console.log('🎁 Is syncing/loading:', isSyncing);
  }, [recipient.id, occasion.id, selectedGiftsCount, selectedGifts, syncState, isSyncing]);
  
  useEffect(() => {
    // Generate recommendations when component mounts or key props change
    generateRecommendations();
  }, [recipient.id, occasion.id]);

  const generateRecommendations = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🤖 Generating AI recommendations...');
      
      const suggestions = await getGiftRecommendationsFromAI({
        recipient,
        budget: occasion.budget || 100,
        occasion: occasion.name.toLowerCase(),
        pastGifts,
        preferences: {
          giftWrap: true,
          personalNote: true,
          deliverySpeed: 'standard'
        }
      });

      console.log('✅ Received recommendations:', suggestions.length);
      setRecommendations(suggestions);
      setIsAIGenerated(suggestions.length > 0 && suggestions[0].reasoning !== undefined);
      setRetryCount(0);

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    generateRecommendations();
  };

  const handleSelectGift = async (gift: EnhancedGiftSuggestion) => {
    console.log('🎁 === GIFT SELECTION START ===');
    console.log('🎁 Selecting gift:', {
      giftName: gift.name,
      recipientId: recipient.id,
      occasionId: occasion.id,
      price: gift.price
    });
    
    try {
      await syncSelectGift(gift);
      
      onSelectGift?.(gift);
      toast({
        title: "Gift Selected",
        description: `${gift.name} added to ${recipient.name}'s ${occasion.name} plan`,
        status: "success",
        duration: 3000,
      });
      
      console.log('🎁 === GIFT SELECTION SUCCESS ===');
    } catch (error) {
      console.error('🎁 ❌ Error selecting gift:', error);
      toast({
        title: "Error",
        description: "Failed to save gift selection. Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleUnselectGift = async (giftName: string) => {
    console.log('🎁 Unselecting gift:', giftName);
    
    try {
      await syncUnselectGift(giftName);
      
      toast({
        title: "Gift Removed",
        description: "Gift removed from selection",
        status: "info",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Error removing gift:', error);
      toast({
        title: "Error",
        description: "Failed to remove gift. Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveForLater = async (gift: EnhancedGiftSuggestion) => {
    try {
      // TODO: Implement save for later with sync
      onSaveForLater?.(gift);
      toast({
        title: "Gift Saved",
        description: `${gift.name} saved for later consideration`,
        status: "info",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving gift for later:', error);
      toast({
        title: "Error",
        description: "Failed to save gift. Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };

  // Combine loading states for recommendations and sync
  const isFullyLoading = isLoading || isSyncing;

  // Show loading skeleton while generating recommendations or syncing
  if (isFullyLoading && recommendations.length === 0) {
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Skeleton height="24px" width="300px" />
            <Skeleton height="16px" width="400px" />
          </VStack>
          <Skeleton height="32px" width="80px" />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height="400px" borderRadius="md" />
          ))}
        </SimpleGrid>
        <Box mt={4} textAlign="center">
          <Text color="blue.500" fontWeight="medium">
            {isLoading && 'Loading recommendations...'}
            {isSyncing && 'Syncing your selections...'}
          </Text>
        </Box>
      </Box>
    );
  }

  // Show error state for recommendations or sync
  if ((error && recommendations.length === 0) || syncState.conflicts.some(c => !c.resolved)) {
    return (
      <Box>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Unable to load recommendations or sync selections</AlertTitle>
            <AlertDescription>
              {error ? error + '. ' : ''}
              {syncState.conflicts.some(c => !c.resolved) && 'There was a problem syncing your gift selections. Please try again.'}
            </AlertDescription>
          </Box>
        </Alert>
        <Button mt={4} onClick={handleRetry} colorScheme="blue">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {selectedGiftsCount > 0 && (
        <Alert status="success" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Selected Gifts for {recipient.name}'s {occasion.name}</AlertTitle>
            <AlertDescription fontSize="sm">
              {selectedGiftsCount} gift{selectedGiftsCount > 1 ? 's' : ''} selected • 
              Total: ${(totalBudgetUsed / 100).toFixed(2)}
              {isSyncing && (
                <Text as="span" ml={2} color="blue.500">
                  • Syncing...
                </Text>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="md">
            {isAIGenerated ? "🤖 AI Gift Recommendations" : "📋 Curated Gift Recommendations"}
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            {isAIGenerated 
              ? `AI-personalized suggestions for ${recipient.name} • $${occasion.budget || 100} budget`
              : `Quality suggestions for ${recipient.name} • $${occasion.budget || 100} budget`
            }
          </Text>
          {!isAIGenerated && (
            <Text color="orange.500" fontSize="xs" fontWeight="medium">
              💡 AI recommendations temporarily unavailable - showing curated alternatives
            </Text>
          )}
        </VStack>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRetry}
          isLoading={isLoading}
          loadingText="Refreshing"
        >
          Refresh
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {recommendations.map((gift, index) => {
          const isSelected = isGiftSelected(gift.name);
          
          return (
            <Card 
              key={gift.id} 
              bg={cardBg} 
              borderColor={isSelected ? 'green.500' : borderColor}
              borderWidth={isSelected ? "2px" : "1px"}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              position="relative"
              opacity={isSyncing ? 0.7 : 1}
            >
              {isSelected && (
                <Badge
                  position="absolute"
                  top={-2}
                  right={-2}
                  colorScheme="green"
                  borderRadius="full"
                  p={2}
                  zIndex={2}
                >
                  <FiCheck />
                </Badge>
              )}
              
              <CardBody>
                <Box position="relative" mb={4}>
                  <Image
                    src={gift.imageUrl}
                    alt={gift.name}
                    borderRadius="md"
                    height="200px"
                    width="100%"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/300x200?text=Gift+Image"
                  />
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme={isAIGenerated ? "blue" : "gray"}
                    fontSize="xs"
                  >
                    {isAIGenerated ? `AI Pick #${index + 1}` : `Curated #${index + 1}`}
                  </Badge>
                  {gift.confidence && (
                    <Flex
                      position="absolute"
                      bottom={2}
                      left={2}
                      align="center"
                      bg="blackAlpha.700"
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                    >
                      <FiStar />
                      <Text ml={1}>{Math.round(gift.confidence * 100)}% match</Text>
                    </Flex>
                  )}
                </Box>
                
                <Stack spacing={3}>
                  <Heading size="sm" noOfLines={2}>
                    {gift.name}
                  </Heading>
                  
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    ${gift.price?.toFixed(2)}
                  </Text>
                  
                  <Text fontSize="sm" color={mutedColor} noOfLines={3}>
                    {gift.description}
                  </Text>
                  
                  {gift.reasoning && (
                    <Text fontSize="xs" color="blue.500" fontStyle="italic" noOfLines={2}>
                      💭 {gift.reasoning}
                    </Text>
                  )}
                  
                  <Flex wrap="wrap" gap={1}>
                    {gift.tags?.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} size="sm" variant="subtle" colorScheme="gray">
                        {tag}
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
              </CardBody>
              
              <Divider />
              
              <CardFooter>
                <HStack spacing={2} width="100%">
                  {isSelected ? (
                    <Button
                      colorScheme="green"
                      size="sm"
                      flex={1}
                      onClick={() => handleUnselectGift(gift.name)}
                      leftIcon={<FiCheck />}
                      variant="solid"
                      isLoading={isSyncing}
                      loadingText="Syncing"
                      disabled={isSyncing}
                    >
                      Selected
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      size="sm"
                      flex={1}
                      onClick={() => handleSelectGift(gift)}
                      leftIcon={<FiShoppingCart />}
                      isLoading={isSyncing}
                      loadingText="Selecting"
                      disabled={isSyncing}
                    >
                      Select Gift
                    </Button>
                  )}
                  
                  <Tooltip label="Save for later">
                    <IconButton
                      aria-label="Save for later"
                      icon={<FiHeart />}
                      size="sm"
                      variant="outline"
                      colorScheme="gray"
                      onClick={() => handleSaveForLater(gift)}
                      disabled={isSyncing}
                    />
                  </Tooltip>
                  
                  {(gift.affiliateLink || gift.purchaseUrl) && (
                    <Tooltip label="View product">
                      <IconButton
                        aria-label="View product"
                        icon={<FiExternalLink />}
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(gift.affiliateLink || gift.purchaseUrl, '_blank')}
                        disabled={isSyncing}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </CardFooter>
            </Card>
          );
        })}
      </SimpleGrid>
      
      <Box mt={6} p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
        <HStack spacing={2} mb={2}>
          <FiInfo />
          <Text fontWeight="bold" fontSize="sm">
            {isAIGenerated ? "AI-Powered Personalization" : "Curated Recommendations"}
          </Text>
        </HStack>
        <Text fontSize="xs" color={mutedColor}>
          {isAIGenerated 
            ? `These recommendations are generated using advanced AI that considers ${recipient.name}'s interests, your relationship, past gifts, and current trends. Each suggestion includes a confidence score and reasoning to help you make the best choice.`
            : `While AI recommendations are temporarily unavailable, these curated suggestions are hand-picked based on ${recipient.name}'s interests and your budget. Your selections are automatically saved and synced across sessions.`
          }
        </Text>
        {syncState.lastSyncAt && (
          <Text fontSize="xs" color={mutedColor} mt={2}>
            Last synced: {new Date(syncState.lastSyncAt).toLocaleTimeString()}
          </Text>
        )}
      </Box>
    </Box>
  );
} 