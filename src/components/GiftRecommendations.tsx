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
  Divider,
  useToast,
  Skeleton,
  useColorModeValue,
  Card,
  CardBody,
  CardFooter,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
} from '@chakra-ui/react';
import { FiSend, FiInfo, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { getGiftRecommendations, generateGiftMessage, handleAutoSendGift, getGiftRecommendationsFromAI } from '../services/giftRecommendationEngine';
import type { UserSettings } from '../types/settings';

interface Recipient {
  id: string;
  name: string;
  relationship: string;
  interests: string[];
  gender?: string;
  birthday?: string;
  [key: string]: any;
}

interface Gift {
  id: string;
  recipientId: string;
  name: string;
  description: string;
  price: number;
  occasion: string;
  imageUrl?: string;
  status: 'recommended' | 'selected' | 'purchased' | 'sent' | 'received';
  date: string;
  personalMessage?: string;
  autoSend: boolean;
}

interface GiftRecommendationsProps {
  recipients: Recipient[];
  onSendGift: (gift: Gift) => Promise<boolean>;
  settings: UserSettings;
}

export default function GiftRecommendations({ recipients, onSendGift, settings }: GiftRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{ [key: string]: Gift[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingGift, setSendingGift] = useState<string | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [currentGift, setCurrentGift] = useState<Gift | null>(null);
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [sendError, setSendError] = useState<string | null>(null);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    if (recipients.length > 0) {
      generateAIRecommendationsForAll();
    }
  }, [recipients]);
  
  // Generate AI recommendations for all recipients
  const generateAIRecommendationsForAll = async () => {
    setLoading(true);
    const allRecommendations: { [key: string]: Gift[] } = {};
    
    for (const recipient of recipients) {
      const now = new Date();
      const occasionDate = new Date();
      occasionDate.setDate(occasionDate.getDate() + 30);
      const occasion = 'Birthday'; // Simplified
      
      try {
        // Try to get AI recommendations first
        const aiRecs = await getGiftRecommendationsFromAI({ recipient, budget: 200 });
        
        // If AI returns valid recommendations, use them
        if (aiRecs && aiRecs.length > 0) {
          const giftRecommendations = aiRecs.map((rec: any, idx: number) => ({
            id: `ai-${rec.id || idx}-${recipient.id}`,
            recipientId: recipient.id,
            name: rec.name,
            description: rec.description,
            price: rec.price || rec.estimatedPrice || 0,
            occasion,
            imageUrl: rec.imageUrl,
            status: 'recommended' as const,
            date: occasionDate.toISOString().split('T')[0],
            autoSend: false,
            personalMessage: generateGiftMessage(recipient.name, occasion, recipient.relationship)
          }));
          allRecommendations[recipient.id] = giftRecommendations;
        } else {
          // If AI returns empty results, fall back to local recommendations
          throw new Error('AI returned empty recommendations');
        }
      } catch (error) {
        console.error(`Error getting AI recommendations for ${recipient.name}:`, error);
        
        // Fallback to local recommendation engine
        const recipientRecommendations = getGiftRecommendations(recipient, occasion, 200);
        const giftRecommendations = recipientRecommendations.map(rec => ({
          id: `rec-${rec.id}-${recipient.id}`,
          recipientId: recipient.id,
          name: rec.name,
          description: rec.description,
          price: rec.price,
          occasion,
          imageUrl: rec.imageUrl,
          status: 'recommended' as const,
          date: occasionDate.toISOString().split('T')[0],
          autoSend: false,
          personalMessage: generateGiftMessage(recipient.name, occasion, recipient.relationship)
        }));
        allRecommendations[recipient.id] = giftRecommendations;
      }
    }
    
    setRecommendations(allRecommendations);
    setLoading(false);
  };
  
  // Handle sending a gift
  const handleSend = async (gift: Gift) => {
    setSendingGift(gift.id);
    
    try {
      const recipient = recipients.find(r => r.id === gift.recipientId);
      
      if (!recipient) {
        throw new Error('Recipient not found');
      }
      
      // Use the auto-send function
      const success = await handleAutoSendGift(gift, recipient, settings);
      
      if (success) {
        // Update gift status
        const updatedGift: Gift = { ...gift, status: 'sent' };
        
        // Pass to parent component
        await onSendGift(updatedGift);
        
        toast({
          title: 'Gift Sent',
          description: `${gift.name} was sent to ${recipient.name}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update local state
        setRecommendations(prev => {
          const recipientGifts = [...prev[recipient.id]];
          const giftIndex = recipientGifts.findIndex(g => g.id === gift.id);
          recipientGifts[giftIndex] = updatedGift;
          
          return {
            ...prev,
            [recipient.id]: recipientGifts
          };
        });
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast({
        title: 'Error',
        description: 'Failed to send gift. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSendingGift(null);
    }
  };
  
  // Open the message modal
  const openMessageModal = (gift: Gift) => {
    setCurrentGift(gift);
    setPersonalMessage(gift.personalMessage || '');
    setIsMessageModalOpen(true);
  };
  
  // Save the message and proceed with gift sending
  const saveMessageAndSend = async () => {
    if (!currentGift) return;
    
    const giftWithMessage: Gift = {
      ...currentGift,
      personalMessage
    };
    
    setIsMessageModalOpen(false);
    await handleSend(giftWithMessage);
  };
  
  // Toggle auto-send for a gift
  const toggleAutoSend = (recipientId: string, giftId: string) => {
    setRecommendations(prev => {
      const recipientGifts = [...prev[recipientId]];
      const giftIndex = recipientGifts.findIndex(g => g.id === giftId);
      if (giftIndex >= 0) {
        recipientGifts[giftIndex] = {
          ...recipientGifts[giftIndex],
          autoSend: !recipientGifts[giftIndex].autoSend
        };
      }
      return {
        ...prev,
        [recipientId]: recipientGifts
      };
    });
  };

  // Set all gifts to auto-send
  const setAllAutoSend = () => {
    setRecommendations(prev => {
      const updated: { [key: string]: Gift[] } = {};
      Object.keys(prev).forEach(recipientId => {
        updated[recipientId] = prev[recipientId].map(gift => ({ ...gift, autoSend: true }));
      });
      return updated;
    });
  };

  // Check if all gifts are already set to auto-send
  const allAutoSend = Object.values(recommendations).every(gifts => gifts.every(gift => gift.autoSend));

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="lg">Gift Recommendations</Heading>
        <Tooltip label="Enable auto-send for all recommended gifts. Gifts will be sent automatically when the date approaches." aria-label="Set all to auto-send">
          <Button colorScheme="green" onClick={setAllAutoSend} isDisabled={allAutoSend}>
            Set all to auto-send
          </Button>
        </Tooltip>
      </Flex>
      
      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="320px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : recipients.length === 0 ? (
        <Box p={6} borderWidth="1px" borderRadius="md" bg={cardBg}>
          <Text>No recipients added yet. Add recipients to get gift recommendations.</Text>
        </Box>
      ) : (
        <Stack spacing={8}>
          {recipients.map(recipient => (
            <Box key={recipient.id}>
              <Heading size="md" mb={4}>{recipient.name}'s Recommendations</Heading>
              
              {recommendations[recipient.id]?.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {recommendations[recipient.id].map(gift => (
                    <Card key={gift.id} borderWidth="1px" borderRadius="md" bg={cardBg} overflow="hidden">
                      {gift.imageUrl && (
                        <Image
                          src={gift.imageUrl}
                          alt={gift.name}
                          height="180px"
                          objectFit="cover"
                        />
                      )}
                      
                      <CardBody>
                        <Stack spacing={2}>
                          <Heading size="md">{gift.name}</Heading>
                          <Text color="blue.500" fontWeight="bold">
                            ${gift.price.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" noOfLines={2}>
                            {gift.description}
                          </Text>
                          <Flex justify="space-between" align="center">
                            <Badge colorScheme="purple">
                              {gift.occasion}
                            </Badge>
                            <Badge colorScheme={gift.status === 'sent' ? 'green' : 'blue'}>
                              {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                            </Badge>
                          </Flex>
                          
                          <Flex align="center" mt={2}>
                            <Text fontSize="sm" mr={2}>Auto-send:</Text>
                            <Tooltip label="Toggle auto-send for this gift. If enabled, the gift will be sent automatically when the date approaches." aria-label="Auto-send help">
                              <IconButton
                                aria-label={gift.autoSend ? "Disable auto-send" : "Enable auto-send"}
                                icon={gift.autoSend ? <FiCheck /> : <FiX />}
                                size="xs"
                                colorScheme={gift.autoSend ? "green" : "gray"}
                                onClick={() => toggleAutoSend(recipient.id, gift.id)}
                                isDisabled={gift.status === 'sent'}
                                tabIndex={0}
                              />
                            </Tooltip>
                            <Tooltip label="Auto-send will automatically send this gift when the date approaches" aria-label="Auto-send info">
                              <IconButton
                                aria-label="Info about auto-send"
                                icon={<FiInfo />}
                                size="xs"
                                variant="ghost"
                                ml={1}
                                tabIndex={0}
                              />
                            </Tooltip>
                          </Flex>
                        </Stack>
                      </CardBody>
                      
                      <Divider />
                      
                      <CardFooter>
                        <Flex width="100%" justify="space-between">
                          <Button
                            leftIcon={<FiEdit />}
                            size="sm"
                            variant="outline"
                            onClick={() => openMessageModal(gift)}
                            isDisabled={gift.status === 'sent' || sendingGift === gift.id}
                          >
                            Message
                          </Button>
                          <Button
                            leftIcon={<FiSend />}
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleSend(gift)}
                            isLoading={sendingGift === gift.id}
                            isDisabled={gift.status === 'sent'}
                          >
                            Send Now
                          </Button>
                        </Flex>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Box p={4} borderWidth="1px" borderRadius="md" bg={cardBg}>
                  <Text>No recommendations available for {recipient.name}</Text>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}
      
      {/* Message Modal */}
      <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Personalize Your Gift Message</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <Text mb={2}>Edit the message that will be sent with the gift:</Text>
            <Textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Enter your personal message"
              size="md"
              rows={5}
            />
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={saveMessageAndSend}>
              Save & Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 