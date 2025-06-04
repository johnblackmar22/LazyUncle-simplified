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
import { useGiftStorage } from '../hooks/useGiftStorage';
import { useGiftStore } from '../store/giftStore';

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
  
  // Use both storage systems for transition period
  const giftStorage = useGiftStorage(); // For recommendation caching
  const { 
    createGift, 
    fetchGiftsByRecipient, 
    recipientGifts, 
    loading: giftStoreLoading 
  } = useGiftStore(); // For persistent gift storage
  
  // Get gifts for this recipient and occasion from the main store
  const allRecipientGifts = recipientGifts[recipient.id] || [];
  const selectedGiftsForOccasion = allRecipientGifts.filter(
    gift => gift.occasionId === occasion.id && gift.isAIGenerated && gift.status === 'idea'
  );
  
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
    console.log('🎁 Current recipient gifts count:', allRecipientGifts.length);
    console.log('🎁 All recipient gifts:', allRecipientGifts.map(g => ({
      id: g.id,
      name: g.name,
      status: g.status,
      occasionId: g.occasionId,
      isAIGenerated: g.isAIGenerated
    })));
    console.log('🎁 Selected gifts for this occasion:', selectedGiftsForOccasion.map(g => ({
      id: g.id,
      name: g.name,
      status: g.status,
      isAIGenerated: g.isAIGenerated
    })));
    console.log('🎁 Gift store loading state:', giftStoreLoading);
  }, [recipient.id, occasion.id, selectedGiftsForOccasion.length, allRecipientGifts.length, giftStoreLoading]);
  
  // Fetch recipient gifts when component mounts
  useEffect(() => {
    fetchGiftsByRecipient(recipient.id);
  }, [recipient.id, fetchGiftsByRecipient]);
  
  useEffect(() => {
    // Check for cached recommendations first
    const cachedRecs = giftStorage.getRecommendations(recipient.id, occasion.id);
    if (cachedRecs.length > 0) {
      setRecommendations(cachedRecs);
      setIsAIGenerated(cachedRecs[0]?.metadata?.model === 'gpt-4o-mini');
      console.log('Loaded cached recommendations:', cachedRecs.length);
    } else {
      console.log('No cached recommendations, generating new ones');
      generateRecommendations();
    }
  }, [recipient.id, occasion.id]); // Fixed dependencies
  
  const generateRecommendations = async (retryAttempt = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Generating recommendations (attempt ${retryAttempt + 1})`);
      
      // Cache busting with timestamp
      const timestamp = Date.now();
      const response = await fetch('/.netlify/functions/gift-recommendations-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-ID': `req-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          recipient: {
            name: recipient.name,
            interests: recipient.interests || [],
            relationship: recipient.relationship || 'friend',
            description: recipient.description || undefined,
          },
          budget: occasion.budget || 50,
          occasion: occasion.name.toLowerCase(),
          pastGifts: [],
          timestamp: timestamp // Additional cache buster
        }),
      });

      if (!response.ok) {
        // Retry logic for 5xx errors
        if (response.status >= 500 && retryAttempt < 2) {
          console.log(`Server error ${response.status}, retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return generateRecommendations(retryAttempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error('No recommendations received');
      }

      // Add metadata to suggestions for caching
      const enrichedSuggestions = data.suggestions.map((suggestion: any) => ({
        ...suggestion,
        metadata: data.metadata
      }));

      setRecommendations(enrichedSuggestions);
      setRetryCount(retryAttempt);
      
      // Check if AI generated (vs fallback)
      const isAI = data.metadata?.model === 'gpt-4o-mini';
      setIsAIGenerated(isAI);
      
      // Cache the recommendations
      giftStorage.saveRecommendations(enrichedSuggestions, recipient.id, occasion.id);
      
      console.log(`Success! AI Generated: ${isAI}, Model: ${data.metadata?.model}, Attempts: ${retryAttempt + 1}`);
      
    } catch (err: unknown) {
      console.error('Recommendation error:', err);
      
      // Retry logic for network errors
      if (retryAttempt < 2 && (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch')))) {
        console.log(`Network error, retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateRecommendations(retryAttempt + 1);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      setRetryCount(retryAttempt);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    generateRecommendations();
  };
  
  const handleSelectGift = async (gift: EnhancedGiftSuggestion) => {
    console.log('🎁 === GIFT SELECTION DEBUG START ===');
    console.log('🎁 Selecting gift:', {
      giftId: gift.id,
      giftName: gift.name,
      recipientId: recipient.id,
      occasionId: occasion.id,
      recipientName: recipient.name,
      occasionName: occasion.name,
      price: gift.price
    });
    
    try {
      // Create a proper Firebase Gift record
      const giftData = {
        recipientId: recipient.id,
        occasionId: occasion.id,
        name: gift.name,
        description: gift.description,
        price: Math.round((gift.price || 0) * 100), // Convert to cents
        category: gift.category || 'AI Recommended',
        date: new Date(occasion.date).getTime(),
        status: 'idea' as const,
        imageUrl: gift.imageUrl,
        affiliateLink: gift.purchaseUrl || gift.affiliateLink,
        notes: `AI-recommended gift. ${gift.reasoning || ''}`.trim(),
        isAIGenerated: true,
        aiMetadata: {
          model: (gift as any).metadata?.model || 'unknown',
          confidence: gift.confidence,
          reasoning: gift.reasoning,
          tags: gift.tags,
          generatedAt: Date.now(),
          requestData: {
            interests: recipient.interests,
            budget: occasion.budget,
            occasion: occasion.name.toLowerCase(),
            relationship: recipient.relationship
          }
        }
      };
      
      console.log('🎁 Gift data to be saved:', giftData);
      console.log('🎁 Calling createGift via giftStore...');
      
      const createdGift = await createGift(giftData);
      console.log('🎁 ✅ Gift created in Firebase successfully:', {
        id: createdGift.id,
        name: createdGift.name,
        status: createdGift.status,
        isAIGenerated: createdGift.isAIGenerated,
        recipientId: createdGift.recipientId,
        occasionId: createdGift.occasionId
      });
      
      // Also keep in localStorage cache for UI responsiveness
      const storedGift = giftStorage.selectGift(gift, recipient.id, occasion.id);
      console.log('🎁 ✅ Gift cached in localStorage:', storedGift);
      
      // Force refresh of recipient gifts to show the change immediately
      console.log('🎁 Fetching updated gifts for recipient...');
      await fetchGiftsByRecipient(recipient.id);
      console.log('🎁 ✅ Recipient gifts refreshed');
      
      onSelectGift?.(gift);
      toast({
        title: "Gift Selected",
        description: `${gift.name} added to ${recipient.name}'s ${occasion.name} plan`,
        status: "success",
        duration: 3000,
      });
      
      console.log('🎁 === GIFT SELECTION DEBUG END ===');
    } catch (error) {
      console.error('🎁 ❌ Error selecting gift:', error);
      console.log('🎁 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast({
        title: "Error",
        description: "Failed to save gift selection. Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };
  
  const handleUnselectGift = async (giftId: string) => {
    console.log('Unselecting gift:', giftId);
    
    try {
      // Find the gift in our local state
      const giftToRemove = selectedGiftsForOccasion.find(g => 
        g.id === giftId || 
        (g.aiMetadata?.requestData && g.name === recommendations.find(r => r.id === giftId)?.name)
      );
      
      if (giftToRemove) {
        // Remove from Firebase
        await useGiftStore.getState().removeGift(giftToRemove.id);
        console.log('Gift removed from Firebase:', giftToRemove.id);
      }
      
      // Also remove from localStorage cache
      giftStorage.removeGift(giftId, 'selected');
      
      toast({
        title: "Gift Removed",
        description: "Gift removed from selection",
        status: "info",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error removing gift:', error);
      toast({
        title: "Error",
        description: "Failed to remove gift. Please try again.",
        status: "error",
        duration: 4000,
      });
    }
  };
  
  const handleSaveForLater = async (gift: EnhancedGiftSuggestion) => {
    console.log('Saving gift for later:', {
      giftId: gift.id,
      giftName: gift.name,
      recipientId: recipient.id,
      occasionId: occasion.id
    });
    
    try {
      // Create a proper Firebase Gift record with 'planned' status
      const giftData = {
        recipientId: recipient.id,
        occasionId: occasion.id,
        name: gift.name,
        description: gift.description,
        price: Math.round((gift.price || 0) * 100), // Convert to cents
        category: gift.category || 'AI Recommended',
        date: new Date(occasion.date).getTime(),
        status: 'planned' as const, // Different status for saved gifts
        imageUrl: gift.imageUrl,
        affiliateLink: gift.purchaseUrl || gift.affiliateLink,
        notes: `Saved for later. AI-recommended gift. ${gift.reasoning || ''}`.trim(),
        isAIGenerated: true,
        aiMetadata: {
          model: (gift as any).metadata?.model || 'unknown',
          confidence: gift.confidence,
          reasoning: gift.reasoning,
          tags: gift.tags,
          generatedAt: Date.now(),
          requestData: {
            interests: recipient.interests,
            budget: occasion.budget,
            occasion: occasion.name.toLowerCase(),
            relationship: recipient.relationship
          }
        }
      };
      
      const createdGift = await createGift(giftData);
      console.log('Gift saved for later in Firebase:', createdGift);
      
      // Also keep in localStorage cache
      const storedGift = giftStorage.saveForLater(gift, recipient.id, occasion.id);
      console.log('Gift cached in localStorage:', storedGift);
    
      onSaveForLater?.(gift);
      toast({
        title: "Saved for Later",
        description: `${gift.name} saved to your gift list`,
        status: "info",
        duration: 2000,
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
  
  const isGiftSelected = (giftId: string) => {
    // Check both Firebase gifts and localStorage cache
    const inFirebase = selectedGiftsForOccasion.some(g => 
      g.aiMetadata?.requestData && 
      g.name === recommendations.find(r => r.id === giftId)?.name
    );
    const inLocalStorage = giftStorage.getSelectedGiftsForOccasion(recipient.id, occasion.id)
      .some(g => g.id === giftId);
    
    const isSelected = inFirebase || inLocalStorage;
    
    console.log('🎁 Gift selection check:', {
      giftId,
      giftName: recommendations.find(r => r.id === giftId)?.name,
      inFirebase,
      inLocalStorage,
      isSelected,
      firebaseGiftsCount: selectedGiftsForOccasion.length,
      localStorageGiftsCount: giftStorage.getSelectedGiftsForOccasion(recipient.id, occasion.id).length
    });
    
    return isSelected;
  };
  
  const isGiftSaved = (giftId: string) => {
    // Check if this gift exists in Firebase with 'planned' status
    const inFirebase = allRecipientGifts.some(g => 
      g.status === 'planned' &&
      g.isAIGenerated &&
      g.aiMetadata?.requestData && 
      g.name === recommendations.find(r => r.id === giftId)?.name
    );
    const inLocalStorage = giftStorage.getSavedGiftsForRecipient(recipient.id)
      .some(g => g.id === giftId);
    
    return inFirebase || inLocalStorage;
  };
  
  if (isLoading) {
    return (
      <Box>
        <Heading size="md" mb={4}>
          🤖 AI Gift Recommendations
        </Heading>
        <Text color={mutedColor} mb={6}>
          Our AI is analyzing {recipient.name}'s profile to find the perfect gifts...
        </Text>
        <Progress size="sm" isIndeterminate mb={4} colorScheme="blue" />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[...Array(5)].map((_, i) => (
            <Card key={i} bg={cardBg}>
              <CardBody>
                <Skeleton height="200px" mb={4} />
                <Skeleton height="20px" mb={2} />
                <Skeleton height="16px" mb={2} />
                <Skeleton height="16px" width="60%" />
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box textAlign="center" py={8}>
        <Heading size="md" mb={4} color="red.500">
          Unable to Generate Recommendations
        </Heading>
        <Text color={mutedColor} mb={4}>
          {error}
        </Text>
        <Button colorScheme="blue" onClick={handleRetry}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  if (recommendations.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Heading size="md" mb={4}>
          No Recommendations Found
        </Heading>
        <Text color={mutedColor} mb={4}>
          We couldn't find suitable gifts within your budget. Try increasing the budget or updating {recipient.name}'s interests.
        </Text>
        <Button colorScheme="blue" onClick={handleRetry}>
          Generate New Suggestions
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {selectedGiftsForOccasion.length > 0 && (
        <Alert status="success" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Selected Gifts for {recipient.name}'s {occasion.name}</AlertTitle>
            <AlertDescription fontSize="sm">
              {selectedGiftsForOccasion.length} gift{selectedGiftsForOccasion.length > 1 ? 's' : ''} selected • 
              Total: ${selectedGiftsForOccasion.reduce((sum, gift) => sum + gift.price, 0).toFixed(2)}
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
        <Button size="sm" variant="outline" onClick={handleRetry}>
          Refresh
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {recommendations.map((gift, index) => {
          const isSelected = isGiftSelected(gift.id);
          const isSaved = isGiftSaved(gift.id);
          
          return (
            <Card 
              key={gift.id} 
              bg={cardBg} 
              borderColor={isSelected ? 'green.500' : borderColor}
              borderWidth={isSelected ? "2px" : "1px"}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              position="relative"
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
                  {isSaved && (
                    <Badge
                      position="absolute"
                      top={2}
                      left={2}
                      colorScheme="purple"
                      fontSize="xs"
                    >
                      <FiHeart style={{ marginRight: '4px' }} />
                      Saved
                    </Badge>
                  )}
                </Box>
                
                <VStack align="start" spacing={3}>
                  <VStack align="start" spacing={1}>
                    <Heading size="sm" noOfLines={2}>
                      {gift.name}
                    </Heading>
                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                      ${gift.price.toFixed(2)}
                    </Text>
                  </VStack>
                  
                  <Text fontSize="sm" color={mutedColor} noOfLines={3}>
                    {gift.description}
                  </Text>
                  
                  {gift.reasoning && (
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="blue.500" mb={1}>
                        Why this gift?
                      </Text>
                      <Text fontSize="xs" color={mutedColor} fontStyle="italic">
                        {gift.reasoning}
                      </Text>
                    </Box>
                  )}
                  
                  {gift.tags && gift.tags.length > 0 && (
                    <Flex flexWrap="wrap" gap={1}>
                      {gift.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} size="sm" variant="subtle" colorScheme="gray">
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </VStack>
              </CardBody>
              
              <Divider />
              
              <CardFooter>
                <HStack spacing={2} width="100%">
                  {isSelected ? (
                    <Button
                      colorScheme="green"
                      size="sm"
                      flex={1}
                      onClick={() => handleUnselectGift(gift.id)}
                      leftIcon={<FiCheck />}
                      variant="solid"
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
                    >
                      Select Gift
                    </Button>
                  )}
                  
                  <Tooltip label={isSaved ? "Saved" : "Save for later"}>
                    <IconButton
                      aria-label="Save for later"
                      icon={<FiHeart />}
                      size="sm"
                      variant={isSaved ? "solid" : "outline"}
                      colorScheme={isSaved ? "purple" : "gray"}
                      onClick={() => handleSaveForLater(gift)}
                    />
                  </Tooltip>
                  
                  {gift.affiliateLink && (
                    <Tooltip label="View product">
                      <IconButton
                        aria-label="View product"
                        icon={<FiExternalLink />}
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(gift.affiliateLink, '_blank')}
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
            : `While AI recommendations are temporarily unavailable, these curated suggestions are hand-picked based on ${recipient.name}'s interests and your budget. Your selections are automatically saved.`
          }
        </Text>
      </Box>
    </Box>
  );
} 