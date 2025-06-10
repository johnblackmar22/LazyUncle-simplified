// Admin Authentication Service - Firebase-based admin authentication
import { signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import type { AdminUser, AdminPermission, AdminSession } from '../types';

class AdminAuthService {
  private static currentAdminSession: AdminSession | null = null;

  // Check if current user is admin
  static isAdmin(): boolean {
    return !!this.currentAdminSession?.user?.role && 
           ['admin', 'super_admin'].includes(this.currentAdminSession.user.role);
  }

  // Require admin access (throws if not admin)
  static requireAdmin(): AdminUser {
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }
    return this.currentAdminSession!.user;
  }

  // Get current admin session
  static getCurrentAdminSession(): AdminSession | null {
    return this.currentAdminSession;
  }

  // Admin login
  static async loginAsAdmin(email: string, password: string): Promise<AdminSession> {
    console.log('🔐 Admin login attempt:', { email });

    try {
      // Firebase admin login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user document to check admin role
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // If user document doesn't exist, create it with admin role for admin@lazyuncle.com
        if (email === 'admin@lazyuncle.com') {
          const adminUserData = {
            email: firebaseUser.email || '',
            displayName: 'Admin User',
            role: 'admin',
            permissions: ['view_orders', 'manage_orders', 'view_analytics'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            planId: 'admin'
          };
          
          await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), adminUserData);
          console.log('✅ Created admin user document');
        } else {
          throw new Error('User account not found');
        }
      }

      // Re-fetch user data after potential creation
      const finalUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      const userData = finalUserDoc.data();
      
      // Verify admin role
      if (!userData?.role || !['admin', 'super_admin'].includes(userData.role)) {
        await signOut(auth); // Sign out non-admin user
        throw new Error('Access denied: Admin role required');
      }

      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData.displayName || 'Admin User',
        photoURL: firebaseUser.photoURL || '',
        planId: userData.planId || 'admin',
        role: userData.role,
        permissions: userData.permissions || this.getDefaultPermissions(userData.role),
        createdAt: userData.createdAt || Date.now(),
        updatedAt: Date.now(),
        lastAdminLogin: Date.now()
      };

      const session: AdminSession = {
        user: adminUser,
        loginTime: Date.now(),
        permissions: adminUser.permissions
      };

      this.currentAdminSession = session;
      
      // Update last admin login time
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        lastAdminLogin: Date.now(),
        updatedAt: Date.now()
      });

      console.log('✅ Firebase admin login successful:', adminUser.role);
      return session;

    } catch (error) {
      console.error('❌ Admin login failed:', error);
      throw error;
    }
  }

  // Admin logout
  static async logoutAdmin(): Promise<void> {
    console.log('🔐 Admin logout');
    
    try {
      await signOut(auth);
      this.currentAdminSession = null;
      console.log('✅ Admin logout successful');
    } catch (error) {
      console.error('❌ Admin logout error:', error);
      throw error;
    }
  }

  // Check if user has specific permission
  static hasPermission(permission: AdminPermission): boolean {
    if (!this.currentAdminSession) return false;
    return this.currentAdminSession.permissions.includes(permission) ||
           this.currentAdminSession.permissions.includes('system_admin');
  }

  // Get default permissions for role
  private static getDefaultPermissions(role: string): AdminPermission[] {
    switch (role) {
      case 'admin':
        return ['view_orders', 'manage_orders', 'view_analytics'];
      case 'super_admin':
        return ['view_orders', 'manage_orders', 'view_users', 'manage_users', 'view_analytics', 'system_admin'];
      default:
        return [];
    }
  }

  // Initialize admin session from current Firebase auth state
  static async initializeAdminSession(): Promise<void> {
    console.log('🔐 Initializing admin session...');
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('No current Firebase user - no admin session');
        return;
      }

      // Check if current user is admin
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
      
      if (!userDoc.exists()) {
        console.log('User document not found - no admin session');
        return;
      }

      const userData = userDoc.data();
      
      if (!userData?.role || !['admin', 'super_admin'].includes(userData.role)) {
        console.log('Current user is not admin - no admin session');
        return;
      }

      // Create admin session
      const adminUser: AdminUser = {
        id: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || userData.displayName || 'Admin User',
        photoURL: currentUser.photoURL || '',
        planId: userData.planId || 'admin',
        role: userData.role,
        permissions: userData.permissions || this.getDefaultPermissions(userData.role),
        createdAt: userData.createdAt || Date.now(),
        updatedAt: Date.now(),
        lastAdminLogin: userData.lastAdminLogin
      };

      const session: AdminSession = {
        user: adminUser,
        loginTime: Date.now(),
        permissions: adminUser.permissions
      };

      this.currentAdminSession = session;
      console.log('✅ Admin session restored for:', adminUser.email);

    } catch (error) {
      console.error('❌ Error initializing admin session:', error);
    }
  }
}

export default AdminAuthService; 