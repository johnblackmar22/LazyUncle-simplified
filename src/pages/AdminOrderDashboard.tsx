import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { FaShoppingCart, FaCheck, FaTruck, FaEye, FaCopy } from 'react-icons/fa';
import { format } from 'date-fns';

interface PendingOrder {
  id: string;
  recipientName: string;
  recipientAddress: string;
  occasionName: string;
  occasionDate: string;
  giftName: string;
  giftPrice: number;
  giftUrl?: string;
  userEmail: string;
  status: 'pending' | 'ordered' | 'shipped' | 'delivered';
  orderDate: number;
  amazonOrderId?: string;
  trackingNumber?: string;
  notes?: string;
  giftWrap: boolean;
  personalNote?: string;
}

const AdminOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load pending orders from localStorage/Firebase
  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = () => {
    // In demo mode, load from localStorage
    // In production, this would be a Firebase query for orders with admin access
    const stored = localStorage.getItem('admin_pending_orders');
    if (stored) {
      setOrders(JSON.parse(stored));
    }
  };

  const saveOrders = (updatedOrders: PendingOrder[]) => {
    localStorage.setItem('admin_pending_orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };

  const markAsOrdered = (orderId: string) => {
    if (!amazonOrderId.trim()) return;
    
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'ordered' as const,
            amazonOrderId: amazonOrderId.trim(),
            notes: notes.trim()
          }
        : order
    );
    
    saveOrders(updatedOrders);
    
    // Send confirmation email to user (mock)
    console.log('📧 Sending order confirmation email to:', selectedOrder?.userEmail);
    
    onClose();
    setAmazonOrderId('');
    setNotes('');
  };

  const markAsShipped = (orderId: string) => {
    if (!trackingNumber.trim()) return;
    
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'shipped' as const,
            trackingNumber: trackingNumber.trim()
          }
        : order
    );
    
    saveOrders(updatedOrders);
    
    // Send shipping notification email to user (mock)
    console.log('📧 Sending shipping notification email to:', selectedOrder?.userEmail);
    
    onClose();
    setTrackingNumber('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'ordered': return 'yellow';
      case 'shipped': return 'blue';
      case 'delivered': return 'green';
      default: return 'gray';
    }
  };

  const openOrderModal = (order: PendingOrder) => {
    setSelectedOrder(order);
    onOpen();
  };

  const generateMockOrder = () => {
    // Helper function to create a mock order for testing
    const mockOrder: PendingOrder = {
      id: `order-${Date.now()}`,
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, Anytown, USA 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Bluetooth Headphones',
      giftPrice: 79.99,
      giftUrl: 'https://amazon.com/dp/B08EXAMPLE',
      userEmail: 'user@example.com',
      status: 'pending',
      orderDate: Date.now(),
      giftWrap: true,
      personalNote: 'Happy Birthday! Hope you love these!',
    };
    
    const updatedOrders = [...orders, mockOrder];
    saveOrders(updatedOrders);
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const orderedCount = orders.filter(o => o.status === 'ordered').length;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <Heading size="lg">🧙‍♂️ Admin Order Dashboard</Heading>
          <Spacer />
          <Button onClick={generateMockOrder} colorScheme="blue" size="sm">
            Add Mock Order (Testing)
          </Button>
        </Flex>

        {/* Stats */}
        <HStack spacing={4}>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">{pendingCount}</Text>
              <Text fontSize="sm" color="gray.600">Pending Orders</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="yellow.500">{orderedCount}</Text>
              <Text fontSize="sm" color="gray.600">Ordered on Amazon</Text>
            </CardBody>
          </Card>
        </HStack>

        {pendingCount > 0 && (
          <Alert status="warning">
            <AlertIcon />
            You have {pendingCount} pending order(s) that need to be processed on Amazon!
          </Alert>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Recent Orders</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order Date</Th>
                  <Th>Recipient</Th>
                  <Th>Gift</Th>
                  <Th>Price</Th>
                  <Th>Occasion</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</Td>
                    <Td>
                      <Text fontWeight="medium">{order.recipientName}</Text>
                      <Text fontSize="sm" color="gray.600">{order.userEmail}</Text>
                    </Td>
                    <Td>
                      <Text fontWeight="medium">{order.giftName}</Text>
                      {order.giftUrl && (
                        <Button
                          as="a"
                          href={order.giftUrl}
                          target="_blank"
                          size="xs"
                          colorScheme="blue"
                          variant="link"
                        >
                          View on Amazon
                        </Button>
                      )}
                    </Td>
                    <Td>${order.giftPrice.toFixed(2)}</Td>
                    <Td>
                      <Text>{order.occasionName}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {format(new Date(order.occasionDate), 'MMM dd, yyyy')}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View Details">
                          <IconButton
                            aria-label="View details"
                            icon={<FaEye />}
                            size="sm"
                            onClick={() => openOrderModal(order)}
                          />
                        </Tooltip>
                        {order.status === 'pending' && (
                          <Tooltip label="Mark as Ordered">
                            <IconButton
                              aria-label="Mark as ordered"
                              icon={<FaShoppingCart />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => openOrderModal(order)}
                            />
                          </Tooltip>
                        )}
                        {order.status === 'ordered' && (
                          <Tooltip label="Add Tracking">
                            <IconButton
                              aria-label="Add tracking"
                              icon={<FaTruck />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => openOrderModal(order)}
                            />
                          </Tooltip>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {orders.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No orders yet. Try adding a mock order to test!</Text>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Order Details - {selectedOrder?.recipientName}
          </ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Gift:</Text>
                  <Text>{selectedOrder.giftName} - ${selectedOrder.giftPrice}</Text>
                  {selectedOrder.giftUrl && (
                    <Button
                      as="a"
                      href={selectedOrder.giftUrl}
                      target="_blank"
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<FaEye />}
                      mt={2}
                    >
                      View on Amazon
                    </Button>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="bold">Delivery Address:</Text>
                  <Text>{selectedOrder.recipientAddress}</Text>
                  <IconButton
                    aria-label="Copy address"
                    icon={<FaCopy />}
                    size="sm"
                    mt={2}
                    onClick={() => copyToClipboard(selectedOrder.recipientAddress)}
                  />
                </Box>

                {selectedOrder.giftWrap && (
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    Gift wrap requested
                  </Alert>
                )}

                {selectedOrder.personalNote && (
                  <Box>
                    <Text fontWeight="bold">Personal Note:</Text>
                    <Text fontStyle="italic">"{selectedOrder.personalNote}"</Text>
                    <IconButton
                      aria-label="Copy note"
                      icon={<FaCopy />}
                      size="sm"
                      mt={2}
                      onClick={() => copyToClipboard(selectedOrder.personalNote || '')}
                    />
                  </Box>
                )}

                {selectedOrder.status === 'pending' && (
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold" color="red.500">
                      🛒 Ready to order on Amazon:
                    </Text>
                    <Input
                      placeholder="Amazon Order ID (after ordering)"
                      value={amazonOrderId}
                      onChange={(e) => setAmazonOrderId(e.target.value)}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </VStack>
                )}

                {selectedOrder.status === 'ordered' && (
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold" color="yellow.500">
                      📦 Order placed! Add tracking info:
                    </Text>
                    <Text fontSize="sm">Amazon Order ID: {selectedOrder.amazonOrderId}</Text>
                    <Input
                      placeholder="Tracking Number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </VStack>
                )}

                {selectedOrder.status === 'shipped' && (
                  <Box>
                    <Text fontWeight="bold" color="blue.500">🚚 Shipped!</Text>
                    <Text>Tracking: {selectedOrder.trackingNumber}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedOrder?.status === 'pending' && (
              <Button
                colorScheme="green"
                onClick={() => markAsOrdered(selectedOrder.id)}
                isDisabled={!amazonOrderId.trim()}
                leftIcon={<FaCheck />}
              >
                Mark as Ordered
              </Button>
            )}
            {selectedOrder?.status === 'ordered' && (
              <Button
                colorScheme="blue"
                onClick={() => markAsShipped(selectedOrder.id)}
                isDisabled={!trackingNumber.trim()}
                leftIcon={<FaTruck />}
              >
                Mark as Shipped
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminOrderDashboard; 