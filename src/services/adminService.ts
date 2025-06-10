// Admin Service - Firebase-based admin order management with proper authentication
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import AdminAuthService from './adminAuthService';
import type { AdminOrder } from '../types';

// Demo data for testing
const DEMO_ORDERS: AdminOrder[] = [
  {
    id: 'demo-order-1',
    userId: 'demo-user-1',
    userEmail: 'test@example.com',
    userName: 'Test User',
    recipientName: 'Mom',
    recipientRelationship: 'Mother',
    occasion: 'Birthday',
    giftTitle: 'Premium Coffee Set',
    giftDescription: 'High-quality coffee beans and accessories',
    giftPrice: 45.99,
    giftImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    asin: 'B08XYZ123',
    status: 'pending',
    priority: 'normal',
    notes: '',
    createdAt: Date.now() - 86400000, // Yesterday
    updatedAt: Date.now() - 86400000,
    shippingAddress: {
      name: 'Test User',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US'
    }
  }
];

class AdminService {
  // Get all orders (admin only)
  static async getAllOrders(): Promise<AdminOrder[]> {
    console.log('📊 Admin fetching all orders...');
    
    try {
      // Require admin access
      AdminAuthService.requireAdmin();
      
      if (DEMO_MODE) {
        console.log('✅ Demo mode: returning sample orders');
        return [...DEMO_ORDERS];
      }

      // Fetch from Firebase
      const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const orders: AdminOrder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
        } as AdminOrder);
      });

      console.log(`✅ Retrieved ${orders.length} admin orders from Firebase`);
      return orders;

    } catch (error) {
      console.error('❌ Error fetching admin orders:', error);
      throw error;
    }
  }

  // Add new order (called when user selects gift)
  static async addOrder(order: Omit<AdminOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('➕ Adding new admin order:', order.giftTitle);
    
    try {
      const orderData = {
        ...order,
        createdAt: DEMO_MODE ? Date.now() : Timestamp.now(),
        updatedAt: DEMO_MODE ? Date.now() : Timestamp.now()
      };

      if (DEMO_MODE) {
        // Add to demo data
        const newOrder: AdminOrder = {
          id: `demo-${Date.now()}`,
          ...order,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        DEMO_ORDERS.unshift(newOrder);
        console.log('✅ Demo order added');
        return newOrder.id;
      }

      // Add to Firebase
      const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
      const docRef = await addDoc(ordersRef, orderData);
      
      console.log('✅ Admin order added to Firebase:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Error adding admin order:', error);
      throw error;
    }
  }

  // Update order (admin only)
  static async updateOrder(orderId: string, updates: Partial<AdminOrder>): Promise<void> {
    console.log('📝 Updating admin order:', orderId);
    
    try {
      // Require admin access
      AdminAuthService.requireAdmin();

      const updateData = {
        ...updates,
        updatedAt: DEMO_MODE ? Date.now() : Timestamp.now()
      };

      if (DEMO_MODE) {
        // Update demo data
        const index = DEMO_ORDERS.findIndex(order => order.id === orderId);
        if (index !== -1) {
          DEMO_ORDERS[index] = { ...DEMO_ORDERS[index], ...updateData, updatedAt: Date.now() };
          console.log('✅ Demo order updated');
        }
        return;
      }

      // Update in Firebase
      const orderRef = doc(db, COLLECTIONS.ADMIN_ORDERS, orderId);
      await updateDoc(orderRef, updateData);
      
      console.log('✅ Admin order updated in Firebase');

    } catch (error) {
      console.error('❌ Error updating admin order:', error);
      throw error;
    }
  }

  // Delete order (admin only)
  static async deleteOrder(orderId: string): Promise<void> {
    console.log('🗑️ Deleting admin order:', orderId);
    
    try {
      // Require admin access
      AdminAuthService.requireAdmin();

      if (DEMO_MODE) {
        // Remove from demo data
        const index = DEMO_ORDERS.findIndex(order => order.id === orderId);
        if (index !== -1) {
          DEMO_ORDERS.splice(index, 1);
          console.log('✅ Demo order deleted');
        }
        return;
      }

      // Delete from Firebase
      const orderRef = doc(db, COLLECTIONS.ADMIN_ORDERS, orderId);
      await deleteDoc(orderRef);
      
      console.log('✅ Admin order deleted from Firebase');

    } catch (error) {
      console.error('❌ Error deleting admin order:', error);
      throw error;
    }
  }

  // Get orders by status (admin only)
  static async getOrdersByStatus(status: AdminOrder['status']): Promise<AdminOrder[]> {
    console.log('📊 Fetching orders by status:', status);
    
    try {
      // Require admin access
      AdminAuthService.requireAdmin();

      if (DEMO_MODE) {
        return DEMO_ORDERS.filter(order => order.status === status);
      }

      const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
      const q = query(
        ordersRef, 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const orders: AdminOrder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now()
        } as AdminOrder);
      });

      console.log(`✅ Retrieved ${orders.length} ${status} orders`);
      return orders;

    } catch (error) {
      console.error('❌ Error fetching orders by status:', error);
      throw error;
    }
  }

  // Get statistics (admin only)
  static async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    ordered: number;
    delivered: number;
    cancelled: number;
  }> {
    try {
      // Require admin access
      AdminAuthService.requireAdmin();

      const orders = await this.getAllOrders();
      
      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        ordered: orders.filter(o => o.status === 'ordered').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };
    } catch (error) {
      console.error('❌ Error fetching order stats:', error);
      throw error;
    }
  }
}

export default AdminService; 