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
import { FaShoppingCart, FaCheck, FaTruck, FaEye, FaCopy, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';

interface PendingOrder {
  id: string;
  // Customer Info (who pays)
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPlan: string;
  // Recipient Info (who receives)
  recipientName: string;
  recipientAddress: string;
  // Order Details
  occasionName: string;
  occasionDate: string;
  giftName: string;
  giftPrice: number;
  giftUrl?: string;
  giftASIN?: string; // Amazon ASIN for easy ordering
  status: 'pending' | 'ordered' | 'shipped' | 'delivered';
  orderDate: number;
  amazonOrderId?: string;
  trackingNumber?: string;
  notes?: string;
  giftWrap: boolean;
  personalNote?: string;
  // Billing
  billingStatus: 'pending' | 'charged' | 'refunded';
  chargeAmount?: number;
}

const AdminOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load pending orders from localStorage/Firebase
  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = () => {
    // In demo mode, load from localStorage
    // In production, this would be a Firebase query for orders with admin access
    const stored = localStorage.getItem('admin_pending_orders');
    console.log('🔍 Loading orders from localStorage:', stored);
    if (stored) {
      const parsedOrders = JSON.parse(stored);
      console.log('📋 Parsed orders:', parsedOrders);
      setOrders(parsedOrders);
    } else {
      console.log('⚠️ No orders found in localStorage');
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
    console.log('📧 Sending order confirmation email to:', selectedOrder?.customerEmail);
    
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
    console.log('📧 Sending shipping notification email to:', selectedOrder?.customerEmail);
    
    onClose();
    setTrackingNumber('');
  };

  const markAsBilled = (orderId: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            billingStatus: 'charged' as const,
            notes: (order.notes || '') + `\nBilled: ${billingNotes || 'Charged successfully'}`
          }
        : order
    );
    
    saveOrders(updatedOrders);
    
    console.log('💳 Billing marked as charged for order:', orderId);
    
    onClose();
    setBillingNotes('');
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
      // Customer Info
      customerId: 'demo-customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      customerPlan: 'Premium',
      // Recipient Info
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, Anytown, USA 12345',
      // Order Details
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Bluetooth Headphones',
      giftPrice: 79.99,
      giftUrl: 'https://amazon.com/dp/B08EXAMPLE',
      giftASIN: 'B08EXAMPLE123',
      status: 'pending',
      orderDate: Date.now(),
      giftWrap: true,
      personalNote: 'Happy Birthday! Hope you love these!',
      // Billing
      billingStatus: 'pending',
      chargeAmount: 79.99,
    };
    
    const updatedOrders = [...orders, mockOrder];
    saveOrders(updatedOrders);
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const orderedCount = orders.filter(o => o.status === 'ordered').length;

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    const pendingOrderIds = orders.filter(o => o.status === 'pending').map(o => o.id);
    setSelectedOrderIds(prev => 
      prev.length === pendingOrderIds.length ? [] : pendingOrderIds
    );
  };

  const markSelectedAsBilled = () => {
    const updatedOrders = orders.map(order => 
      selectedOrderIds.includes(order.id)
        ? { 
            ...order, 
            billingStatus: 'charged' as const,
            notes: (order.notes || '') + `\nBulk billing: ${billingNotes || 'Processed in bulk'}`
          }
        : order
    );
    
    saveOrders(updatedOrders);
    setSelectedOrderIds([]);
    setBillingNotes('');
    
    console.log('💳 Bulk billing processed for orders:', selectedOrderIds);
  };

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

        {/* Bulk Actions */}
        {orders.filter(o => o.status === 'pending').length > 1 && (
          <Card>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">🔧 Bulk Actions</Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedOrderIds.length} of {orders.filter(o => o.status === 'pending').length} orders selected
                  </Text>
                </HStack>
                
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    onClick={toggleSelectAll}
                    variant="outline"
                  >
                    {selectedOrderIds.length === orders.filter(o => o.status === 'pending').length ? 'Deselect All' : 'Select All Pending'}
                  </Button>
                  
                  {selectedOrderIds.length > 0 && (
                    <>
                      <Input
                        placeholder="Bulk billing notes (optional)"
                        value={billingNotes}
                        onChange={(e) => setBillingNotes(e.target.value)}
                        size="sm"
                        maxW="300px"
                      />
                      <Button
                        colorScheme="green"
                        leftIcon={<FaCheckDouble />}
                        size="sm"
                        onClick={markSelectedAsBilled}
                      >
                        Mark {selectedOrderIds.length} as Charged
                      </Button>
                    </>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
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
                  <Th>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === orders.filter(o => o.status === 'pending').length && orders.filter(o => o.status === 'pending').length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: '8px' }}
                    />
                    Select
                  </Th>
                  <Th>Order Date</Th>
                  <Th>Customer → Recipient</Th>
                  <Th>Gift & ASIN</Th>
                  <Th>Price</Th>
                  <Th>Occasion</Th>
                  <Th>Status</Th>
                  <Th>Billing</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      {order.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                        />
                      )}
                    </Td>
                    <Td>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Badge colorScheme="blue" size="sm">{order.customerPlan}</Badge>
                          <Text fontWeight="bold" fontSize="sm">{order.customerName}</Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.600">{order.customerEmail}</Text>
                        <Text fontSize="sm">→ {order.recipientName}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" fontSize="sm">{order.giftName}</Text>
                        {order.giftASIN && (
                          <HStack spacing={2}>
                            <Badge colorScheme="orange" size="sm">ASIN: {order.giftASIN}</Badge>
                            <Button
                              as="a"
                              href={`https://amazon.com/dp/${order.giftASIN}`}
                              target="_blank"
                              size="xs"
                              colorScheme="orange"
                              variant="link"
                            >
                              View on Amazon
                            </Button>
                          </HStack>
                        )}
                        {order.giftUrl && !order.giftASIN && (
                          <Button
                            as="a"
                            href={order.giftUrl}
                            target="_blank"
                            size="xs"
                            colorScheme="blue"
                            variant="link"
                          >
                            View Product
                          </Button>
                        )}
                      </VStack>
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
                      <VStack align="start" spacing={1}>
                        <Badge 
                          colorScheme={order.billingStatus === 'charged' ? 'green' : order.billingStatus === 'refunded' ? 'red' : 'yellow'}
                          size="sm"
                        >
                          {order.billingStatus.toUpperCase()}
                        </Badge>
                        {order.chargeAmount && (
                          <Text fontSize="xs">${order.chargeAmount.toFixed(2)}</Text>
                        )}
                      </VStack>
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

        {/* Debug Information - Remove in production */}
        <Card bg="gray.50" borderColor="gray.200">
          <CardHeader>
            <Heading size="sm">🔧 Debug Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm">Orders in state:</Text>
                <Badge colorScheme="blue">{orders.length}</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm">localStorage key:</Text>
                <Text fontSize="xs" fontFamily="mono">admin_pending_orders</Text>
              </HStack>
              
              <Button
                size="sm"
                onClick={() => {
                  const stored = localStorage.getItem('admin_pending_orders');
                  console.log('🔍 Raw localStorage:', stored);
                  console.log('📋 Current orders state:', orders);
                  if (stored) {
                    try {
                      const parsed = JSON.parse(stored);
                      console.log('✅ Successfully parsed:', parsed);
                    } catch (e) {
                      console.error('❌ Parse error:', e);
                    }
                  }
                }}
                variant="outline"
              >
                Check Console Logs
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  console.log('🔄 Reloading orders...');
                  loadPendingOrders();
                }}
                colorScheme="green"
                variant="outline"
              >
                Reload Orders
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  localStorage.removeItem('admin_pending_orders');
                  setOrders([]);
                  console.log('🗑️ Cleared localStorage and orders');
                }}
                colorScheme="red"
                variant="outline"
              >
                Clear All Orders
              </Button>
            </VStack>
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
                {/* Customer Information */}
                <Box borderWidth={1} borderColor="blue.200" borderRadius="md" p={3} bg="blue.50">
                  <Text fontWeight="bold" color="blue.800">💳 Customer (Billing)</Text>
                  <VStack align="start" spacing={1} mt={2}>
                    <HStack>
                      <Badge colorScheme="blue">{selectedOrder.customerPlan}</Badge>
                      <Text fontWeight="medium">{selectedOrder.customerName}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">{selectedOrder.customerEmail}</Text>
                    <HStack>
                      <Text fontSize="sm">Charge Amount:</Text>
                      <Badge colorScheme="green">${selectedOrder.chargeAmount?.toFixed(2)}</Badge>
                      <Badge 
                        colorScheme={selectedOrder.billingStatus === 'charged' ? 'green' : selectedOrder.billingStatus === 'refunded' ? 'red' : 'yellow'}
                      >
                        {selectedOrder.billingStatus.toUpperCase()}
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>

                {/* Gift & ASIN Information */}
                <Box>
                  <Text fontWeight="bold">🎁 Gift Details:</Text>
                  <VStack align="start" spacing={2} mt={2}>
                    <Text fontSize="lg">{selectedOrder.giftName} - ${selectedOrder.giftPrice}</Text>
                    
                    {selectedOrder.giftASIN && (
                      <HStack spacing={3}>
                        <Badge colorScheme="orange" p={2}>
                          ASIN: {selectedOrder.giftASIN}
                        </Badge>
                        <Button
                          as="a"
                          href={`https://amazon.com/dp/${selectedOrder.giftASIN}`}
                          target="_blank"
                          size="sm"
                          colorScheme="orange"
                          leftIcon={<FaEye />}
                        >
                          Open on Amazon
                        </Button>
                        <IconButton
                          aria-label="Copy ASIN"
                          icon={<FaCopy />}
                          size="sm"
                          onClick={() => copyToClipboard(selectedOrder.giftASIN || '')}
                        />
                      </HStack>
                    )}
                    
                    {selectedOrder.giftUrl && !selectedOrder.giftASIN && (
                      <Button
                        as="a"
                        href={selectedOrder.giftUrl}
                        target="_blank"
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<FaEye />}
                      >
                        View Product
                      </Button>
                    )}
                  </VStack>
                </Box>

                {/* Recipient Information */}
                <Box>
                  <Text fontWeight="bold">📦 Delivery Address (Recipient):</Text>
                  <VStack align="start" spacing={2} mt={2}>
                    <Text fontWeight="medium">→ {selectedOrder.recipientName}</Text>
                    <Text>{selectedOrder.recipientAddress}</Text>
                    <IconButton
                      aria-label="Copy address"
                      icon={<FaCopy />}
                      size="sm"
                      onClick={() => copyToClipboard(selectedOrder.recipientAddress)}
                    />
                  </VStack>
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

                {/* Billing Management */}
                {selectedOrder.billingStatus === 'pending' && (
                  <Box borderWidth={1} borderColor="yellow.200" borderRadius="md" p={3} bg="yellow.50">
                    <Text fontWeight="bold" color="yellow.800">💳 Billing Required</Text>
                    <VStack spacing={3} align="stretch" mt={2}>
                      <Text fontSize="sm">
                        Charge <strong>{selectedOrder.customerName}</strong> ${selectedOrder.chargeAmount?.toFixed(2)} 
                        for {selectedOrder.giftName}
                      </Text>
                      <Input
                        placeholder="Billing notes (optional)"
                        value={billingNotes}
                        onChange={(e) => setBillingNotes(e.target.value)}
                        size="sm"
                      />
                    </VStack>
                  </Box>
                )}

                {selectedOrder.billingStatus === 'charged' && (
                  <Alert status="success" size="sm">
                    <AlertIcon />
                    Customer has been charged ${selectedOrder.chargeAmount?.toFixed(2)}
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            
            {/* Billing Button */}
            {selectedOrder?.billingStatus === 'pending' && (
              <Button
                colorScheme="green"
                onClick={() => markAsBilled(selectedOrder.id)}
                mr={3}
                leftIcon={<span>💳</span>}
              >
                Mark as Charged
              </Button>
            )}
            
            {/* Order Status Buttons */}
            {selectedOrder?.status === 'pending' && (
              <Button
                colorScheme="orange"
                onClick={() => markAsOrdered(selectedOrder.id)}
                isDisabled={!amazonOrderId.trim()}
                leftIcon={<FaCheck />}
                mr={3}
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