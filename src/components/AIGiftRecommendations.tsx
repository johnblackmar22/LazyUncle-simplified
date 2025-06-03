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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  useEffect(() => {
    generateRecommendations();
  }, [recipient, occasion]);
  
  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating AI recommendations for:', recipient.name);
      
      const suggestions = await getGiftRecommendationsFromAI({
        recipient,
        budget: occasion.budget || 100,
        occasion: occasion.name.toLowerCase(),
        pastGifts,
        preferences: {
          giftWrap: true,
          personalNote: true,
          deliverySpeed: 'standard' as const,
        }
      });
      
      setRecommendations(suggestions);
      
      if (suggestions.length > 0) {
        toast({
          title: "AI Recommendations Ready",
          description: `Found ${suggestions.length} personalized gift suggestions for ${recipient.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      
      toast({
        title: "Recommendation Error",
        description: "Unable to generate AI recommendations. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
  
  if (loading) {
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
            🤖 AI Gift Recommendations
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            Personalized suggestions for {recipient.name} • ${occasion.budget || 100} budget
          </Text>
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