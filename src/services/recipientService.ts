import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import { useAuthStore } from '../store/authStore';
import type { Recipient, ImportantDate, RecipientAutoSendPreferences } from '../types';

const COLLECTION = 'recipients';

// Get all recipients for current user
export const getRecipients = async (): Promise<Recipient[]> => {
  const { user } = useAuthStore.getState();
  if (!user) return [];
  
  // In demo mode, return mock recipients
  if (DEMO_MODE) {
    return getMockRecipients(user.id);
  }

  try {
    const q = query(collection(db, COLLECTION), where("userId", "==", user.id));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Recipient));
  } catch (error) {
    console.error('Error getting recipients:', error);
    return [];
  }
};

// Get a single recipient by ID
export const getRecipient = async (id: string): Promise<Recipient | null> => {
  const { user } = useAuthStore.getState();
  if (!user) return null;
  
  // In demo mode, return mock recipient
  if (DEMO_MODE) {
    return getMockRecipient(id);
  }

  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const recipient = { id: docSnap.id, ...docSnap.data() } as Recipient;
      
      // Security check - only return if it belongs to current user
      if (recipient.userId === user.id) {
        return recipient;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting recipient:', error);
    return null;
  }
};

// Add a new recipient
export const addRecipient = async (data: Omit<Recipient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Recipient> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, add mock recipient
  if (DEMO_MODE) {
    return addMockRecipient(user.id, data);
  }

  try {
    const now = Date.now();
    const newRecipient = {
      ...data,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, COLLECTION), newRecipient);
    
    return {
      id: docRef.id,
      ...newRecipient
    } as Recipient;
  } catch (error) {
    console.error('Error adding recipient:', error);
    throw error;
  }
};

// Update a recipient
export const updateRecipient = async (id: string, data: Partial<Recipient>): Promise<Recipient> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, update mock recipient
  if (DEMO_MODE) {
    return updateMockRecipient(id, data);
  }

  try {
    // First verify ownership
    const recipient = await getRecipient(id);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.userId !== user.id) throw new Error('Not authorized to update this recipient');
    
    const updateData = {
      ...data,
      updatedAt: Date.now()
    };
    
    await updateDoc(doc(db, COLLECTION, id), updateData);
    
    // Get updated recipient
    const updatedRecipient = await getRecipient(id);
    if (!updatedRecipient) throw new Error('Failed to retrieve updated recipient');
    
    return updatedRecipient;
  } catch (error) {
    console.error('Error updating recipient:', error);
    throw error;
  }
};

// Delete a recipient
export const deleteRecipient = async (id: string): Promise<void> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, delete mock recipient
  if (DEMO_MODE) {
    deleteMockRecipient(id);
    return;
  }

  try {
    // First verify ownership
    const recipient = await getRecipient(id);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.userId !== user.id) throw new Error('Not authorized to delete this recipient');
    
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting recipient:', error);
    throw error;
  }
};

// Update a recipient's auto-send preferences
export const updateRecipientAutoSendPreferences = async (
  recipientId: string, 
  preferences: Partial<RecipientAutoSendPreferences>
): Promise<Recipient> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, update mock recipient auto-send preferences
  if (DEMO_MODE) {
    return updateMockRecipientAutoSendPreferences(recipientId, preferences);
  }

  try {
    // First get the current recipient
    const recipient = await getRecipient(recipientId);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.userId !== user.id) throw new Error('Not authorized to update this recipient');
    
    // Create or update the auto-send preferences
    const currentPreferences = recipient.autoSendPreferences || {
      enabled: false,
      budget: 0,
      occasions: {
        birthday: false,
        christmas: false,
        anniversary: false,
        custom: []
      },
      lastUpdated: Date.now()
    };
    
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      lastUpdated: Date.now()
    };
    
    // Update the recipient with the new preferences
    return updateRecipient(recipientId, {
      autoSendPreferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating recipient auto-send preferences:', error);
    throw error;
  }
};

// Demo mode implementation
let mockRecipients: Recipient[] = [];

// Generate some sample recipients for demo mode
const generateSampleRecipients = (userId: string): Recipient[] => {
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      userId,
      name: 'John Smith',
      relationship: 'Brother',
      email: 'john@example.com',
      phone: '555-1234',
      interests: ['Gaming', 'Hiking'],
      importantDates: [
        {
          id: 'date-1',
          type: 'birthday',
          date: '1985-06-15'
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sample-2',
      userId,
      name: 'Sarah Johnson',
      relationship: 'Friend',
      email: 'sarah@example.com',
      interests: ['Reading', 'Cooking'],
      importantDates: [
        {
          id: 'date-2',
          type: 'birthday',
          date: '1990-03-22'
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
};

// Mock data functions
const getMockRecipients = (userId: string): Recipient[] => {
  // Initialize with sample data if empty
  if (mockRecipients.length === 0) {
    mockRecipients = generateSampleRecipients(userId);
  }
  
  // Filter by user ID
  return mockRecipients.filter(r => r.userId === userId);
};

const getMockRecipient = (id: string): Recipient | null => {
  const recipient = mockRecipients.find(r => r.id === id);
  return recipient || null;
};

const addMockRecipient = (userId: string, data: Partial<Recipient>): Recipient => {
  const now = Date.now();
  const newRecipient: Recipient = {
    id: `recipient-${Date.now()}`,
    userId,
    name: data.name || '',
    relationship: data.relationship || '',
    email: data.email,
    phone: data.phone,
    address: data.address,
    photoURL: data.photoURL,
    notes: data.notes,
    interests: data.interests || [],
    importantDates: data.importantDates || [],
    createdAt: now,
    updatedAt: now
  };
  
  mockRecipients.push(newRecipient);
  return newRecipient;
};

const updateMockRecipient = (id: string, data: Partial<Recipient>): Recipient => {
  const index = mockRecipients.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Recipient not found');
  
  const now = Date.now();
  mockRecipients[index] = {
    ...mockRecipients[index],
    ...data,
    updatedAt: now
  };
  
  return mockRecipients[index];
};

const deleteMockRecipient = (id: string): void => {
  const index = mockRecipients.findIndex(r => r.id === id);
  if (index !== -1) {
    mockRecipients.splice(index, 1);
  }
};

const updateMockRecipientAutoSendPreferences = (
  id: string, 
  preferences: Partial<RecipientAutoSendPreferences>
): Recipient => {
  const index = mockRecipients.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Recipient not found');
  
  // Create or update the auto-send preferences
  const currentPreferences = mockRecipients[index].autoSendPreferences || {
    enabled: false,
    budget: 0,
    occasions: {
      birthday: false,
      christmas: false,
      anniversary: false,
      custom: []
    },
    lastUpdated: Date.now()
  };
  
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences,
    lastUpdated: Date.now()
  };
  
  // Update the mock recipient
  mockRecipients[index] = {
    ...mockRecipients[index],
    autoSendPreferences: updatedPreferences,
    updatedAt: Date.now()
  };
  
  return mockRecipients[index];
}; 