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
  FaExternalLinkAlt,
  FaCheckCircle,
  FaUndo
} from 'react-icons/fa';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import type { Occasion, Recipient, GiftSuggestion, Gift } from '../types';
import { format } from 'date-fns';
import { giftRecommendationEngine, type GiftRecommendation } from '../services/giftRecommendationEngine';
import { useGiftStore } from '../store/giftStore';
import { useGiftStorage } from '../hooks/useGiftStorage';

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

  // Gift store for persistence
  const { 
    createGift, 
    updateGift, 
    fetchGiftsByRecipient, 
    recipientGifts,
    loading: giftLoading 
  } = useGiftStore();

  // Use removeGift from useGiftStorage for admin order deletion
  const { selectGift, removeGift } = useGiftStorage();

  // Get existing selected gifts for this occasion
  const existingGifts = recipientGifts[recipient.id] || [];
  const selectedGiftsForOccasion = existingGifts.filter(gift => 
    gift.occasionId === occasion.id && gift.status === 'selected'
  );

  // Load existing gifts when component mounts
  useEffect(() => {
    if (recipient.id) {
      fetchGiftsByRecipient(recipient.id);
    }
  }, [recipient.id, fetchGiftsByRecipient]);

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
      // Build robust instructions for the AI
      let instructions = '';
      if (recipient.description) {
        instructions += `Recipient info: ${recipient.description}\n`;
      }
      if (occasion.notes) {
        instructions += `Occasion notes: ${occasion.notes}\n`;
      }
      // Special handling for infants
      const age = recipient.birthdate ? giftRecommendationEngine.calculateAge(recipient.birthdate) : undefined;
      if (age !== undefined && age < 2) {
        instructions += 'The recipient is an infant. Only suggest gifts that are safe for babies, age-appropriate, and useful for their development or for their parents. Avoid items with small parts, sharp edges, or choking hazards. Suggest gifts that are available on Amazon and easy to fulfill online.';
      } else {
        instructions += 'Suggest gifts that are available on Amazon and easy to fulfill online.';
      }

      const response = await giftRecommendationEngine.getRecommendations({
        recipient,
        occasion,
        budget: {
          min: Math.max(10, budget * 0.8), // 80% of budget as minimum
          max: budget
        },
        instructions
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

  const handleSelectGift = async (gift: GiftRecommendation) => {
    try {
      if (selectedGiftsForOccasion.length > 0) {
        toast({
          title: 'One Gift Per Occasion',
          description: 'Please undo the current selection before choosing a new gift',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      await selectGift(gift, recipient.id, occasion.id);
      setShowSuggestions(false);
      toast({
        title: 'Gift Selected!',
        description: `"${gift.name}" has been saved and sent to admin for processing`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ Error saving selected gift:', error);
      toast({
        title: 'Error Saving Gift',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUndoSelection = async (gift: Gift) => {
    try {
      // Remove from localStorage/admin order
      await removeGift(gift.id, 'selected');
      // Remove from Firestore/Zustand
      await useGiftStore.getState().removeGift(gift.id);
      // Show suggestions again after undo (if they were previously generated)
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      }
      toast({
        title: 'Selection Removed',
        description: `"${gift.name}" has been removed. You can now select a different gift.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ Error removing gift selection:', error);
      toast({
        title: 'Error Removing Selection',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Check if a recommendation is already selected
  const isGiftSelected = (recommendation: GiftRecommendation): Gift | null => {
    return selectedGiftsForOccasion.find(gift => 
      gift.name === recommendation.name && 
      Math.abs(gift.price - recommendation.price) < 0.01 // Account for floating point precision
    ) || null;
  };

  const getStatusBadge = () => {
    if (generating) {
      return <Badge colorScheme="blue" variant="subtle"><Spinner size="xs" mr={1} />Generating...</Badge>;
    }
    if (selectedGiftsForOccasion.length > 0) {
      return <Badge colorScheme="green" variant="solid">Gift Selected</Badge>;
    }
    if (suggestions.length > 0) {
      return <Badge colorScheme="purple" variant="subtle">{suggestions.length} suggestions ready</Badge>;
    }
    return <Badge colorScheme="gray" variant="outline">No gift selected</Badge>;
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
              {occasion.giftWrap && (
                <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                  (includes $4.99 gift wrap + AI-optimized shipping)
                </Text>
              )}
            </Text>
          </HStack>

          {occasion.notes && (
            <Text fontSize="sm" color="gray.600">
              <strong>Notes:</strong> {occasion.notes}
            </Text>
          )}
        </VStack>

        {/* Show existing selected gifts */}
        {selectedGiftsForOccasion.length > 0 && (
          <Box mt={4}>
            <Divider mb={3} />
            
            <VStack spacing={3} align="stretch">
              {selectedGiftsForOccasion.map((gift) => (
                <Box
                  key={gift.id}
                  p={3}
                  bg={useColorModeValue('green.50', 'green.900')}
                  borderRadius="md"
                  borderWidth="2px"
                  borderColor={useColorModeValue('green.200', 'green.600')}
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Icon as={FaCheckCircle} color="green.500" />
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                          {gift.name}
                        </Text>
                      </HStack>
                      {gift.description && (
                        <Text fontSize="xs" color="gray.600" noOfLines={2}>
                          {gift.description}
                        </Text>
                      )}
                      <HStack spacing={2}>
                        <Badge colorScheme="green" size="sm">
                          ${gift.price.toFixed(2)}
                        </Badge>
                      </HStack>
                    </VStack>
                    <VStack spacing={1}>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FaUndo />}
                        onClick={() => handleUndoSelection(gift)}
                      >
                        Undo
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
                  {gift.notes && (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                      💡 {gift.notes}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* AI Gift Suggestions Section - Only show if no gift is selected */}
        {selectedGiftsForOccasion.length === 0 && (
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
                {suggestions.map((gift, index) => {
                  const selectedGift = isGiftSelected(gift);
                  const isSelected = !!selectedGift;
                  
                  return (
                    <Box
                      key={gift.id || index}
                      p={3}
                      bg={isSelected 
                        ? useColorModeValue('green.50', 'green.900') 
                        : useColorModeValue('gray.50', 'gray.700')
                      }
                      borderRadius="md"
                      borderWidth={isSelected ? "2px" : "1px"}
                      borderColor={isSelected 
                        ? useColorModeValue('green.200', 'green.600')
                        : useColorModeValue('gray.200', 'gray.600')
                      }
                    >
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        justify="space-between"
                        align={{ base: 'stretch', md: 'start' }}
                        mb={2}
                        gap={4}
                      >
                        <VStack align="start" spacing={1} flex={1} minW={0}>
                          <HStack>
                            {isSelected && <Icon as={FaCheckCircle} color="green.500" />}
                            <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                              {gift.name}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.600" noOfLines={2}>
                            {gift.description}
                          </Text>
                          <HStack spacing={2}>
                            <Badge colorScheme="green" size="sm">
                              Gift: ${gift.price.toFixed(2)}
                            </Badge>
                            {gift.costBreakdown && (
                              <>
                                {gift.costBreakdown.estimatedShipping > 0 ? (
                                  <Badge colorScheme="orange" size="sm" variant="outline">
                                    Shipping: ${gift.costBreakdown.estimatedShipping.toFixed(2)}
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="blue" size="sm">
                                    Free Shipping
                                  </Badge>
                                )}
                                {gift.costBreakdown.giftWrapping > 0 && (
                                  <Badge colorScheme="purple" size="sm" variant="outline">
                                    Gift Wrap: ${gift.costBreakdown.giftWrapping.toFixed(2)}
                                  </Badge>
                                )}
                              </>
                            )}
                          </HStack>
                        </VStack>
                        <VStack spacing={1} minW="120px" maxW="140px" align="stretch">
                          {isSelected ? (
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              leftIcon={<FaUndo />}
                              onClick={() => selectedGift && handleUndoSelection(selectedGift)}
                              isLoading={giftLoading}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              colorScheme="purple"
                              leftIcon={<FaHeart />}
                              onClick={() => handleSelectGift(gift)}
                              isLoading={giftLoading}
                            >
                              Select
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
                  );
                })}
              </VStack>
            </Box>
          </Collapse>
        )}
      </CardBody>

      <CardFooter pt={2}>
        {/* Only show generate button if no gift is selected */}
        {selectedGiftsForOccasion.length === 0 && (
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
            
            {showSuggestions && suggestions.length > 0 && (
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
        )}
      </CardFooter>
    </Card>
  );
};

export default OccasionCard; 