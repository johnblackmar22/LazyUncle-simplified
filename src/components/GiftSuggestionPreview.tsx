import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Image,
  Flex,
  useColorModeValue,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaGift, FaThumbsUp, FaThumbsDown, FaEdit } from 'react-icons/fa';
import type { GiftSuggestion } from '../types';
import type { GiftPreview } from '../services/giftSuggestionWorkflow';
import GiftSuggestionWorkflowService from '../services/giftSuggestionWorkflow';

interface GiftSuggestionPreviewProps {
  preview: GiftPreview;
  recipientName: string;
  occasionName: string;
  onApprove: (suggestion: GiftSuggestion) => void;
  onReject: () => void;
  onModify: () => void;
  loading?: boolean;
}

export const GiftSuggestionPreview: React.FC<GiftSuggestionPreviewProps> = ({
  preview,
  recipientName,
  occasionName,
  onApprove,
  onReject,
  onModify,
  loading = false,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<GiftSuggestion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorderColor = useColorModeValue('blue.300', 'blue.600');

  const handleApprove = async () => {
    if (!selectedSuggestion) {
      toast({
        title: 'Please select a gift',
        description: 'Choose one of the suggestions to approve',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setActionLoading('approve');
    try {
      await GiftSuggestionWorkflowService.handleUserApproval(
        preview.occasionId,
        'approve',
        selectedSuggestion,
        `Approved ${selectedSuggestion.name} for ${recipientName}'s ${occasionName}`
      );
      onApprove(selectedSuggestion);
      toast({
        title: 'Gift approved!',
        description: `We'll send ${selectedSuggestion.name} to ${recipientName} for their ${occasionName}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error approving gift',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await GiftSuggestionWorkflowService.handleUserApproval(
        preview.occasionId,
        'reject',
        undefined,
        `User rejected all suggestions for ${recipientName}'s ${occasionName}`
      );
      onReject();
      toast({
        title: 'Suggestions rejected',
        description: 'We\'ll check back with you closer to the date with new ideas',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error rejecting suggestions',
        description: (error as Error).message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModify = () => {
    onModify();
  };

  if (loading) {
    return (
      <Card bg={bgColor} shadow="lg" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <Flex justify="center" align="center" py={8}>
            <VStack>
              <Spinner size="lg" color="blue.500" />
              <Text>Generating perfect gift ideas...</Text>
            </VStack>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={bgColor} shadow="lg" borderRadius="lg" borderColor={borderColor} borderWidth="1px">
      <CardHeader>
        <VStack align="start" spacing={2}>
          <Flex align="center" gap={2}>
            <Icon as={FaGift} color="purple.500" />
            <Heading size="md">Gift Ideas for {recipientName}</Heading>
          </Flex>
          <Text fontSize="sm" color="gray.600">
            Here's what we're thinking for their {occasionName}. You can approve now or we'll check back closer to the date.
          </Text>
        </VStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={4} align="stretch">
          {preview.suggestions.map((suggestion, index) => (
            <Card
              key={suggestion.id}
              borderWidth="1px"
              borderRadius="md"
              borderColor={selectedSuggestion?.id === suggestion.id ? selectedBorderColor : borderColor}
              bg={selectedSuggestion?.id === suggestion.id ? selectedBg : 'transparent'}
              cursor="pointer"
              onClick={() => setSelectedSuggestion(suggestion)}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            >
              <CardBody p={4}>
                <Flex gap={4}>
                  {suggestion.imageUrl && (
                    <Image
                      src={suggestion.imageUrl}
                      alt={suggestion.name}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                      fallback={
                        <Flex
                          boxSize="80px"
                          bg="gray.100"
                          borderRadius="md"
                          align="center"
                          justify="center"
                        >
                          <Icon as={FaGift} color="gray.400" size="24px" />
                        </Flex>
                      }
                    />
                  )}
                  <Flex flex="1" direction="column" gap={2}>
                    <Flex justify="space-between" align="start">
                      <Heading size="sm">{suggestion.name}</Heading>
                      <Badge colorScheme="green" fontSize="sm">
                        ${suggestion.price.toFixed(2)}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {suggestion.description}
                    </Text>
                    <HStack spacing={1}>
                      <Badge variant="outline" size="sm">
                        {suggestion.category}
                      </Badge>
                      {suggestion.tags?.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} colorScheme="blue" variant="subtle" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </HStack>
                  </Flex>
                </Flex>
              </CardBody>
            </Card>
          ))}

          {preview.suggestions.length === 0 && (
            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <AlertTitle>No suggestions yet</AlertTitle>
                <AlertDescription>
                  We're still working on finding the perfect gifts. Try adding more interests to the recipient's profile.
                </AlertDescription>
              </VStack>
            </Alert>
          )}
        </VStack>
      </CardBody>

      <Divider />

      <CardFooter>
        <Flex justify="space-between" width="100%" align="center">
          <Text fontSize="sm" color="gray.500">
            {selectedSuggestion 
              ? `Selected: ${selectedSuggestion.name}` 
              : 'Choose a gift to approve'
            }
          </Text>
          
          <HStack spacing={2}>
            <Tooltip label="We'll check back with new ideas closer to the date">
              <Button
                variant="ghost"
                colorScheme="gray"
                leftIcon={<FaThumbsDown />}
                onClick={handleReject}
                isLoading={actionLoading === 'reject'}
                loadingText="Rejecting..."
              >
                Maybe Later
              </Button>
            </Tooltip>
            
            <Tooltip label="Modify recipient details or budget">
              <Button
                variant="outline"
                colorScheme="blue"
                leftIcon={<FaEdit />}
                onClick={handleModify}
                isDisabled={!!actionLoading}
              >
                Modify
              </Button>
            </Tooltip>
            
            <Tooltip label={selectedSuggestion ? 'Approve this gift and schedule for delivery' : 'Select a gift first'}>
              <Button
                colorScheme="green"
                leftIcon={<FaThumbsUp />}
                onClick={handleApprove}
                isLoading={actionLoading === 'approve'}
                loadingText="Approving..."
                isDisabled={!selectedSuggestion || !!actionLoading}
              >
                Approve & Schedule
              </Button>
            </Tooltip>
          </HStack>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default GiftSuggestionPreview; 