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
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import AdminAuthService from './adminAuthService';
import type { AdminOrder } from '../types';

class AdminService {
  // Get all orders (admin only)
  static async getAllOrders(): Promise<AdminOrder[]> {
    console.log('📊 Admin fetching all orders...');
    
    try {
      // Require admin access
      AdminAuthService.requireAdmin();
      
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

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
        updatedAt: Timestamp.now()
      };

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