import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import AdminOrderDashboard from '../../pages/AdminOrderDashboard';
import AdminService from '../../services/adminService';
import type { AdminOrder } from '../../types';

// Mock Firebase and AdminService
jest.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'admin-user' } },
  db: {},
}));

jest.mock('../../services/adminService');
const mockAdminService = AdminService as jest.Mocked<typeof AdminService>;

// Mock Firestore functions
const mockQuerySnapshot = {
  forEach: jest.fn()
};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  query: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ role: 'admin' })
  })),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((_, format) => {
    if (format === 'MMM dd, yyyy') {
      return 'Jun 15, 2025';
    }
    return '2025-06-15';
  }),
}));

// Helper to wrap component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ChakraProvider>
  );
};

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock auth store
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'admin-user',
      email: 'admin@test.com',
      displayName: 'Admin User',
      role: 'admin',
    },
  }),
}));

describe('AdminOrderDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock empty data by default
    mockAdminService.getAllOrders.mockResolvedValue([]);
    mockQuerySnapshot.forEach.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('renders dashboard header', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByRole('heading', { name: /🎁 Admin Dashboard/i })).toBeInTheDocument();
    });

    it('displays stats cards', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByText('👥 Total Users')).toBeInTheDocument();
      expect(screen.getByText('👤 Recipients')).toBeInTheDocument();
      expect(screen.getByText('📅 Occasions')).toBeInTheDocument();
      expect(screen.getByText('🎁 Gifts')).toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    const mockOrders: AdminOrder[] = [
      {
        id: 'order-1',
        userId: 'user-1',
        userEmail: 'jane@example.com',
        userName: 'Jane Smith',
        recipientName: 'John Doe',
        recipientRelationship: 'Brother',
        recipientAddress: '123 Main St, City, ST 12345',
        occasion: 'Birthday',
        occasionId: 'occasion-1',
        occasionDate: '2025-06-15',
        giftTitle: 'Wireless Headphones',
        giftDescription: 'Great wireless headphones',
        giftPrice: 79.99,
        giftImageUrl: '',
        asin: 'B08TEST123',
        status: 'pending',
        priority: 'normal',
        notes: 'User selected gift',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'City',
          state: 'ST',
          zipCode: '12345',
          country: 'US',
        },
        source: 'gift_selection',
        giftWrap: true,
        personalNote: 'Happy Birthday!',
      },
    ];

    beforeEach(() => {
      mockAdminService.getAllOrders.mockResolvedValue(mockOrders);
    });

    it('displays orders in table format', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('→ John Doe')).toBeInTheDocument();
        expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
        // Use getAllByText for price that appears multiple times
        const priceElements = screen.getAllByText('$79.99');
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });

    it('shows correct status badges', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    it('displays ASIN information', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        // Use getAllByText since ASIN appears in multiple places
        const asinElements = screen.getAllByText('ASIN: B08TEST123');
        expect(asinElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Order Modal Interactions', () => {
    const mockOrder: AdminOrder = {
      id: 'order-1',
      userId: 'user-1',
      userEmail: 'jane@example.com',
      userName: 'Jane Smith',
      recipientName: 'John Doe',
      recipientRelationship: 'Brother',
      recipientAddress: '123 Main St, City, ST 12345',
      occasion: 'Birthday',
      occasionId: 'occasion-1',
      occasionDate: '2025-06-15',
      giftTitle: 'Wireless Headphones',
      giftDescription: 'Great wireless headphones',
      giftPrice: 79.99,
      giftImageUrl: '',
      asin: 'B08TEST123',
      status: 'pending',
      priority: 'normal',
      notes: 'User selected gift',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'City',
        state: 'ST',
        zipCode: '12345',
        country: 'US',
      },
      source: 'gift_selection',
      giftWrap: true,
      personalNote: 'Happy Birthday!',
    };

    beforeEach(() => {
      mockAdminService.getAllOrders.mockResolvedValue([mockOrder]);
    });

    it('opens modal when view details button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab first
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        const viewButton = screen.getByLabelText('View details');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Order Details')).toBeInTheDocument();
      });
    });

    it('displays complete order information in modal', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab first
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        const viewButton = screen.getByLabelText('View details');
        fireEvent.click(viewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Order Details')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith (jane@example.com)')).toBeInTheDocument();
        // Check for gift price in modal - use getAllByText since price appears multiple times
        const priceElements = screen.getAllByText(/\$79\.99/);
        expect(priceElements.length).toBeGreaterThan(0);
        // Use getAllByText for ASIN that appears multiple times
        const asinElements = screen.getAllByText('ASIN: B08TEST123');
        expect(asinElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    const mockOrder: AdminOrder = {
      id: 'order-a11y',
      userId: 'user-1',
      userEmail: 'jane@example.com',
      userName: 'Jane Smith',
      recipientName: 'John Doe',
      recipientRelationship: 'Brother',
      recipientAddress: '123 Main St, City, ST 12345',
      occasion: 'Birthday',
      occasionId: 'occasion-1',
      occasionDate: '2025-06-15',
      giftTitle: 'Wireless Headphones',
      giftDescription: 'Great wireless headphones',
      giftPrice: 79.99,
      giftImageUrl: '',
      asin: 'B08TEST123',
      status: 'pending',
      priority: 'normal',
      notes: 'User selected gift',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'City',
        state: 'ST',
        zipCode: '12345',
        country: 'US',
      },
      source: 'gift_selection',
      giftWrap: false,
    };

    beforeEach(() => {
      mockAdminService.getAllOrders.mockResolvedValue([mockOrder]);
    });

    it('has proper heading structure', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByRole('heading', { level: 2, name: /🎁 Admin Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /User Journey Overview/i })).toBeInTheDocument();
    });

    it('provides proper table structure when orders exist', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Click on Orders tab to reveal the table
      const ordersTab = screen.getByRole('tab', { name: /Orders/ });
      fireEvent.click(ordersTab);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Date/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Customer → Recipient/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Gift & ASIN/i })).toBeInTheDocument();
      });
    });
  });
}); 