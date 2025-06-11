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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { 
  FaShoppingCart, 
  FaCheck, 
  FaTruck, 
  FaEye, 
  FaCopy, 
  FaSearch,
  FaSync,
  FaUsers,
  FaUserFriends,
  FaCalendarAlt,
  FaGift
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import AdminService from '../services/adminService';
import { useAuthStore } from '../store/authStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../utils/constants';
import type { AdminOrder, User, Recipient, Occasion, Gift } from '../types';

const AdminOrderDashboard: React.FC = () => {
  const { user } = useAuthStore();
  
  // Data state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [amazonOrderId, setAmazonOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load all data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch orders
        const ordersData = await AdminService.getAllOrders();
        setOrders(ordersData);

        // Fetch users
        const usersRef = collection(db, COLLECTIONS.USERS);
        const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData: User[] = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
          } as User);
        });
        setUsers(usersData);

        // Fetch recipients
        const recipientsRef = collection(db, COLLECTIONS.RECIPIENTS);
        const recipientsQuery = query(recipientsRef, orderBy('createdAt', 'desc'));
        const recipientsSnapshot = await getDocs(recipientsQuery);
        const recipientsData: Recipient[] = [];
        recipientsSnapshot.forEach((doc) => {
          const data = doc.data();
          recipientsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
          } as Recipient);
        });
        setRecipients(recipientsData);

        // Fetch occasions
        const occasionsRef = collection(db, COLLECTIONS.OCCASIONS);
        const occasionsQuery = query(occasionsRef, orderBy('date', 'desc'));
        const occasionsSnapshot = await getDocs(occasionsQuery);
        const occasionsData: Occasion[] = [];
        occasionsSnapshot.forEach((doc) => {
          const data = doc.data();
          occasionsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
          } as Occasion);
        });
        setOccasions(occasionsData);

        // Fetch gifts
        const giftsRef = collection(db, COLLECTIONS.GIFTS);
        const giftsQuery = query(giftsRef, orderBy('createdAt', 'desc'));
        const giftsSnapshot = await getDocs(giftsQuery);
        const giftsData: Gift[] = [];
        giftsSnapshot.forEach((doc) => {
          const data = doc.data();
          giftsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
          } as Gift);
        });
        setGifts(giftsData);

        console.log('🔍 Admin Dashboard - All data loaded:', {
          orders: ordersData.length,
          users: usersData.length,
          recipients: recipientsData.length,
          occasions: occasionsData.length,
          gifts: giftsData.length
        });
      } catch (error) {
        console.error('❌ Error fetching admin data:', error);
      }
    };

    fetchAllData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshAllData = async () => {
    try {
      const ordersData = await AdminService.getAllOrders();
      console.log('🔄 Refreshing all admin data');
      setOrders(ordersData);
      // TODO: Refresh other data too
    } catch (error) {
      console.error('❌ Error refreshing admin data:', error);
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
      
      await refreshAllData();
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
      
      await refreshAllData();
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
        await refreshAllData();
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
    totalUsers: users.length,
    totalRecipients: recipients.length,
    totalOccasions: occasions.length,
    totalGifts: gifts.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    orderedItems: orders.filter(o => o.status === 'ordered').length,
    shippedItems: orders.filter(o => o.status === 'shipped').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.giftPrice, 0),
  };

  // Get user by ID helper
  const getUserById = (userId: string) => users.find(u => u.id === userId);
  const getRecipientsByUserId = (userId: string) => recipients.filter(r => r.userId === userId);
  const getOccasionsByRecipientId = (recipientId: string) => occasions.filter(o => o.recipientId === recipientId);
  const getGiftsByOccasionId = (occasionId: string) => gifts.filter(g => g.occasionId === occasionId);

  return (
    <Container maxW="full" p={4}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="purple.600">
            🎁 Admin Dashboard
          </Heading>
          <Text color="gray.600">
            Welcome back, {user?.displayName}
          </Text>
          <Badge colorScheme="purple" size="sm">
            {stats.totalUsers} Users • {stats.totalOrders} Orders
          </Badge>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<FaSync />}
            onClick={refreshAllData}
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
              <StatLabel>👥 Total Users</StatLabel>
              <StatNumber>{stats.totalUsers}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>👤 Recipients</StatLabel>
              <StatNumber>{stats.totalRecipients}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>📅 Occasions</StatLabel>
              <StatNumber>{stats.totalOccasions}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>🎁 Gifts</StatLabel>
              <StatNumber>{stats.totalGifts}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>📦 Pending Orders</StatLabel>
              <StatNumber color="red.500">{stats.pendingOrders}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>💰 Total Revenue</StatLabel>
              <StatNumber>${stats.totalRevenue.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Main Dashboard Tabs */}
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab><FaUsers /> &nbsp; Users & Workflow</Tab>
          <Tab><FaShoppingCart /> &nbsp; Orders ({stats.pendingOrders} pending)</Tab>
        </TabList>

        <TabPanels>
          {/* Users & Workflow Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">User Journey Overview</Heading>
                <Text color="gray.600" fontSize="sm">See the complete customer workflow</Text>
              </CardHeader>
              <CardBody>
                {users.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    No users found yet.
                  </Alert>
                ) : (
                  <Accordion allowMultiple>
                    {users.map((userItem) => {
                      const userRecipients = getRecipientsByUserId(userItem.id);
                      return (
                        <AccordionItem key={userItem.id}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack>
                                <Avatar size="sm" name={userItem.displayName} />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">{userItem.displayName}</Text>
                                  <Text fontSize="sm" color="gray.600">{userItem.email}</Text>
                                </VStack>
                                <Spacer />
                                <Badge colorScheme="blue">{userRecipients.length} recipients</Badge>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={4}>
                              {userRecipients.length === 0 ? (
                                <Text color="gray.500" fontStyle="italic">No recipients added yet</Text>
                              ) : (
                                userRecipients.map((recipient) => {
                                  const recipientOccasions = getOccasionsByRecipientId(recipient.id);
                                  return (
                                    <Box key={recipient.id} p={4} border="1px" borderColor="gray.200" borderRadius="md">
                                      <HStack justify="space-between" mb={2}>
                                        <VStack align="start" spacing={0}>
                                          <Text fontWeight="bold">👤 {recipient.name}</Text>
                                          <Text fontSize="sm" color="gray.600">{recipient.relationship}</Text>
                                        </VStack>
                                        <Badge colorScheme="green">{recipientOccasions.length} occasions</Badge>
                                      </HStack>
                                      
                                      {recipientOccasions.length === 0 ? (
                                        <Text color="gray.500" fontSize="sm" fontStyle="italic">No occasions set up</Text>
                                      ) : (
                                        <VStack align="stretch" spacing={2}>
                                          {recipientOccasions.map((occasion) => {
                                            const occasionGifts = getGiftsByOccasionId(occasion.id);
                                            return (
                                              <Box key={occasion.id} p={3} bg="gray.50" borderRadius="md">
                                                <HStack justify="space-between" mb={1}>
                                                  <Text fontWeight="medium">📅 {occasion.name}</Text>
                                                  <Text fontSize="sm" color="gray.600">
                                                    {format(parseISO(occasion.date), 'MMM dd, yyyy')}
                                                  </Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                  <Text fontSize="sm" color="gray.600">
                                                    Budget: ${occasion.budget || 'Not set'}
                                                  </Text>
                                                  <Badge colorScheme="purple">{occasionGifts.length} gifts</Badge>
                                                </HStack>
                                                
                                                {occasionGifts.length > 0 && (
                                                  <VStack align="stretch" spacing={1} mt={2}>
                                                    {occasionGifts.map((gift) => (
                                                      <HStack key={gift.id} justify="space-between" p={2} bg="white" borderRadius="sm">
                                                        <Text fontSize="sm">🎁 {gift.name}</Text>
                                                        <HStack>
                                                          <Badge colorScheme={getStatusColor(gift.status)}>{gift.status}</Badge>
                                                          <Text fontSize="sm">${gift.price}</Text>
                                                        </HStack>
                                                      </HStack>
                                                    ))}
                                                  </VStack>
                                                )}
                                              </Box>
                                            );
                                          })}
                                        </VStack>
                                      )}
                                    </Box>
                                  );
                                })
                              )}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel>
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
          </TabPanel>
        </TabPanels>
      </Tabs>

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