// Admin Service - Handles all admin operations
// TODO: Add proper admin authentication and database integration

export interface AdminOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPlan: string;
  recipientName: string;
  recipientAddress: string;
  occasionName: string;
  occasionDate: string;
  giftName: string;
  giftPrice: number;
  giftUrl?: string;
  giftASIN?: string;
  status: 'pending' | 'ordered' | 'shipped' | 'delivered';
  orderDate: number;
  amazonOrderId?: string;
  trackingNumber?: string;
  notes?: string;
  giftWrap: boolean;
  personalNote?: string;
  billingStatus: 'pending' | 'charged' | 'refunded';
  chargeAmount?: number;
  source?: 'gift_selection' | 'auto_send' | 'manual';
  recipientId?: string;
  occasionId?: string;
}

const GLOBAL_ADMIN_ORDERS_KEY = 'global_admin_orders';

export class AdminService {
  // TODO: Replace with proper admin authentication
  static isAdmin(): boolean {
    // For now, anyone can access admin functions
    // Later: check if user has admin role in database
    return true;
  }

  // Get all admin orders across all users
  static getAllOrders(): AdminOrder[] {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const stored = localStorage.getItem(GLOBAL_ADMIN_ORDERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading admin orders:', error);
      return [];
    }
  }

  // Save admin orders
  static saveOrders(orders: AdminOrder[]): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      localStorage.setItem(GLOBAL_ADMIN_ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving admin orders:', error);
      throw error;
    }
  }

  // Add a new admin order (called when users select gifts)
  static addOrder(order: AdminOrder): void {
    try {
      const orders = this.getAllOrders();
      
      // Remove any existing order for the same gift to prevent duplicates
      const filteredOrders = orders.filter(existingOrder => 
        !(existingOrder.recipientId === order.recipientId && 
          existingOrder.occasionId === order.occasionId && 
          existingOrder.giftName === order.giftName)
      );
      
      filteredOrders.push(order);
      
      // Store globally (bypassing admin check for user gift selection)
      localStorage.setItem(GLOBAL_ADMIN_ORDERS_KEY, JSON.stringify(filteredOrders));
      
      console.log('📋 Added order to global admin queue:', {
        orderId: order.id,
        customerName: order.customerName,
        giftName: order.giftName,
        totalOrders: filteredOrders.length
      });
    } catch (error) {
      console.error('Error adding admin order:', error);
      throw error;
    }
  }

  // Update an order
  static updateOrder(orderId: string, updates: Partial<AdminOrder>): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const orders = this.getAllOrders();
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      );
      this.saveOrders(updatedOrders);
    } catch (error) {
      console.error('Error updating admin order:', error);
      throw error;
    }
  }

  // Delete an order
  static deleteOrder(orderId: string): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const orders = this.getAllOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      this.saveOrders(filteredOrders);
    } catch (error) {
      console.error('Error deleting admin order:', error);
      throw error;
    }
  }

  // Clear all orders (for testing)
  static clearAllOrders(): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      localStorage.removeItem(GLOBAL_ADMIN_ORDERS_KEY);
      console.log('🗑️ Cleared all global admin orders');
    } catch (error) {
      console.error('Error clearing admin orders:', error);
      throw error;
    }
  }

  // Get statistics
  static getOrderStats() {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    const orders = this.getAllOrders();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      ordered: orders.filter(o => o.status === 'ordered').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, order) => sum + order.giftPrice, 0),
      pendingBilling: orders.filter(o => o.billingStatus === 'pending').length,
      uniqueCustomers: new Set(orders.map(o => o.customerId)).size
    };
  }
}

// TODO: Future admin authentication structure
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'read_only';
  permissions: string[];
  createdAt: number;
  lastLogin?: number;
}

export interface AdminAuthService {
  // Future methods for admin authentication:
  // login(email: string, password: string): Promise<AdminUser>
  // logout(): void
  // getCurrentAdmin(): AdminUser | null
  // hasPermission(permission: string): boolean
  // createAdminUser(data: Partial<AdminUser>): Promise<AdminUser>
} 