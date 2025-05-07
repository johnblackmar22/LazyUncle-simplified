import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import { useAuthStore } from '../store/authStore';
import type { User, UserPreferences } from '../types';

const COLLECTION = 'users';

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  reminderDays: 7,
  defaultCurrency: 'USD',
  theme: 'system',
  notifications: true,
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<User | null> => {
  // In demo mode, create a mock user
  if (DEMO_MODE) {
    return createDemoUser(userId);
  }

  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Create user profile
export const createUserProfile = async (userData: Partial<User>): Promise<User> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, create a mock user
  if (DEMO_MODE) {
    return createDemoUser(user.id, userData);
  }

  try {
    const now = Date.now();
    const newUser: User = {
      id: user.id,
      email: user.email,
      displayName: userData.displayName || user.displayName || user.email.split('@')[0],
      photoURL: userData.photoURL || user.photoURL,
      preferences: userData.preferences || DEFAULT_PREFERENCES,
      createdAt: now,
      lastLoginAt: now,
    };
    
    await setDoc(doc(db, COLLECTION, user.id), newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');

  // In demo mode, update mock user
  if (DEMO_MODE) {
    return updateDemoUser(user.id, data);
  }

  try {
    const updateData = {
      ...data,
      updatedAt: Date.now()
    };
    
    await updateDoc(doc(db, COLLECTION, user.id), updateData);
    
    // Get updated user
    const updatedUser = await getUserProfile(user.id);
    if (!updatedUser) throw new Error('Failed to retrieve updated user');
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Demo mode functions
let demoUser: User | null = null;

const createDemoUser = (userId: string, userData?: Partial<User>): User => {
  if (demoUser && demoUser.id === userId) {
    return demoUser;
  }
  
  const now = Date.now();
  demoUser = {
    id: userId,
    email: userData?.email || 'demo@example.com',
    displayName: userData?.displayName || 'Demo User',
    photoURL: userData?.photoURL || '',
    preferences: userData?.preferences || DEFAULT_PREFERENCES,
    createdAt: now,
    lastLoginAt: now,
  };
  
  return demoUser;
};

const updateDemoUser = (userId: string, data: Partial<User>): User => {
  if (!demoUser || demoUser.id !== userId) {
    return createDemoUser(userId, data);
  }
  
  const updatedPreferences = data.preferences 
    ? { 
        ...demoUser.preferences || DEFAULT_PREFERENCES, 
        ...data.preferences as UserPreferences 
      } 
    : demoUser.preferences;
  
  demoUser = {
    ...demoUser,
    ...data,
    preferences: updatedPreferences
  };
  
  return demoUser;
}; 