// Admin Service - Firebase-based admin order management
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import { updateGift } from './giftService';
import type { AdminOrder } from '../types';

class AdminService {
  // Check if current user is admin
  private static async requireAdmin(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Admin access required - not authenticated');
    }

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('Admin access required - user not found');
    }

    const userData = userDoc.data();
    if (!userData?.role || !['admin', 'super_admin'].includes(userData.role)) {
      throw new Error('Admin access required - insufficient permissions');
    }
  }

  // Extract Gift ID from order notes (format: "Gift ID: {id} | ...")
  private static extractGiftId(notes: string): string | null {
    const match = notes.match(/Gift ID: ([^|]+)/);
    return match ? match[1].trim() : null;
  }

  // Update linked Gift status when order status changes
  private static async updateLinkedGiftStatus(orderId: string, newStatus: AdminOrder['status']): Promise<void> {
    try {
      // Get the order to extract gift ID
      const orderDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_ORDERS, orderId));
      if (!orderDoc.exists()) return;

      const orderData = orderDoc.data() as AdminOrder;
      const giftId = this.extractGiftId(orderData.notes || '');
      
      if (giftId) {
        // Map order status to gift status
        let giftStatus: 'idea' | 'selected' | 'ordered' | 'shipped' | 'delivered';
        switch (newStatus) {
          case 'pending':
          case 'processing':
            giftStatus = 'selected';
            break;
          case 'ordered':
            giftStatus = 'ordered';
            break;
          case 'shipped':
            giftStatus = 'shipped';
            break;
          case 'delivered':
            giftStatus = 'delivered';
            break;
          default:
            giftStatus = 'selected';
        }

        console.log(`🔗 Updating linked Gift ${giftId} status to: ${giftStatus}`);
        await updateGift(giftId, { status: giftStatus });
      }
    } catch (error) {
      console.error('❌ Error updating linked gift status:', error);
      // Don't throw - this is a secondary operation
    }
  }

  // Get all orders (admin only)
  static async getAllOrders(): Promise<AdminOrder[]> {
    console.log('📊 Admin fetching all orders...');
    
    try {
      // Require admin access
      await this.requireAdmin();
      
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
      // Remove undefined fields (especially giftUrl, imageUrl, etc.)
      const sanitizedOrder: Record<string, any> = { ...orderData };
      Object.keys(sanitizedOrder).forEach(key => {
        if (sanitizedOrder[key] === undefined) {
          delete sanitizedOrder[key];
        }
      });
      // Add to Firebase
      const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
      const docRef = await addDoc(ordersRef, sanitizedOrder);
      
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
      await this.requireAdmin();

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Update in Firebase
      const orderRef = doc(db, COLLECTIONS.ADMIN_ORDERS, orderId);
      await updateDoc(orderRef, updateData);
      
      // Update linked gift status if order status changed
      if (updates.status) {
        await this.updateLinkedGiftStatus(orderId, updates.status);
      }
      
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
      await this.requireAdmin();

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
      await this.requireAdmin();

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
      await this.requireAdmin();

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

  // Delete order(s) by Gift ID (used when undoing a gift selection)
  static async deleteOrderByGiftId(giftId: string): Promise<void> {
    const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
    const q = query(ordersRef, where('notes', '>=', `Gift ID: ${giftId}`), where('notes', '<=', `Gift ID: ${giftId}\uf8ff`));
    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(docSnap.ref);
      console.log(`🗑️ Deleted admin order for Gift ID: ${giftId}`);
    }
  }

  // Delete all orders for a given user and occasion (used when deleting an occasion)
  static async deleteOrdersByOccasion(userId: string, occasion: string): Promise<void> {
    const ordersRef = collection(db, COLLECTIONS.ADMIN_ORDERS);
    const q = query(ordersRef, where('userId', '==', userId), where('occasion', '==', occasion));
    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(docSnap.ref);
      console.log(`🗑️ Deleted admin order for occasion: ${occasion}`);
    }
  }
}

export default AdminService; 