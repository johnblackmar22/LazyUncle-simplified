import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import AdminOrderDashboard from '../../pages/AdminOrderDashboard';

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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('AdminOrderDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('renders dashboard header with emoji', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByRole('heading', { name: /🧙‍♂️ Admin Order Dashboard/i })).toBeInTheDocument();
    });

    it('displays empty state when no orders exist', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByText('No orders yet. Try adding a mock order to test!')).toBeInTheDocument();
    });

    it('shows zero counts in stats cards', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByText('0')).toBeInTheDocument(); // Pending count
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
      expect(screen.getByText('Ordered on Amazon')).toBeInTheDocument();
    });

    it('displays add mock order button for testing', () => {
      renderWithProviders(<AdminOrderDashboard />);
      expect(screen.getByRole('button', { name: /Add Mock Order \(Testing\)/i })).toBeInTheDocument();
    });
  });

  describe('Mock Order Generation', () => {
    it('creates a mock order when button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const addMockButton = screen.getByRole('button', { name: /Add Mock Order \(Testing\)/i });
      fireEvent.click(addMockButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'admin_pending_orders',
          expect.stringContaining('Jane Smith')
        );
      });
    });

    it('generates order with required fields', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const addMockButton = screen.getByRole('button', { name: /Add Mock Order \(Testing\)/i });
      fireEvent.click(addMockButton);

      await waitFor(() => {
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        const order = savedData[0];
        
        expect(order).toMatchObject({
          customerId: expect.any(String),
          customerName: 'Jane Smith',
          customerEmail: 'jane.smith@example.com',
          customerPlan: 'Premium',
          recipientName: 'John Doe',
          occasionName: 'Birthday',
          giftName: 'Wireless Bluetooth Headphones',
          giftPrice: 79.99,
          giftASIN: 'B08EXAMPLE123',
          status: 'pending',
          billingStatus: 'pending',
          chargeAmount: 79.99,
        });
      });
    });
  });

  describe('Order Display', () => {
    const mockOrders = [
      {
        id: 'order-1',
        customerId: 'customer-1',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPlan: 'Premium',
        recipientName: 'John Doe',
        recipientAddress: '123 Main St, City, ST 12345',
        occasionName: 'Birthday',
        occasionDate: '2025-06-15',
        giftName: 'Wireless Headphones',
        giftPrice: 79.99,
        giftASIN: 'B08TEST123',
        status: 'pending' as const,
        orderDate: Date.now(),
        billingStatus: 'pending' as const,
        chargeAmount: 79.99,
        giftWrap: true,
      },
      {
        id: 'order-2',
        customerId: 'customer-2',
        customerName: 'Bob Wilson',
        customerEmail: 'bob@example.com',
        customerPlan: 'Basic',
        recipientName: 'Alice Johnson',
        recipientAddress: '456 Oak Ave, Town, ST 67890',
        occasionName: 'Anniversary',
        occasionDate: '2025-07-20',
        giftName: 'Coffee Maker',
        giftPrice: 120.00,
        giftASIN: 'B08COFFEE1',
        status: 'ordered' as const,
        orderDate: Date.now(),
        amazonOrderId: 'AMZ-123456',
        billingStatus: 'charged' as const,
        chargeAmount: 120.00,
        giftWrap: false,
      }
    ];

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockOrders));
    });

    it('displays orders in table format', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('→ John Doe')).toBeInTheDocument();
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
      expect(screen.getByText('$79.99')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const pendingBadges = screen.getAllByText('PENDING');
      const orderedBadges = screen.getAllByText('ORDERED');
      
      expect(pendingBadges.length).toBeGreaterThan(0);
      expect(orderedBadges.length).toBeGreaterThan(0);
    });

    it('displays ASIN information with Amazon links', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByText('ASIN: B08TEST123')).toBeInTheDocument();
      expect(screen.getByText('ASIN: B08COFFEE1')).toBeInTheDocument();
      
      const amazonLinks = screen.getAllByText('View on Amazon');
      expect(amazonLinks).toHaveLength(2);
    });

    it('shows billing status correctly', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const pendingBadges = screen.getAllByText('PENDING');
      const chargedBadges = screen.getAllByText('CHARGED');
      
      expect(pendingBadges.length).toBeGreaterThan(0);
      expect(chargedBadges.length).toBeGreaterThan(0);
    });

    it('updates pending count display', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Look specifically for the pending orders count in the stats section
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
      // Check there's at least one pending order showing
      const pendingCards = screen.getAllByText('1');
      expect(pendingCards.length).toBeGreaterThan(0);
    });

    it('shows stats for pending orders', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Look specifically for the new "Selected Gifts Pending Order" text
      expect(screen.getByText('Selected Gifts Pending Order')).toBeInTheDocument();
      // Check there's at least one pending gift showing
      const pendingCards = screen.getAllByText('1');
      expect(pendingCards.length).toBeGreaterThan(0);
    });

    it('shows warning alert for pending orders', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByText(/You have 1 selected gift\(s\) that need to be ordered on Amazon/)).toBeInTheDocument();
    });
  });

  describe('Order Modal Interactions', () => {
    const mockOrder = {
      id: 'order-1',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPlan: 'Premium',
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, ST 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Headphones',
      giftPrice: 79.99,
      giftASIN: 'B08TEST123',
      status: 'pending' as const,
      orderDate: Date.now(),
      billingStatus: 'pending' as const,
      chargeAmount: 79.99,
      giftWrap: true,
      personalNote: 'Happy Birthday!',
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockOrder]));
    });

    it('opens modal when view details button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Order Details - John Doe')).toBeInTheDocument();
      });
    });

    it('displays complete order information in modal', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Order Details - John Doe')).toBeInTheDocument();
      });

      // Check for customer information - use getAllByText since name appears in both table and modal
      const janeSmithElements = screen.getAllByText('Jane Smith');
      expect(janeSmithElements.length).toBeGreaterThan(0);
      
      const emailElements = screen.getAllByText('jane@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
      
      // Check for gift details
      expect(screen.getByText(/Wireless Headphones.*\$79\.99/)).toBeInTheDocument();
      expect(screen.getByText('ASIN: B08TEST123')).toBeInTheDocument();
      
      // Check for recipient information
      expect(screen.getByText('→ John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City, ST 12345')).toBeInTheDocument();
    });

    it('shows gift wrap indicator when enabled', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Gift wrap requested')).toBeInTheDocument();
      });
    });

    it('displays personal note when provided', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Personal Note:')).toBeInTheDocument();
        expect(screen.getByText('"Happy Birthday!"')).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Management', () => {
    const pendingOrder = {
      id: 'order-pending',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPlan: 'Premium',
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, ST 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Headphones',
      giftPrice: 79.99,
      giftASIN: 'B08TEST123',
      status: 'pending' as const,
      orderDate: Date.now(),
      billingStatus: 'pending' as const,
      chargeAmount: 79.99,
      giftWrap: true,
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([pendingOrder]));
    });

    it('allows marking pending order as ordered', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Open modal
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('🛒 Ready to order on Amazon:')).toBeInTheDocument();
      });

      // Fill in Amazon Order ID
      const orderIdInput = screen.getByPlaceholderText('Amazon Order ID (after ordering)');
      await userEvent.type(orderIdInput, 'AMZ-123456789');

      // Mark as ordered
      const markOrderedButton = screen.getByRole('button', { name: /Mark as Ordered/i });
      fireEvent.click(markOrderedButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'admin_pending_orders',
          expect.stringContaining('AMZ-123456789')
        );
      });
    });

    it('requires Amazon Order ID to mark as ordered', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const markOrderedButton = screen.getByRole('button', { name: /Mark as Ordered/i });
        expect(markOrderedButton).toBeDisabled();
      });
    });

    it('enables mark as ordered button when Amazon Order ID is provided', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const orderIdInput = screen.getByPlaceholderText('Amazon Order ID (after ordering)');
        const markOrderedButton = screen.getByRole('button', { name: /Mark as Ordered/i });
        
        expect(markOrderedButton).toBeDisabled();
        
        fireEvent.change(orderIdInput, { target: { value: 'AMZ-123456' } });
        expect(markOrderedButton).not.toBeDisabled();
      });
    });
  });

  describe('Billing Management', () => {
    const orderNeedingBilling = {
      id: 'order-billing',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPlan: 'Premium',
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, ST 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Headphones',
      giftPrice: 79.99,
      status: 'pending' as const,
      orderDate: Date.now(),
      billingStatus: 'pending' as const,
      chargeAmount: 79.99,
      giftWrap: false,
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([orderNeedingBilling]));
    });

    it('shows billing section for pending billing status', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Order Details - John Doe')).toBeInTheDocument();
      });

      // Check for billing section - look for key billing elements
      expect(screen.getByText(/Billing Required/)).toBeInTheDocument();
      const janeSmithElements = screen.getAllByText('Jane Smith');
      const priceElements = screen.getAllByText('$79.99');
      expect(janeSmithElements.length).toBeGreaterThan(0);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('allows marking billing as charged', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const markChargedButton = screen.getByRole('button', { name: /Mark as Charged/i });
        fireEvent.click(markChargedButton);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'admin_pending_orders',
          expect.stringContaining('"billingStatus":"charged"')
        );
      });
    });

    it('accepts billing notes', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const billingNotesInput = screen.getByPlaceholderText('Billing notes (optional)');
        fireEvent.change(billingNotesInput, { target: { value: 'Charged to credit card ending in 1234' } });
        
        const markChargedButton = screen.getByRole('button', { name: /Mark as Charged/i });
        fireEvent.click(markChargedButton);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'admin_pending_orders',
          expect.stringContaining('Charged to credit card ending in 1234')
        );
      });
    });
  });

  describe('Copy to Clipboard', () => {
    const orderWithDetails = {
      id: 'order-copy',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPlan: 'Premium',
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, ST 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Headphones',
      giftPrice: 79.99,
      giftASIN: 'B08TEST123',
      status: 'pending' as const,
      orderDate: Date.now(),
      billingStatus: 'pending' as const,
      chargeAmount: 79.99,
      personalNote: 'Happy Birthday!',
      giftWrap: false,
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([orderWithDetails]));
    });

    it('copies ASIN to clipboard when copy button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const copyASINButton = screen.getByLabelText('Copy ASIN');
        fireEvent.click(copyASINButton);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('B08TEST123');
      });
    });

    it('copies address to clipboard when copy button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const copyAddressButton = screen.getByLabelText('Copy address');
        fireEvent.click(copyAddressButton);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123 Main St, City, ST 12345');
      });
    });

    it('copies personal note to clipboard when copy button is clicked', async () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      const viewButton = screen.getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        const copyNoteButton = screen.getByLabelText('Copy note');
        fireEvent.click(copyNoteButton);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Happy Birthday!');
      });
    });
  });

  describe('Accessibility', () => {
    const mockOrder = {
      id: 'order-a11y',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPlan: 'Premium',
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, ST 12345',
      occasionName: 'Birthday',
      occasionDate: '2025-06-15',
      giftName: 'Wireless Headphones',
      giftPrice: 79.99,
      giftASIN: 'B08TEST123',
      status: 'pending' as const,
      orderDate: Date.now(),
      billingStatus: 'pending' as const,
      chargeAmount: 79.99,
      giftWrap: false,
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockOrder]));
    });

    it('provides proper aria-labels for action buttons', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByLabelText('View details')).toBeInTheDocument();
      expect(screen.getByLabelText('Mark as ordered')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      // Check for h2 headings as that's what the component actually uses
      expect(screen.getByRole('heading', { level: 2, name: /🧙‍♂️ Admin Order Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Selected Gifts from Users/i })).toBeInTheDocument();
    });

    it('provides proper table structure', () => {
      renderWithProviders(<AdminOrderDashboard />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Select/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Order Date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Customer → Recipient/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Gift & ASIN/i })).toBeInTheDocument();
    });
  });
}); 