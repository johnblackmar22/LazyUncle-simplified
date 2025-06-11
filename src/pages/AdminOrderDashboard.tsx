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
  Card,
  CardHeader,
  CardBody,
  Flex,
  Spacer,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  InputGroup,
  InputLeftElement,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { 
  FaShoppingCart, 
  FaCheck, 
  FaTruck, 
  FaEye, 
  FaCopy, 
  FaSearch,
  FaSync
} from 'react-icons/fa';
import { format } from 'date-fns';
import AdminService from '../services/adminService';
import { useAuthStore } from '../store/authStore';
import type { AdminOrder } from '../types';

const AdminOrderDashboard: React.FC = () => {
  const { user } = useAuthStore();
  
  // Order management state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orders = await AdminService.getAllOrders();
        console.log('🔍 Admin Dashboard - Orders loaded:', orders.length);
        setOrders(orders);
      } catch (error) {
        console.error('❌ Error fetching admin orders:', error);
      }
    };

    fetchOrders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshOrders = async () => {
    try {
      const orders = await AdminService.getAllOrders();
      console.log('🔄 Refreshing orders:', orders.length);
      setOrders(orders);
    } catch (error) {
      console.error('❌ Error refreshing admin orders:', error);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.userName.toLowerCase().includes(searchLower) ||
        order.recipientName.toLowerCase().includes(searchLower) ||
        order.giftTitle.toLowerCase().includes(searchLower) ||
        order.occasion.toLowerCase().includes(searchLower) ||
        order.asin?.toLowerCase().includes(searchLower) ||
        order.userEmail.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    return true;
  });

  const markAsOrdered = async (orderId: string) => {
    if (!amazonOrderId.trim()) return;
    
    try {
      await AdminService.updateOrder(orderId, {
        status: 'ordered',
        amazonOrderId: amazonOrderId.trim(),
        notes: notes.trim()
      });
      
      await refreshOrders();
      onClose();
      setAmazonOrderId('');
      setNotes('');
    } catch (error) {
      console.error('❌ Error marking order as ordered:', error);
    }
  };

  const markAsShipped = async (orderId: string) => {
    if (!trackingNumber.trim()) return;
    
    try {
      await AdminService.updateOrder(orderId, {
        status: 'shipped',
        trackingNumber: trackingNumber.trim()
      });
      
      await refreshOrders();
      onClose();
      setTrackingNumber('');
    } catch (error) {
      console.error('❌ Error marking order as shipped:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await AdminService.deleteOrder(orderId);
        await refreshOrders();
      } catch (error) {
        console.error('❌ Error deleting order:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'processing': return 'orange';
      case 'ordered': return 'yellow';
      case 'shipped': return 'blue';
      case 'delivered': return 'green';
      default: return 'gray';
    }
  };

  const openOrderModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    onOpen();
  };

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.giftPrice, 0),
    uniqueCustomers: new Set(orders.map(o => o.userId)).size
  };

  return (
    <Container maxW="full" p={4}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="purple.600">
            🎁 Admin Order Dashboard
          </Heading>
          <Text color="gray.600">
            Welcome back, {user?.displayName}
          </Text>
          <Badge colorScheme="purple" size="sm">
            {stats.uniqueCustomers} Customers • {stats.total} Orders
          </Badge>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FaSync />}
            onClick={refreshOrders}
            size="sm"
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Orders</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending</StatLabel>
              <StatNumber color="red.500">{stats.pending}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Ordered</StatLabel>
              <StatNumber color="yellow.500">{stats.ordered}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Shipped</StatLabel>
              <StatNumber color="blue.500">{stats.shipped}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber>${stats.totalRevenue.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Filters */}
      <HStack spacing={4} mb={6}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW="200px"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ordered">Ordered</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </Select>
      </HStack>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <Heading size="md">Orders ({filteredOrders.length})</Heading>
        </CardHeader>
        <CardBody>
          {filteredOrders.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              No orders found. Users need to select gifts to create orders.
            </Alert>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Customer → Recipient</Th>
                  <Th>Gift & ASIN</Th>
                  <Th>Price</Th>
                  <Th>Occasion</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.map((order) => (
                  <Tr key={order.id}>
                    <Td>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" fontSize="sm">{order.userName}</Text>
                        <Text fontSize="xs" color="gray.600">{order.userEmail}</Text>
                        <Text fontSize="sm">→ {order.recipientName}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" fontSize="sm">{order.giftTitle}</Text>
                        {order.asin && (
                          <HStack spacing={2}>
                            <Badge colorScheme="orange" size="sm">ASIN: {order.asin}</Badge>
                            <Button
                              as="a"
                              href={`https://amazon.com/dp/${order.asin}`}
                              target="_blank"
                              size="xs"
                              colorScheme="orange"
                            >
                              View on Amazon
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Td>
                    <Td>${order.giftPrice.toFixed(2)}</Td>
                    <Td>{order.occasion}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="View details"
                          icon={<FaEye />}
                          size="sm"
                          onClick={() => openOrderModal(order)}
                        />
                        <Button
                          size="xs"
                          colorScheme="red"
                          onClick={() => deleteOrder(order.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Order Details</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <Stack spacing={4}>
                {/* Customer Info */}
                <Box>
                  <Text fontWeight="bold">Customer:</Text>
                  <Text>{selectedOrder.userName} ({selectedOrder.userEmail})</Text>
                </Box>

                {/* Gift Info */}
                <Box>
                  <Text fontWeight="bold">Gift:</Text>
                  <Text>{selectedOrder.giftTitle} - ${selectedOrder.giftPrice}</Text>
                  {selectedOrder.asin && (
                    <HStack spacing={3} mt={2}>
                      <Badge colorScheme="orange">ASIN: {selectedOrder.asin}</Badge>
                      <Button
                        as="a"
                        href={`https://amazon.com/dp/${selectedOrder.asin}`}
                        target="_blank"
                        size="sm"
                        colorScheme="orange"
                      >
                        View on Amazon
                      </Button>
                      <IconButton
                        aria-label="Copy ASIN"
                        icon={<FaCopy />}
                        size="sm"
                        onClick={() => copyToClipboard(selectedOrder.asin || '')}
                      />
                    </HStack>
                  )}
                </Box>

                {/* Recipient Info */}
                <Box>
                  <Text fontWeight="bold">Recipient:</Text>
                  <Text>{selectedOrder.recipientName}</Text>
                  <Text>{selectedOrder.occasion}</Text>
                </Box>

                {/* Admin Actions */}
                {selectedOrder.status === 'pending' && (
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Mark as Ordered:</Text>
                    <Input
                      placeholder="Amazon Order ID"
                      value={amazonOrderId}
                      onChange={(e) => setAmazonOrderId(e.target.value)}
                    />
                    <Textarea
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                      leftIcon={<FaShoppingCart />}
                      colorScheme="yellow"
                      onClick={() => markAsOrdered(selectedOrder.id)}
                      disabled={!amazonOrderId.trim()}
                    >
                      Mark as Ordered
                    </Button>
                  </VStack>
                )}

                {selectedOrder.status === 'ordered' && (
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Mark as Shipped:</Text>
                    <Input
                      placeholder="Tracking Number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <Button
                      leftIcon={<FaTruck />}
                      colorScheme="blue"
                      onClick={() => markAsShipped(selectedOrder.id)}
                      disabled={!trackingNumber.trim()}
                    >
                      Mark as Shipped
                    </Button>
                  </VStack>
                )}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminOrderDashboard; 