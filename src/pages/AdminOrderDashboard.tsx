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
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  InputGroup,
  InputLeftElement,
  Stack,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { 
  FaShoppingCart, 
  FaCheck, 
  FaTruck, 
  FaEye, 
  FaCopy, 
  FaCheckDouble, 
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
  FaChevronDown,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import { format } from 'date-fns';
import { AdminService, type AdminOrder } from '../services/adminService';

interface PendingOrder extends AdminOrder {}

type SortField = 'orderDate' | 'giftPrice' | 'customerName' | 'recipientName' | 'occasionDate';
type SortDirection = 'asc' | 'desc';

const AdminOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  
  // Enhanced filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load pending orders from localStorage/Firebase
  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = () => {
    // Load from AdminService to see ALL users' selected gifts
    try {
      const orders = AdminService.getAllOrders();
      console.log('📋 Loaded global admin orders via AdminService:', orders);
      setOrders(orders);
    } catch (error) {
      console.error('❌ Error loading admin orders:', error);
      setOrders([]);
    }
  };

  const saveOrders = (updatedOrders: PendingOrder[]) => {
    try {
      AdminService.saveOrders(updatedOrders);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('❌ Error saving admin orders:', error);
    }
  };

  // Enhanced filtering logic
  const filteredOrders = orders.filter(order => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchLower) ||
        order.recipientName.toLowerCase().includes(searchLower) ||
        order.giftName.toLowerCase().includes(searchLower) ||
        order.occasionName.toLowerCase().includes(searchLower) ||
        order.giftASIN?.toLowerCase().includes(searchLower) ||
        order.customerEmail.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    // Billing filter
    if (billingFilter !== 'all' && order.billingStatus !== billingFilter) return false;
    
    return true;
  });

  // Enhanced sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortField) {
      case 'orderDate':
        aValue = a.orderDate;
        bValue = b.orderDate;
        break;
      case 'giftPrice':
        aValue = a.giftPrice;
        bValue = b.giftPrice;
        break;
      case 'customerName':
        aValue = a.customerName.toLowerCase();
        bValue = b.customerName.toLowerCase();
        break;
      case 'recipientName':
        aValue = a.recipientName.toLowerCase();
        bValue = b.recipientName.toLowerCase();
        break;
      case 'occasionDate':
        aValue = new Date(a.occasionDate).getTime();
        bValue = new Date(b.occasionDate).getTime();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const deleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        AdminService.deleteOrder(orderId);
        loadPendingOrders(); // Reload from AdminService
        console.log('🗑️ Deleted order via AdminService:', orderId);
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
      source: 'manual'
    };
    
    const updatedOrders = [...orders, mockOrder];
    saveOrders(updatedOrders);
  };

  const pendingCount = sortedOrders.filter(o => o.status === 'pending').length;
  const orderedCount = sortedOrders.filter(o => o.status === 'ordered').length;
  const deliveredCount = sortedOrders.filter(o => o.status === 'delivered').length;
  const totalRevenue = sortedOrders.reduce((total, order) => total + order.giftPrice, 0);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    const pendingOrderIds = sortedOrders.filter(o => o.status === 'pending').map(o => o.id);
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBillingFilter('all');
    setSortField('orderDate');
    setSortDirection('desc');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">🧙‍♂️ Global Admin Order Dashboard</Heading>
            <Text color="gray.600" fontSize="sm">
              View and manage selected gifts from ALL users across the platform
            </Text>
            <Badge colorScheme="purple" size="sm">
              Admin View: {AdminService.getOrderStats().uniqueCustomers} Customers • {orders.length} Total Orders
            </Badge>
          </VStack>
          <Spacer />
          <HStack spacing={3}>
            <Button onClick={generateMockOrder} colorScheme="blue" size="sm" variant="outline">
              Add Mock Order
            </Button>
            <Button onClick={loadPendingOrders} colorScheme="green" size="sm" variant="outline">
              Refresh Orders
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Selected Gifts Pending Order</StatLabel>
                <StatNumber color="red.500">{pendingCount}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Orders Placed</StatLabel>
                <StatNumber color="yellow.500">{orderedCount}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Orders Delivered</StatLabel>
                <StatNumber color="green.500">{deliveredCount}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber color="blue.500">${totalRevenue.toFixed(2)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Showing Results</StatLabel>
                <StatNumber>{sortedOrders.length} of {orders.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {pendingCount > 0 && (
          <Alert status="warning">
            <AlertIcon />
            You have {pendingCount} selected gift(s) that need to be ordered on Amazon!
          </Alert>
        )}

        {/* Enhanced Filters and Search */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">🔍 Search & Filter</Text>
                <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </HStack>
              
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <FaSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search customers, recipients, gifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select 
                  maxW="200px" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </Select>
                
                <Select 
                  maxW="200px" 
                  value={billingFilter} 
                  onChange={(e) => setBillingFilter(e.target.value)}
                >
                  <option value="all">All Billing</option>
                  <option value="pending">Billing Pending</option>
                  <option value="charged">Charged</option>
                  <option value="refunded">Refunded</option>
                </Select>
                
                <Menu>
                  <MenuButton as={Button} rightIcon={<FaChevronDown />} variant="outline" maxW="200px">
                    Sort: {sortField} {sortDirection === 'asc' ? '↑' : '↓'}
                  </MenuButton>
                  <MenuList>
                    {(['orderDate', 'giftPrice', 'customerName', 'recipientName', 'occasionDate'] as SortField[]).map(field => (
                      <MenuItem key={field} onClick={() => handleSort(field)}>
                        {field === 'orderDate' && 'Order Date'}
                        {field === 'giftPrice' && 'Gift Price'}
                        {field === 'customerName' && 'Customer Name'}
                        {field === 'recipientName' && 'Recipient Name'}
                        {field === 'occasionDate' && 'Occasion Date'}
                        {sortField === field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Stack>
              
              {(searchTerm || statusFilter !== 'all' || billingFilter !== 'all') && (
                <Text fontSize="sm" color="gray.600">
                  Showing {sortedOrders.length} of {orders.length} orders
                  {searchTerm && ` matching "${searchTerm}"`}
                  {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                  {billingFilter !== 'all' && ` with billing "${billingFilter}"`}
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Bulk Actions */}
        {sortedOrders.filter(o => o.status === 'pending').length > 1 && (
          <Card>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">🔧 Bulk Actions</Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedOrderIds.length} of {sortedOrders.filter(o => o.status === 'pending').length} pending orders selected
                  </Text>
                </HStack>
                
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    onClick={toggleSelectAll}
                    variant="outline"
                  >
                    {selectedOrderIds.length === sortedOrders.filter(o => o.status === 'pending').length ? 'Deselect All' : 'Select All Pending'}
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
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="md">Selected Gifts from Users</Heading>
                <Text fontSize="sm" color="gray.600">
                  When users select gifts, they appear here for you to order from Amazon
                </Text>
              </VStack>
              {sortedOrders.length > 0 && (
                <Text fontSize="sm" color="gray.500">
                  Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
                </Text>
              )}
            </HStack>
          </CardHeader>
          <CardBody>
            {sortedOrders.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.length === sortedOrders.filter(o => o.status === 'pending').length && sortedOrders.filter(o => o.status === 'pending').length > 0}
                          onChange={toggleSelectAll}
                          style={{ marginRight: '8px' }}
                        />
                        Select
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('orderDate')}>
                        Order Date {sortField === 'orderDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('customerName')}>
                        Customer → Recipient {sortField === 'customerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th>Gift & ASIN</Th>
                      <Th cursor="pointer" onClick={() => handleSort('giftPrice')}>
                        Price {sortField === 'giftPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('occasionDate')}>
                        Occasion {sortField === 'occasionDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th>Status</Th>
                      <Th>Billing</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedOrders.map((order) => (
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
                            {order.source && (
                              <Badge size="xs" colorScheme="gray">
                                {order.source === 'gift_selection' && 'User Selected'}
                                {order.source === 'auto_send' && 'Auto Send'}
                                {order.source === 'manual' && 'Manual'}
                              </Badge>
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
                            <Tooltip label="Delete Order">
                              <IconButton
                                aria-label="Delete order"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => deleteOrder(order.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" mb={4}>
                  {orders.length === 0 
                    ? "No orders yet. Selected gifts will appear here automatically!"
                    : "No orders match your current filters. Try adjusting your search criteria."
                  }
                </Text>
                {orders.length === 0 && (
                  <Button onClick={generateMockOrder} colorScheme="blue" size="sm">
                    Add Mock Order for Testing
                  </Button>
                )}
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
                <Text fontSize="sm">Filtered/Sorted orders:</Text>
                <Badge colorScheme="green">{sortedOrders.length}</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm">localStorage key:</Text>
                <Text fontSize="xs" fontFamily="mono">global_admin_orders</Text>
              </HStack>
              
              <Button
                size="sm"
                onClick={() => {
                  try {
                    const orders = AdminService.getAllOrders();
                    const stats = AdminService.getOrderStats();
                    console.log('🔍 AdminService Orders:', orders);
                    console.log('📊 AdminService Stats:', stats);
                    console.log('🔍 Current filters:', { searchTerm, statusFilter, billingFilter, sortField, sortDirection });
                    console.log('📊 Filtered orders:', sortedOrders);
                  } catch (error) {
                    console.error('❌ Error accessing AdminService:', error);
                  }
                }}
                variant="outline"
              >
                Check Admin Console
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  console.log('🔄 Reloading orders via AdminService...');
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
                  if (window.confirm('Are you sure you want to clear ALL admin orders? This will remove orders from ALL users!')) {
                    try {
                      AdminService.clearAllOrders();
                      setOrders([]);
                      console.log('🗑️ Cleared all global admin orders via AdminService');
                    } catch (error) {
                      console.error('❌ Error clearing orders:', error);
                    }
                  }
                }}
                colorScheme="red"
                variant="outline"
              >
                Clear ALL Orders
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

                    {selectedOrder.source && (
                      <Badge colorScheme="purple" size="sm">
                        Source: {selectedOrder.source === 'gift_selection' && 'User Selected'}
                        {selectedOrder.source === 'auto_send' && 'Auto Send'}
                        {selectedOrder.source === 'manual' && 'Manual'}
                      </Badge>
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

                {selectedOrder.notes && (
                  <Box>
                    <Text fontWeight="bold">Order Notes:</Text>
                    <Text fontSize="sm" color="gray.600">{selectedOrder.notes}</Text>
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
                    <Textarea
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      size="sm"
                      rows={3}
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