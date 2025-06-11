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
  FaUndo,
  FaEdit,
  FaLightbulb
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
      <CardHeader p={{ base: 4, md: 4 }}>
        {/* Mobile-First Header: Stack everything vertically */}
        <VStack spacing={{ base: 3, md: 2 }} align="stretch">
          
          {/* Title Row */}
          <HStack spacing={2}>
            <Icon as={FaGift} color="purple.500" flexShrink={0} />
            <Text fontWeight="bold" fontSize={{ base: "lg", md: "xl" }} flex={1}>
              {occasion.name}
            </Text>
          </HStack>
          
          {/* Status and Actions Row */}
          <Flex 
            direction={{ base: 'column', sm: 'row' }} 
            gap={{ base: 3, md: 2 }} 
            align={{ base: 'stretch', sm: 'center' }}
            justify={{ base: 'stretch', sm: 'space-between' }}
          >
            {/* Status Badge */}
            <Box>
              {getStatusBadge()}
            </Box>
            
            {/* Action Buttons */}
            <HStack spacing={2} justify={{ base: 'stretch', sm: 'flex-end' }}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="teal"
                leftIcon={<EditIcon />}
                onClick={() => onEdit(occasion)}
                flex={{ base: 1, sm: 'none' }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                leftIcon={<DeleteIcon />}
                isLoading={isDeleting}
                onClick={() => onDelete(occasion.id)}
                flex={{ base: 1, sm: 'none' }}
              >
                Delete
              </Button>
            </HStack>
          </Flex>
          
          {/* Occasion Features */}
          {(occasion.recurring || occasion.giftWrap || occasion.personalizedNote) && (
            <HStack spacing={3} wrap="wrap">
              {occasion.recurring && (
                <HStack spacing={1}>
                  <Icon as={FaRedo} color="gray.500" boxSize="3" />
                  <Text fontSize="xs" color="gray.600">Recurring</Text>
                </HStack>
              )}
              {occasion.giftWrap && (
                <HStack spacing={1}>
                  <Icon as={FaGift} color="gray.500" boxSize="3" />
                  <Text fontSize="xs" color="gray.600">Gift Wrap</Text>
                </HStack>
              )}
              {occasion.personalizedNote && (
                <HStack spacing={1}>
                  <Icon as={FaEdit} color="gray.500" boxSize="3" />
                  <Text fontSize="xs" color="gray.600">Personal Note</Text>
                </HStack>
              )}
            </HStack>
          )}
        </VStack>
      </CardHeader>

      <CardBody p={{ base: 4, md: 4 }} pt={0}>
        <VStack align="stretch" spacing={{ base: 4, md: 3 }}>
          
          {/* Occasion Details */}
          <VStack align="stretch" spacing={{ base: 3, md: 2 }}>
            <HStack spacing={2}>
              <Icon as={FaCalendarAlt} color="blue.500" flexShrink={0} />
              <Text fontSize="sm" flex={1}>
                <strong>Occasion Date:</strong> {formatDate(occasion.date)}
              </Text>
            </HStack>
            
            {occasion.deliveryDate && (
              <HStack spacing={2}>
                <Icon as={FaTruck} color="green.500" flexShrink={0} />
                <Text fontSize="sm" flex={1}>
                  <strong>Delivery Date:</strong> {formatDate(occasion.deliveryDate)}
                </Text>
              </HStack>
            )}

            <HStack spacing={2}>
              <Icon as={FaDollarSign} color="green.500" flexShrink={0} />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="sm">
                  <strong>Budget:</strong> ${occasion.budget}
                </Text>
                {occasion.giftWrap && (
                  <Text fontSize="xs" color="gray.500">
                    (includes $4.99 gift wrap + AI-optimized shipping)
                  </Text>
                )}
              </VStack>
            </HStack>

            {occasion.notes && (
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="bold">Notes:</Text>
                <Text fontSize="sm" color="gray.600" pl={4}>
                  {occasion.notes}
                </Text>
              </VStack>
            )}
          </VStack>

          {/* Delivery Date Warning */}
          {occasion.deliveryDate && (() => {
            const today = new Date();
            const deliveryDate = new Date(occasion.deliveryDate);
            const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDelivery <= 10 && daysUntilDelivery >= 0) {
              return (
                <Alert status="warning" size="sm" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="xs">
                    <strong>Delivery Warning:</strong> Only {daysUntilDelivery} day{daysUntilDelivery !== 1 ? 's' : ''} until delivery date. 
                    We may not be able to deliver on time.
                  </AlertDescription>
                </Alert>
              );
            } else if (daysUntilDelivery < 0) {
              return (
                <Alert status="error" size="sm" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="xs">
                    <strong>Delivery Overdue:</strong> The delivery date has passed. Please update or reschedule.
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}

          {/* Show existing selected gifts */}
          {selectedGiftsForOccasion.length > 0 && (
            <Box>
              <Divider mb={{ base: 4, md: 3 }} />
              
              <VStack spacing={3} align="stretch">
                {selectedGiftsForOccasion.map((gift) => (
                  <Box
                    key={gift.id}
                    p={4}
                    bg={useColorModeValue('green.50', 'green.900')}
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={useColorModeValue('green.200', 'green.600')}
                  >
                    {/* Mobile-First Layout: Stack everything vertically */}
                    <VStack spacing={3} align="stretch">
                      
                      {/* Header with icon and title */}
                      <HStack spacing={2}>
                        <Icon as={FaCheckCircle} color="green.500" flexShrink={0} />
                        <Text fontWeight="semibold" fontSize="sm" flex={1}>
                          {gift.name}
                        </Text>
                      </HStack>
                      
                      {/* Description */}
                      {gift.description && (
                        <Text fontSize="xs" color="gray.600" pl={6}>
                          {gift.description}
                        </Text>
                      )}
                      
                      {/* Price badge */}
                      <HStack spacing={2} pl={6}>
                        <Badge colorScheme="green" size="sm">
                          ${gift.price.toFixed(2)}
                        </Badge>
                      </HStack>
                      
                      {/* Action buttons - full width on mobile */}
                      <HStack spacing={2} w="100%">
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaUndo />}
                          onClick={() => handleUndoSelection(gift)}
                          flex={1}
                        >
                          Undo Selection
                        </Button>
                        {gift.purchaseUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FaExternalLinkAlt />}
                            onClick={() => window.open(gift.purchaseUrl, '_blank')}
                            flex={1}
                          >
                            View Product
                          </Button>
                        )}
                      </HStack>
                      
                      {/* Notes at bottom */}
                      {gift.notes && (
                        <Text fontSize="xs" color="gray.500" fontStyle="italic" pl={6}>
                          <Icon as={FaLightbulb} color="gray.400" boxSize="3" mr={2} />
                          {gift.notes}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* AI Gift Suggestions Section - Only show if no gift is selected */}
          {selectedGiftsForOccasion.length === 0 && (
            <Collapse in={showSuggestions} animateOpacity>
              <Box>
                <Divider mb={{ base: 4, md: 3 }} />
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
                        p={4}
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
                        {/* Mobile-First Layout: Stack everything vertically */}
                        <VStack spacing={3} align="stretch">
                          
                          {/* Header with selection status and title */}
                          <HStack spacing={2}>
                            {isSelected && <Icon as={FaCheckCircle} color="green.500" flexShrink={0} />}
                            <Text fontWeight="semibold" fontSize="sm" flex={1}>
                              {gift.name}
                            </Text>
                          </HStack>
                          
                          {/* Description */}
                          <Text fontSize="xs" color="gray.600" pl={isSelected ? 6 : 0}>
                            {gift.description}
                          </Text>
                          
                          {/* Price badges */}
                          <HStack spacing={2} wrap="wrap" pl={isSelected ? 6 : 0}>
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
                          
                          {/* Action button - full width */}
                          <Box w="100%">
                            {isSelected ? (
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                leftIcon={<FaUndo />}
                                onClick={() => selectedGift && handleUndoSelection(selectedGift)}
                                isLoading={giftLoading}
                                w="100%"
                              >
                                Undo Selection
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                colorScheme="purple"
                                leftIcon={<FaHeart />}
                                onClick={() => handleSelectGift(gift)}
                                isLoading={giftLoading}
                                w="100%"
                              >
                                Select This Gift
                              </Button>
                            )}
                          </Box>
                          
                          {/* Reasoning at bottom */}
                          {gift.reasoning && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic" pl={isSelected ? 6 : 0}>
                              <Icon as={FaLightbulb} color="gray.400" boxSize="3" mr={2} />
                              {gift.reasoning}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            </Collapse>
          )}
        </VStack>
      </CardBody>

      <CardFooter p={{ base: 4, md: 4 }} pt={0}>
        {/* Only show generate button if no gift is selected */}
        {selectedGiftsForOccasion.length === 0 && (
          <VStack w="full" spacing={{ base: 3, md: 2 }}>
            <Button
              size="md"
              colorScheme="purple"
              variant="outline"
              leftIcon={<FaMagic />}
              onClick={handleGenerateSuggestions}
              isLoading={generating}
              loadingText="Generating..."
              w="full"
              h="50px"
            >
              {suggestions.length > 0 ? 'Generate New Suggestions' : 'Generate Gift Suggestions'}
            </Button>
            
            {showSuggestions && suggestions.length > 0 && (
              <Button
                size="sm"
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