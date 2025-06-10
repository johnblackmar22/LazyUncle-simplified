// Admin Authentication Service - Dedicated admin login and role management
import { signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, DEMO_MODE } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import type { AdminUser, AdminPermission, AdminSession } from '../types';

// Admin credentials for demo/testing
const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@lazyuncle.com',
  password: 'admin123',
  user: {
    id: 'admin-user',
    email: 'admin@lazyuncle.com',
    displayName: 'Admin User',
    photoURL: '',
    planId: 'admin',
    role: 'admin' as const,
    permissions: ['view_orders', 'manage_orders', 'view_analytics'] as AdminPermission[],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastAdminLogin: Date.now()
  } as AdminUser
};

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
    console.log('🔐 Admin login attempt:', { email, demoMode: DEMO_MODE });

    try {
      // Demo mode admin login
      if (DEMO_MODE) {
        if (email === DEMO_ADMIN_CREDENTIALS.email && password === DEMO_ADMIN_CREDENTIALS.password) {
          const session: AdminSession = {
            user: DEMO_ADMIN_CREDENTIALS.user,
            loginTime: Date.now(),
            permissions: DEMO_ADMIN_CREDENTIALS.user.permissions
          };
          this.currentAdminSession = session;
          console.log('✅ Demo admin login successful');
          return session;
        } else {
          throw new Error('Invalid admin credentials for demo mode');
        }
      }

      // Production Firebase admin login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user document to check admin role
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      
      // Verify admin role
      if (!userData.role || !['admin', 'super_admin'].includes(userData.role)) {
        throw new Error('Access denied: Admin role required');
      }

      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData.displayName || '',
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
      if (!DEMO_MODE) {
        await auth.signOut();
      }
      
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

  // Initialize admin session from stored auth (for page refresh)
  static async initializeAdminSession(): Promise<void> {
    console.log('🔐 Initializing admin session...');
    
    if (DEMO_MODE) {
      // Check for stored demo admin session
      const stored = localStorage.getItem('admin_session');
      if (stored) {
        try {
          this.currentAdminSession = JSON.parse(stored);
          console.log('✅ Demo admin session restored');
        } catch (error) {
          console.warn('Failed to restore demo admin session:', error);
        }
      }
      return;
    }

    // For Firebase mode, admin state will be managed through Firebase auth state
    // This would be called when Firebase auth state changes
  }
}

export default AdminAuthService; 