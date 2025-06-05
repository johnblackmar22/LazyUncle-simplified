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
  const [generating, setGenerating] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Placeholder for future gift recommendation functionality
  const handleGenerateSuggestions = async () => {
    setGenerating(true);
    
    // TODO: Implement new simple gift recommendation system
    setTimeout(() => {
      setGenerating(false);
      toast({
        title: 'Gift suggestions coming soon!',
        description: 'We\'re working on a simple gift recommendation system',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    }, 1000);
  };

  const getStatusBadge = () => {
    if (generating) {
      return <Badge colorScheme="blue" variant="subtle"><Spinner size="xs" mr={1} />Generating...</Badge>;
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
      </CardBody>

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
    </Card>
  );
};

export default OccasionCard; 