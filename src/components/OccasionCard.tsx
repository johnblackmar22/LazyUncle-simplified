import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  IconButton,
  Collapse,
  Image,
  useColorModeValue,
  useToast,
  Spinner,
  Divider,
  Tooltip,
  Icon,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FaGift, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaChevronDown, 
  FaChevronUp, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaMagic,
  FaCheck,
  FaTimes,
  FaEye,
  FaRedo,
  FaTruck,
  FaShoppingCart,
  FaHeart,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import type { Occasion, Recipient, GiftSuggestion } from '../types';
import { format } from 'date-fns';
import { giftRecommendationEngine, type GiftRecommendation } from '../services/giftRecommendationEngine';

interface OccasionCardProps {
  occasion: Occasion;
  recipient: Recipient;
  onEdit: (occasion: Occasion) => void;
  onDelete: (occasionId: string) => void;
  isDeleting?: boolean;
}

const OccasionCard: React.FC<OccasionCardProps> = ({
  occasion,
  recipient,
  onEdit,
  onDelete,
  isDeleting = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const handleGenerateSuggestions = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      console.log('🎁 Generating gift suggestions for:', {
        recipient: recipient.name,
        occasion: occasion.name,
        budget: occasion.budget
      });

      const budget = occasion.budget || 50; // Default budget if not set
      const response = await giftRecommendationEngine.getRecommendations({
        recipient,
        occasion,
        budget: {
          min: Math.max(10, budget * 0.8), // 80% of budget as minimum
          max: budget
        }
      });

      console.log('🎉 Generated recommendations:', response.recommendations);
      setSuggestions(response.recommendations);
      setShowSuggestions(true);
      
      toast({
        title: 'Gift Suggestions Generated!',
        description: `Found ${response.recommendations.length} great gift ideas for ${recipient.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error generating gift suggestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions');
      
      toast({
        title: 'Unable to Generate Suggestions',
        description: 'Please try again in a moment',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectGift = (gift: GiftRecommendation) => {
    toast({
      title: 'Gift Selected!',
      description: `"${gift.name}" has been saved for ${recipient.name}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    // TODO: Save selected gift to the store/backend
  };

  const getStatusBadge = () => {
    if (generating) {
      return <Badge colorScheme="blue" variant="subtle"><Spinner size="xs" mr={1} />Generating...</Badge>;
    }
    if (suggestions.length > 0) {
      return <Badge colorScheme="green" variant="subtle">{suggestions.length} suggestions</Badge>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Card 
      shadow="md" 
      borderRadius="lg" 
      bg={bgColor}
      borderColor={borderColor}
      borderWidth="1px"
      _hover={{ bg: hoverBgColor, shadow: "lg" }}
      transition="all 0.2s"
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={2}>
            <Icon as={FaGift} color="purple.500" />
            <Text fontWeight="bold" fontSize="lg">{occasion.name}</Text>
          </Flex>
          <HStack>
            {getStatusBadge()}
            <IconButton
              aria-label="Edit occasion"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              colorScheme="teal"
              onClick={() => onEdit(occasion)}
            />
            <IconButton
              aria-label="Delete occasion"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              isLoading={isDeleting}
              onClick={() => onDelete(occasion.id)}
            />
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody py={2}>
        <VStack align="start" spacing={2}>
          <HStack>
            <Icon as={FaCalendarAlt} color="blue.500" />
            <Text fontSize="sm">
              <strong>Occasion Date:</strong> {formatDate(occasion.date)}
            </Text>
          </HStack>
          
          {occasion.deliveryDate && (
            <HStack>
              <Icon as={FaTruck} color="green.500" />
              <Text fontSize="sm">
                <strong>Delivery Date:</strong> {formatDate(occasion.deliveryDate)}
              </Text>
            </HStack>
          )}

          <HStack>
            <Icon as={FaDollarSign} color="green.500" />
            <Text fontSize="sm">
              <strong>Budget:</strong> ${occasion.budget}
            </Text>
          </HStack>

          {occasion.notes && (
            <Text fontSize="sm" color="gray.600">
              <strong>Notes:</strong> {occasion.notes}
            </Text>
          )}
        </VStack>

        {/* AI Gift Suggestions Section */}
        <Collapse in={showSuggestions} animateOpacity>
          <Box mt={4}>
            <Divider mb={3} />
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="bold" fontSize="md" color="purple.600">
                🤖 AI Gift Suggestions
              </Text>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<FaRedo />}
                onClick={handleGenerateSuggestions}
                isLoading={generating}
              >
                Regenerate
              </Button>
            </Flex>
            
            {error && (
              <Alert status="error" size="sm" mb={3}>
                <AlertIcon />
                <AlertDescription fontSize="sm">{error}</AlertDescription>
              </Alert>
            )}

            <VStack spacing={3} align="stretch">
              {suggestions.map((gift, index) => (
                <Box
                  key={gift.id || index}
                  p={3}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {gift.name}
                      </Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={2}>
                        {gift.description}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="green" size="sm">
                          ${gift.price}
                        </Badge>
                        <Badge colorScheme="blue" size="sm" variant="outline">
                          {gift.category}
                        </Badge>
                        <Badge colorScheme="orange" size="sm" variant="subtle">
                          {Math.round(gift.confidence * 100)}% match
                        </Badge>
                      </HStack>
                    </VStack>
                    <VStack spacing={1}>
                      <Button
                        size="xs"
                        colorScheme="purple"
                        leftIcon={<FaHeart />}
                        onClick={() => handleSelectGift(gift)}
                      >
                        Select
                      </Button>
                      {gift.purchaseUrl && (
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<FaExternalLinkAlt />}
                          onClick={() => window.open(gift.purchaseUrl, '_blank')}
                        >
                          View
                        </Button>
                      )}
                    </VStack>
                  </Flex>
                  {gift.reasoning && (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                      💡 {gift.reasoning}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        </Collapse>
      </CardBody>

      <CardFooter pt={2}>
        <VStack w="full" spacing={2}>
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            leftIcon={<FaMagic />}
            onClick={handleGenerateSuggestions}
            isLoading={generating}
            loadingText="Generating..."
            w="full"
          >
            {suggestions.length > 0 ? 'Generate New Suggestions' : 'Generate Gift Suggestions'}
          </Button>
          
          {showSuggestions && (
            <Button
              size="xs"
              variant="ghost"
              leftIcon={showSuggestions ? <FaChevronUp /> : <FaChevronDown />}
              onClick={() => setShowSuggestions(!showSuggestions)}
              w="full"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </Button>
          )}
        </VStack>
      </CardFooter>
    </Card>
  );
};

export default OccasionCard; 