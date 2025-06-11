import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Tag,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { useRecipientStore } from '../../store/recipientStore';
import { useOccasionStore } from '../../store/occasionStore';

const RecipientsList = () => {
  const { recipients, deleteRecipient } = useRecipientStore();
  const { occasions, fetchOccasions } = useOccasionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientToDelete, setRecipientToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const filteredRecipients = recipients.filter(recipient => 
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteClick = (id: string) => {
    setRecipientToDelete(id);
    onOpen();
  };
  
  const confirmDelete = () => {
    if (recipientToDelete) {
      deleteRecipient(recipientToDelete);
      setRecipientToDelete(null);
      onClose();
    }
  };
  
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  React.useEffect(() => {
    recipients.forEach(r => fetchOccasions(r.id));
    // eslint-disable-next-line
  }, [recipients]);

  return (
    <Container maxW="container.xl" py={5}>
      <Flex justify="space-between" align="center" mb={5}>
        <Heading as="h1" size="lg">Recipients</Heading>
        <Button
          as={RouterLink}
          to="/recipients/add"
          colorScheme="blue"
          size="md"
        >
          Add Recipient
        </Button>
      </Flex>
      
      <Box mb={5}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            🔍
          </InputLeftElement>
          <Input 
            placeholder="Search recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>
      
      {filteredRecipients.length === 0 ? (
        <Box
          bg={boxBg}
          p={8}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          {recipients.length === 0 ? (
            <>
              <Text fontSize="lg" mb={4}>You haven't added any recipients yet.</Text>
              <Button
                as={RouterLink}
                to="/recipients/add"
                colorScheme="blue"
              >
                Add Your First Recipient
              </Button>
            </>
          ) : (
            <Text fontSize="lg">No recipients match your search.</Text>
          )}
        </Box>
      ) : (
        <Box
          bg={boxBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: "sm", md: "md" }}>
              <Thead>
                <Tr>
                  <Th minW="120px">Name</Th>
                  <Th minW="120px">Relationship</Th>
                  <Th minW="200px">Interests</Th>
                  <Th minW="150px">Occasions</Th>
                  <Th minW="200px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRecipients.map((recipient) => (
                  <Tr key={recipient.id}>
                    <Td fontWeight="medium">{recipient.name}</Td>
                    <Td>{recipient.relationship}</Td>
                    <Td>
                      <HStack spacing={2} flexWrap="wrap">
                        {recipient.interests.slice(0, 3).map((interest, idx) => (
                          <Tag key={idx} size="sm" colorScheme="blue">
                            {interest}
                          </Tag>
                        ))}
                        {recipient.interests.length > 3 && (
                          <Tag size="sm" colorScheme="gray">
                            +{recipient.interests.length - 3} more
                          </Tag>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      {occasions && occasions[recipient.id] && occasions[recipient.id].length > 0 ? (
                        <HStack spacing={1} flexWrap="wrap">
                          {occasions[recipient.id].slice(0, 2).map((occasion, idx) => (
                            <Tag key={occasion.id} size="sm" colorScheme="purple">{occasion.name}</Tag>
                          ))}
                          {occasions[recipient.id].length > 2 && (
                            <Tag size="sm" colorScheme="gray">
                              +{occasions[recipient.id].length - 2} more
                            </Tag>
                          )}
                        </HStack>
                      ) : (
                        <Text color="gray.400" fontSize="sm">None</Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2} flexWrap={{ base: "wrap", md: "nowrap" }}>
                        <Button
                          as={RouterLink}
                          to={`/recipients/${recipient.id}`}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                        >
                          View
                        </Button>
                        <Button
                          as={RouterLink}
                          to={`/recipients/edit/${recipient.id}`}
                          size="sm"
                          colorScheme="teal"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteClick(recipient.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this recipient? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={confirmDelete}>
              Delete
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RecipientsList; 