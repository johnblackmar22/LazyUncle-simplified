import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  Tag,
  useColorModeValue,
  HStack,
  SimpleGrid,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useGiftStore } from '../../store/giftStore';
import type { Occasion } from '../../types';
import { AddIcon } from '@chakra-ui/icons';

const RecipientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);
  
  const { recipients, deleteRecipient } = useRecipientStore();
  const { gifts, getGiftsByRecipient } = useGiftStore();
  
  const recipient = id ? recipients.find(r => r.id === id) : undefined;
  const recipientGifts = id ? getGiftsByRecipient(id) : [];
  
  // Redirect if recipient not found
  useEffect(() => {
    if (id && !recipient && recipients.length > 0) {
      toast({
        title: 'Recipient not found',
        description: 'The recipient you are looking for does not exist.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    }
  }, [id, recipient, recipients, navigate, toast]);
  
  const handleDelete = () => {
    if (id) {
      deleteRecipient(id);
      toast({
        title: 'Recipient deleted',
        description: 'The recipient has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/recipients');
    }
    onClose();
  };
  
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Occasions from gifts (flat, date-sorted)
  const occasionsFromGifts = [...recipientGifts]
    .map(gift => ({
      id: gift.id,
      name: gift.occasion,
      date: gift.date,
      budget: gift.budget,
      repeatAnnually: gift.repeatAnnually,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (!recipient) {
    return (
      <Container maxW="container.lg" py={5}>
        <Box textAlign="center" py={10}>
          <Text>Loading recipient information...</Text>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.lg" py={5}>
      <Flex justify="space-between" align="center" mb={5}>
        <Heading as="h1" size="lg">{recipient.name}</Heading>
        <HStack>
          <Button
            as={RouterLink}
            to={`/recipients/edit/${id}`}
            colorScheme="blue"
            variant="outline"
          >
            Edit
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
          >
            Delete
          </Button>
        </HStack>
      </Flex>
      
      <Box
        bg={boxBg}
        p={6}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Heading as="h3" size="md" mb={3}>
              Basic Information
            </Heading>
            <Stack spacing={3}>
              <Box>
                <Text fontWeight="bold">Relationship</Text>
                <Text>{recipient.relationship}</Text>
              </Box>
              {recipient.interests.length > 0 && (
                <Box>
                  <Text fontWeight="bold">Interests</Text>
                  <Flex wrap="wrap" gap={2} mt={1}>
                    {recipient.interests.map((interest: string, index: number) => (
                      <Tag key={index} colorScheme="blue">
                        {interest}
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              )}
            </Stack>
          </Box>
        </SimpleGrid>
      </Box>
      
      {/* Occasions from Gifts Section */}
      {occasionsFromGifts.length > 0 && (
        <Box bg={boxBg} p={6} borderRadius="md" borderWidth="1px" borderColor={borderColor} mb={6}>
          <Heading as="h3" size="md" mb={3}>Occasions Covered</Heading>
          <Stack spacing={3}>
            {occasionsFromGifts.map(occasion => (
              <Box key={occasion.id} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="bold">{occasion.name}</Text>
                    <Text fontSize="sm">Date: {new Date(occasion.date).toLocaleDateString()}</Text>
                    {occasion.budget !== undefined && (
                      <Text fontSize="sm">Budget: ${occasion.budget}</Text>
                    )}
                    {occasion.repeatAnnually && (
                      <Tag colorScheme="green" ml={2}>Annual</Tag>
                    )}
                  </Box>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Gifts</Tab>
          <Tab>Important Dates</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Gifts for {recipient.name}</Heading>
              <Button
                as={RouterLink}
                to={`/gifts/add/${recipient.id}`}
                colorScheme="purple"
                leftIcon={<AddIcon />}
                size="sm"
              >
                Add Gift
              </Button>
            </Flex>
            
            {recipientGifts.length === 0 ? (
              <Box
                bg={boxBg}
                p={6}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                textAlign="center"
              >
                <Text mb={4}>No gifts added for {recipient.name} yet.</Text>
                <Button
                  as={RouterLink}
                  to={`/gifts/add/${recipient.id}`}
                  colorScheme="purple"
                  leftIcon={<AddIcon />}
                  size="sm"
                >
                  Add First Gift
                </Button>
              </Box>
            ) : (
              <Stack spacing={4}>
                {recipientGifts.map(gift => (
                  <Box
                    key={gift.id}
                    p={4}
                    bg={boxBg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between">
                      <Box>
                        <Heading as="h4" size="sm">{gift.name}</Heading>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(gift.date).toLocaleDateString()} • {gift.occasion}
                        </Text>
                        {gift.description && (
                          <Text mt={2}>{gift.description}</Text>
                        )}
                      </Box>
                      <Box textAlign="right">
                        <Text fontWeight="bold">${gift.price.toFixed(2)}</Text>
                        <Badge colorScheme={
                          gift.status === 'delivered' ? 'green' :
                          gift.status === 'shipped' ? 'blue' :
                          gift.status === 'ordered' ? 'yellow' : 'gray'
                        }>
                          {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                        </Badge>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            )}
          </TabPanel>
          
          <TabPanel px={0}>
            <Box
              bg={boxBg}
              p={6}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text>Important dates feature coming soon!</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Recipient
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {recipient.name}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default RecipientDetail; 