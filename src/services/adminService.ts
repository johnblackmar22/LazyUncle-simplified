// Admin Service - Handles all admin operations via Firebase Firestore
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import { COLLECTIONS } from '../utils/constants';

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
  createdAt?: number;
  updatedAt?: number;
}

// Fallback localStorage key for demo mode
const DEMO_ADMIN_ORDERS_KEY = 'global_admin_orders';

export class AdminService {
  // TODO: Replace with proper admin authentication
  static isAdmin(): boolean {
    // For now, anyone can access admin functions
    // Later: check if user has admin role in Firebase
    return true;
  }

  // Get all admin orders across all users
  static async getAllOrders(): Promise<AdminOrder[]> {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      // In demo mode, fall back to localStorage
      if (DEMO_MODE) {
        console.log('🔧 AdminService: Using demo mode (localStorage)');
        const stored = localStorage.getItem(DEMO_ADMIN_ORDERS_KEY);
        return stored ? JSON.parse(stored) : [];
      }

      // Production mode: Use Firebase Firestore
      console.log('🔧 AdminService: Using Firebase mode');
      const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
      const q = query(ordersRef, orderBy('orderDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure timestamps are converted to numbers
        orderDate: doc.data().orderDate?.toDate?.() ? doc.data().orderDate.toDate().getTime() : doc.data().orderDate,
        createdAt: doc.data().createdAt?.toDate?.() ? doc.data().createdAt.toDate().getTime() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() ? doc.data().updatedAt.toDate().getTime() : doc.data().updatedAt,
      })) as AdminOrder[];

      console.log(`📋 AdminService: Loaded ${orders.length} orders from Firebase`);
      return orders;
    } catch (error) {
      console.error('❌ AdminService: Error loading orders:', error);
      // Fallback to empty array rather than throwing
      return [];
    }
  }

  // Save admin orders (for demo mode only)
  static saveOrders(orders: AdminOrder[]): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    if (DEMO_MODE) {
      try {
        localStorage.setItem(DEMO_ADMIN_ORDERS_KEY, JSON.stringify(orders));
        console.log('💾 AdminService: Saved orders to localStorage (demo mode)');
      } catch (error) {
        console.error('❌ AdminService: Error saving to localStorage:', error);
        throw error;
      }
    } else {
      console.warn('⚠️ AdminService: saveOrders() called in Firebase mode - use individual add/update/delete methods instead');
    }
  }

  // Add a new admin order (called when users select gifts)
  static async addOrder(order: AdminOrder): Promise<void> {
    try {
      // In demo mode, use localStorage
      if (DEMO_MODE) {
        const orders = await this.getAllOrders();
        
        // Remove any existing order for the same gift to prevent duplicates
        const filteredOrders = orders.filter(existingOrder => 
          !(existingOrder.recipientId === order.recipientId && 
            existingOrder.occasionId === order.occasionId && 
            existingOrder.giftName === order.giftName)
        );
        
        filteredOrders.push(order);
        localStorage.setItem(DEMO_ADMIN_ORDERS_KEY, JSON.stringify(filteredOrders));
        
        console.log('📋 AdminService: Added order to localStorage (demo mode):', {
          orderId: order.id,
          customerName: order.customerName,
          giftName: order.giftName,
          totalOrders: filteredOrders.length
        });
        return;
      }

      // Production mode: Save to Firebase Firestore
      const timestamp = Timestamp.now();
      
      // Clean the order data to remove undefined values that Firebase rejects
      const cleanOrderData = Object.fromEntries(
        Object.entries(order).filter(([key, value]) => value !== undefined)
      ) as Omit<AdminOrder, 'id'>;

      const orderWithTimestamps = {
        ...cleanOrderData,
        orderDate: Timestamp.fromMillis(order.orderDate),
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.ADMIN_ORDERS), orderWithTimestamps);
      
      console.log('📋 AdminService: Added order to Firebase:', {
        firestoreId: docRef.id,
        orderId: order.id,
        customerName: order.customerName,
        giftName: order.giftName
      });
    } catch (error) {
      console.error('❌ AdminService: Error adding order:', error);
      throw error;
    }
  }

  // Update an order
  static async updateOrder(orderId: string, updates: Partial<AdminOrder>): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      // In demo mode, use localStorage
      if (DEMO_MODE) {
        const orders = await this.getAllOrders();
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, ...updates } : order
        );
        this.saveOrders(updatedOrders);
        return;
      }

      // Production mode: Update in Firebase Firestore
      const docRef = doc(db, COLLECTIONS.ADMIN_ORDERS, orderId);
      
      // Clean the updates to remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => value !== undefined)
      );

      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: Timestamp.now()
      });

      console.log('✏️ AdminService: Updated order in Firebase:', orderId);
    } catch (error) {
      console.error('❌ AdminService: Error updating order:', error);
      throw error;
    }
  }

  // Delete an order
  static async deleteOrder(orderId: string): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      // In demo mode, use localStorage
      if (DEMO_MODE) {
        const orders = await this.getAllOrders();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        this.saveOrders(filteredOrders);
        return;
      }

      // Production mode: Delete from Firebase Firestore
      await deleteDoc(doc(db, COLLECTIONS.ADMIN_ORDERS, orderId));
      console.log('🗑️ AdminService: Deleted order from Firebase:', orderId);
    } catch (error) {
      console.error('❌ AdminService: Error deleting order:', error);
      throw error;
    }
  }

  // Clear all orders (for testing)
  static async clearAllOrders(): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      // In demo mode, clear localStorage
      if (DEMO_MODE) {
        localStorage.removeItem(DEMO_ADMIN_ORDERS_KEY);
        console.log('🗑️ AdminService: Cleared all orders from localStorage (demo mode)');
        return;
      }

      // Production mode: Delete all documents from Firebase
      const orders = await this.getAllOrders();
      const deletePromises = orders.map(order => deleteDoc(doc(db, COLLECTIONS.ADMIN_ORDERS, order.id)));
      await Promise.all(deletePromises);
      
      console.log('🗑️ AdminService: Cleared all orders from Firebase');
    } catch (error) {
      console.error('❌ AdminService: Error clearing orders:', error);
      throw error;
    }
  }

  // Get statistics
  static getOrderStats() {
    // This will be called by the component, which will handle the async getAllOrders call
    // For now, return empty stats - the component will calculate real stats
    return {
      total: 0,
      pending: 0,
      ordered: 0,
      shipped: 0,
      delivered: 0,
      totalRevenue: 0,
      pendingBilling: 0,
      uniqueCustomers: 0
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