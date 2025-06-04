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
} from '@chakra-ui/react';
import { FiHeart, FiShoppingCart, FiExternalLink, FiInfo, FiStar } from 'react-icons/fi';
import { getGiftRecommendationsFromAI, type EnhancedGiftSuggestion } from '../services/giftRecommendationEngine';
import type { Recipient, Occasion } from '../types';

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
  
  useEffect(() => {
    generateRecommendations();
  }, [recipient, occasion]);
  
  const generateRecommendations = async (retryAttempt = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Generating recommendations (attempt ${retryAttempt + 1})`);
      
      // Cache busting with timestamp
      const timestamp = Date.now();
      const response = await fetch('/.netlify/functions/gift-recommendations', {
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

      setRecommendations(data.suggestions);
      setRetryCount(retryAttempt);
      
      // Check if AI generated (vs fallback)
      const isAI = data.metadata?.model === 'gpt-4o-mini';
      setIsAIGenerated(isAI);
      
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
  
  const handleSelectGift = (gift: EnhancedGiftSuggestion) => {
    onSelectGift?.(gift);
    toast({
      title: "Gift Selected",
      description: `${gift.name} added to your occasion plan`,
      status: "success",
      duration: 2000,
    });
  };
  
  const handleSaveForLater = (gift: EnhancedGiftSuggestion) => {
    onSaveForLater?.(gift);
    toast({
      title: "Saved for Later",
      description: `${gift.name} saved to your wishlist`,
      status: "info",
      duration: 2000,
    });
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
        {recommendations.map((gift, index) => (
          <Card 
            key={gift.id} 
            bg={cardBg} 
            borderColor={borderColor}
            borderWidth="1px"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
          >
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
                  colorScheme="blue"
                  fontSize="xs"
                >
                  AI Pick #{index + 1}
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
                <Button
                  colorScheme="blue"
                  size="sm"
                  flex={1}
                  onClick={() => handleSelectGift(gift)}
                  leftIcon={<FiShoppingCart />}
                >
                  Select Gift
                </Button>
                
                <Tooltip label="Save for later">
                  <IconButton
                    aria-label="Save for later"
                    icon={<FiHeart />}
                    size="sm"
                    variant="outline"
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
        ))}
      </SimpleGrid>
      
      <Box mt={6} p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
        <HStack spacing={2} mb={2}>
          <FiInfo />
          <Text fontWeight="bold" fontSize="sm">
            AI-Powered Personalization
          </Text>
        </HStack>
        <Text fontSize="xs" color={mutedColor}>
          These recommendations are generated using advanced AI that considers {recipient.name}'s interests, 
          your relationship, past gifts, and current trends. Each suggestion includes a confidence score 
          and reasoning to help you make the best choice.
        </Text>
      </Box>
    </Box>
  );
} 