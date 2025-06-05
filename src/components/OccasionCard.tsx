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
  FaShoppingCart
} from 'react-icons/fa';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import type { Occasion, Recipient, GiftSuggestion } from '../types';
import type { GiftPreview } from '../services/giftSuggestionWorkflow';
import GiftSuggestionWorkflowService from '../services/giftSuggestionWorkflow';
import { format } from 'date-fns';

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
  const [giftPreview, setGiftPreview] = useState<GiftPreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggestionsStatus, setSuggestionsStatus] = useState<'none' | 'generating' | 'ready' | 'approved' | 'rejected'>('none');
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Check if we already have suggestions for this occasion
  useEffect(() => {
    const preview = GiftSuggestionWorkflowService.getPreview(occasion.id);
    if (preview) {
      setGiftPreview(preview);
      setSuggestionsStatus(preview.status === 'approved' ? 'approved' : 
                          preview.status === 'rejected' ? 'rejected' : 'ready');
    }
  }, [occasion.id]);

  const handleGenerateSuggestions = async () => {
    setGenerating(true);
    setSuggestionsStatus('generating');
    
    try {
      const preview = await GiftSuggestionWorkflowService.generateSuggestions(
        occasion,
        recipient
      );
      setGiftPreview(preview);
      setSuggestionsStatus('ready');
      setShowSuggestions(true);
      
      toast({
        title: 'Gift suggestions generated!',
        description: `Found ${preview.suggestions.length} great gift ideas for ${recipient.name}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestionsStatus('none');
      toast({
        title: 'Error generating suggestions',
        description: 'Please try again in a moment',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveSuggestion = async (suggestion: GiftSuggestion) => {
    try {
      await GiftSuggestionWorkflowService.approveSuggestion(occasion.id, suggestion);
      setSuggestionsStatus('approved');
      toast({
        title: 'Gift approved!',
        description: `${suggestion.name} will be sent for ${occasion.name}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error approving gift',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRejectSuggestions = async () => {
    try {
      await GiftSuggestionWorkflowService.rejectSuggestions(occasion.id);
      setSuggestionsStatus('rejected');
      toast({
        title: 'No problem!',
        description: 'We\'ll check back with fresh ideas closer to the occasion',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusBadge = () => {
    switch (suggestionsStatus) {
      case 'generating':
        return <Badge colorScheme="blue" variant="subtle"><Spinner size="xs" mr={1} />Generating...</Badge>;
      case 'ready':
        return <Badge colorScheme="orange" variant="subtle"><FaMagic style={{ marginRight: 4 }} />Ready to Review</Badge>;
      case 'approved':
        return <Badge colorScheme="green"><FaCheck style={{ marginRight: 4 }} />Gift Approved</Badge>;
      case 'rejected':
        return <Badge colorScheme="gray" variant="subtle"><FaTimes style={{ marginRight: 4 }} />Handle Later</Badge>;
      default:
        return null;
    }
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

          {/* Gift Suggestions Section */}
          {suggestionsStatus !== 'none' && (
            <Box w="full" mt={3}>
              <Divider mb={3} />
              
              {suggestionsStatus === 'generating' && (
                <VStack spacing={3}>
                  <Text fontSize="sm" color="blue.600">
                    <FaMagic style={{ display: 'inline', marginRight: 8 }} />
                    Generating personalized gift suggestions...
                  </Text>
                  <Progress size="sm" isIndeterminate colorScheme="blue" w="full" />
                </VStack>
              )}

              {suggestionsStatus === 'ready' && giftPreview && (
                <VStack align="start" spacing={3}>
                  <Flex justify="space-between" align="center" w="full">
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      🎁 Gift Suggestions Ready!
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      rightIcon={showSuggestions ? <FaChevronUp /> : <FaChevronDown />}
                      onClick={() => setShowSuggestions(!showSuggestions)}
                    >
                      {showSuggestions ? 'Hide' : 'View'} ({giftPreview.suggestions.length})
                    </Button>
                  </Flex>
                  
                  <Collapse in={showSuggestions} animateOpacity>
                    <VStack spacing={3} w="full">
                      {giftPreview.suggestions.slice(0, 3).map((suggestion, index) => (
                        <Box
                          key={index}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={borderColor}
                          w="full"
                          bg={useColorModeValue('gray.50', 'gray.700')}
                        >
                          <Flex justify="space-between" align="start" gap={3}>
                            <Box flex="1">
                              <Text fontWeight="bold" fontSize="sm">{suggestion.name}</Text>
                              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {suggestion.description}
                              </Text>
                              <HStack mt={1} spacing={2}>
                                <Badge colorScheme="green" size="sm">${suggestion.price}</Badge>
                                <Badge colorScheme="blue" size="sm" variant="outline">
                                  {Math.round((suggestion.confidence || 0.75) * 100)}% match
                                </Badge>
                              </HStack>
                            </Box>
                            <VStack spacing={1}>
                              <Tooltip label="Approve this gift">
                                <IconButton
                                  aria-label="Approve gift"
                                  icon={<FaThumbsUp />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="outline"
                                  onClick={() => handleApproveSuggestion(suggestion)}
                                />
                              </Tooltip>
                            </VStack>
                          </Flex>
                        </Box>
                      ))}
                      
                      <HStack w="full" justify="center" spacing={3} mt={2}>
                        <Button
                          size="sm"
                          colorScheme="gray"
                          variant="outline"
                          leftIcon={<FaThumbsDown />}
                          onClick={handleRejectSuggestions}
                        >
                          Handle Later
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          leftIcon={<FaRedo />}
                          onClick={handleGenerateSuggestions}
                        >
                          Regenerate
                        </Button>
                      </HStack>
                    </VStack>
                  </Collapse>
                </VStack>
              )}

              {suggestionsStatus === 'approved' && giftPreview?.approvalStatus?.selectedSuggestion && (
                <Alert status="success" borderRadius="md" size="sm">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontSize="sm">
                      <strong>{giftPreview.approvalStatus.selectedSuggestion.name}</strong> approved for {occasion.name}
                    </AlertDescription>
                    <HStack mt={2} spacing={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => {
                          setSuggestionsStatus('ready');
                          setShowSuggestions(true);
                        }}
                      >
                        Change Selection
                      </Button>
                    </HStack>
                  </Box>
                </Alert>
              )}

              {suggestionsStatus === 'rejected' && (
                <Alert status="info" borderRadius="md" size="sm">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontSize="sm">
                      No worries! We'll check back with fresh ideas closer to the occasion date.
                    </AlertDescription>
                    <HStack mt={2} spacing={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => {
                          setSuggestionsStatus('ready');
                          setShowSuggestions(true);
                        }}
                      >
                        Review Suggestions
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="purple"
                        leftIcon={<FaRedo />}
                        onClick={handleGenerateSuggestions}
                      >
                        New Ideas
                      </Button>
                    </HStack>
                  </Box>
                </Alert>
              )}
            </Box>
          )}
        </VStack>
      </CardBody>

      {suggestionsStatus === 'none' && (
        <CardFooter pt={2}>
          <VStack spacing={2} w="full">
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
              Generate Gift Suggestions
            </Button>
            <Button
              as={RouterLink}
              to={`/recipients/${recipient.id}/occasions/${occasion.id}/plan`}
              size="sm"
              colorScheme="blue"
              leftIcon={<FaShoppingCart />}
              w="full"
            >
              Plan Gifts
            </Button>
          </VStack>
        </CardFooter>
      )}

      {/* Add Plan Gifts button for other states too */}
      {suggestionsStatus !== 'none' && (
        <CardFooter pt={2}>
          <HStack spacing={2} w="full">
            <Button
              as={RouterLink}
              to={`/recipients/${recipient.id}/occasions/${occasion.id}/plan`}
              size="sm"
              colorScheme="blue"
              leftIcon={<FaShoppingCart />}
              flex={1}
            >
              Plan Gifts
            </Button>
            <IconButton
              aria-label="Edit occasion"
              icon={<EditIcon />}
              size="sm"
              variant="outline"
              onClick={() => onEdit(occasion)}
            />
            <IconButton
              aria-label="Delete occasion"
              icon={<DeleteIcon />}
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={() => onDelete(occasion.id)}
              isLoading={isDeleting}
            />
          </HStack>
        </CardFooter>
      )}
    </Card>
  );
};

export default OccasionCard; 