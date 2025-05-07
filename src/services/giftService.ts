import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import { useAuthStore } from '../store/authStore';
import type { Gift, GiftSuggestion } from '../types';

const COLLECTION = 'gifts';

// Get all gifts for the current user
export const getGifts = async (): Promise<Gift[]> => {
  const { user } = useAuthStore.getState();
  if (!user) return [];
  
  // In demo mode, return mock gifts
  if (DEMO_MODE) {
    return getMockGifts(user.id);
  }

  try {
    const q = query(
      collection(db, COLLECTION), 
      where("userId", "==", user.id),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gift));
  } catch (error) {
    console.error('Error getting gifts:', error);
    return [];
  }
};

// Get gifts for a specific recipient
export const getGiftsByRecipient = async (recipientId: string): Promise<Gift[]> => {
  const { user } = useAuthStore.getState();
  if (!user) return [];
  
  // In demo mode, return mock gifts for this recipient
  if (DEMO_MODE) {
    return getMockGiftsByRecipient(user.id, recipientId);
  }

  try {
    const q = query(
      collection(db, COLLECTION), 
      where("userId", "==", user.id),
      where("recipientId", "==", recipientId),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gift));
  } catch (error) {
    console.error('Error getting gifts for recipient:', error);
    return [];
  }
};

// Get gifts that are scheduled for auto-send
export const getAutoSendGifts = async (): Promise<Gift[]> => {
  const { user } = useAuthStore.getState();
  if (!user) return [];
  
  // In demo mode, return mock auto-send gifts
  if (DEMO_MODE) {
    return getMockAutoSendGifts(user.id);
  }

  try {
    const q = query(
      collection(db, COLLECTION), 
      where("userId", "==", user.id),
      where("autoSend", "==", true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gift));
  } catch (error) {
    console.error('Error getting auto-send gifts:', error);
    return [];
  }
};

// Get a single gift by ID
export const getGift = async (id: string): Promise<Gift | null> => {
  const { user } = useAuthStore.getState();
  if (!user) return null;
  
  // In demo mode, return mock gift
  if (DEMO_MODE) {
    return getMockGift(id);
  }

  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const gift = { id: docSnap.id, ...docSnap.data() } as Gift;
      
      // Security check - only return if it belongs to current user
      if (gift.userId === user.id) {
        return gift;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting gift:', error);
    return null;
  }
};

// Add a new gift
export const addGift = async (data: Omit<Gift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Gift> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, add mock gift
  if (DEMO_MODE) {
    return addMockGift(user.id, data);
  }

  try {
    const now = Date.now();
    const newGift = {
      ...data,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, COLLECTION), newGift);
    
    return {
      id: docRef.id,
      ...newGift
    } as Gift;
  } catch (error) {
    console.error('Error adding gift:', error);
    throw error;
  }
};

// Update a gift
export const updateGift = async (id: string, data: Partial<Gift>): Promise<Gift> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, update mock gift
  if (DEMO_MODE) {
    return updateMockGift(id, data);
  }

  try {
    // First verify ownership
    const gift = await getGift(id);
    if (!gift) throw new Error('Gift not found');
    if (gift.userId !== user.id) throw new Error('Not authorized to update this gift');
    
    const updateData = {
      ...data,
      updatedAt: Date.now()
    };
    
    await updateDoc(doc(db, COLLECTION, id), updateData);
    
    // Get updated gift
    const updatedGift = await getGift(id);
    if (!updatedGift) throw new Error('Failed to retrieve updated gift');
    
    return updatedGift;
  } catch (error) {
    console.error('Error updating gift:', error);
    throw error;
  }
};

// Delete a gift
export const deleteGift = async (id: string): Promise<void> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  // In demo mode, delete mock gift
  if (DEMO_MODE) {
    deleteMockGift(id);
    return;
  }

  try {
    // First verify ownership
    const gift = await getGift(id);
    if (!gift) throw new Error('Gift not found');
    if (gift.userId !== user.id) throw new Error('Not authorized to delete this gift');
    
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting gift:', error);
    throw error;
  }
};

// Schedule a gift for auto-send
export const scheduleAutoSend = async (id: string, sendDate: string): Promise<Gift> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  try {
    // Update the gift with auto-send data
    return await updateGift(id, {
      autoSend: true,
      autoSendDate: sendDate,
      autoSendStatus: 'scheduled'
    });
  } catch (error) {
    console.error('Error scheduling gift for auto-send:', error);
    throw error;
  }
};

// Cancel auto-send for a gift
export const cancelAutoSend = async (id: string): Promise<Gift> => {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');
  
  try {
    // Update the gift to cancel auto-send
    return await updateGift(id, {
      autoSend: false,
      autoSendStatus: 'cancelled'
    });
  } catch (error) {
    console.error('Error cancelling auto-send:', error);
    throw error;
  }
};

// Get gift suggestions based on recipient interests
export const getGiftSuggestions = async (recipientId: string): Promise<GiftSuggestion[]> => {
  const { user } = useAuthStore.getState();
  if (!user) return [];
  
  // In demo mode, return mock gift suggestions
  if (DEMO_MODE) {
    return getMockGiftSuggestions(recipientId);
  }
  
  // In a real app, we'd call an API to get suggestions
  // For now, return mock data
  return getMockGiftSuggestions(recipientId);
};

// Demo mode implementation
let mockGifts: Gift[] = [];

// Generate sample gifts for demo mode
const generateSampleGifts = (userId: string): Gift[] => {
  const now = Date.now();
  
  return [
    {
      id: 'gift-1',
      userId,
      recipientId: 'sample-1', // John Smith
      name: 'PS5 Console',
      description: 'PlayStation 5 Digital Edition',
      price: 399.99,
      currency: 'USD',
      status: 'idea',
      imageURL: 'https://example.com/ps5.jpg',
      category: 'gaming',
      url: 'https://www.amazon.com/PlayStation-5-Digital/dp/B08FC6MR62',
      retailer: 'Amazon',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'gift-2',
      userId,
      recipientId: 'sample-1', // John Smith
      name: 'Hiking Backpack',
      description: 'Waterproof hiking backpack with hydration system',
      price: 89.99,
      currency: 'USD',
      status: 'purchased',
      occasion: 'Birthday',
      date: '2023-06-15',
      category: 'outdoors',
      createdAt: now - 1000000,
      updatedAt: now - 1000000
    },
    {
      id: 'gift-3',
      userId,
      recipientId: 'sample-2', // Sarah Johnson
      name: 'Cooking Masterclass Subscription',
      description: '1-year subscription to online cooking classes',
      price: 180,
      currency: 'USD',
      status: 'idea',
      category: 'classes',
      url: 'https://www.masterclass.com',
      retailer: 'MasterClass',
      autoSend: true,
      autoSendDate: '2023-03-15',
      autoSendStatus: 'scheduled',
      createdAt: now - 2000000,
      updatedAt: now - 500000
    },
    {
      id: 'gift-4',
      userId,
      recipientId: 'sample-2', // Sarah Johnson
      name: 'Book: The Midnight Library',
      description: 'Novel by Matt Haig',
      price: 14.99,
      currency: 'USD',
      status: 'given',
      occasion: 'Christmas',
      date: '2022-12-25',
      category: 'books',
      createdAt: now - 3000000,
      updatedAt: now - 3000000
    }
  ];
};

// Mock gift suggestions
const mockGiftSuggestions: {[key: string]: GiftSuggestion[]} = {
  'sample-1': [
    {
      id: 'suggestion-1',
      name: 'Hiking GPS Watch',
      description: 'GPS watch with trail maps and fitness tracking',
      price: 349.99,
      currency: 'USD',
      imageURL: 'https://example.com/gps-watch.jpg',
      url: 'https://www.rei.com/product/watch',
      retailer: 'REI',
      category: 'outdoors',
      matchScore: 95,
      available: true
    },
    {
      id: 'suggestion-2',
      name: 'Gaming Headset',
      description: 'Wireless gaming headset with noise cancellation',
      price: 149.99,
      currency: 'USD',
      imageURL: 'https://example.com/headset.jpg',
      url: 'https://www.bestbuy.com/headset',
      retailer: 'Best Buy',
      category: 'gaming',
      matchScore: 90,
      available: true
    },
    {
      id: 'suggestion-3',
      name: 'National Parks Pass',
      description: 'Annual pass to all US National Parks',
      price: 80,
      currency: 'USD',
      imageURL: 'https://example.com/parks-pass.jpg',
      url: 'https://www.nps.gov/planyourvisit/passes.htm',
      retailer: 'National Park Service',
      category: 'outdoors',
      matchScore: 87,
      available: true
    }
  ],
  'sample-2': [
    {
      id: 'suggestion-4',
      name: 'Gourmet Cooking Set',
      description: 'Professional-grade cooking tools set',
      price: 199.99,
      currency: 'USD',
      imageURL: 'https://example.com/cooking-set.jpg',
      url: 'https://www.williams-sonoma.com/cookingset',
      retailer: 'Williams Sonoma',
      category: 'cooking',
      matchScore: 98,
      available: true
    },
    {
      id: 'suggestion-5',
      name: 'Book Club Subscription',
      description: 'Monthly delivery of best-selling books',
      price: 19.99,
      currency: 'USD',
      imageURL: 'https://example.com/book-club.jpg',
      url: 'https://www.bookofthemonth.com',
      retailer: 'Book of the Month',
      category: 'books',
      matchScore: 93,
      available: true
    },
    {
      id: 'suggestion-6',
      name: 'Cookbook Collection',
      description: 'Set of 3 bestselling cookbooks',
      price: 65,
      currency: 'USD',
      imageURL: 'https://example.com/cookbooks.jpg',
      url: 'https://www.amazon.com/cookbooks',
      retailer: 'Amazon',
      category: 'books',
      matchScore: 89,
      available: true
    }
  ]
};

// Mock data functions
const getMockGifts = (userId: string): Gift[] => {
  // Initialize with sample data if empty
  if (mockGifts.length === 0) {
    mockGifts = generateSampleGifts(userId);
  }
  
  // Filter by user ID
  return mockGifts.filter(g => g.userId === userId);
};

const getMockGiftsByRecipient = (userId: string, recipientId: string): Gift[] => {
  // Initialize with sample data if empty
  if (mockGifts.length === 0) {
    mockGifts = generateSampleGifts(userId);
  }
  
  // Filter by user ID and recipient ID
  return mockGifts.filter(g => g.userId === userId && g.recipientId === recipientId);
};

const getMockAutoSendGifts = (userId: string): Gift[] => {
  // Initialize with sample data if empty
  if (mockGifts.length === 0) {
    mockGifts = generateSampleGifts(userId);
  }
  
  // Filter by user ID and auto-send flag
  return mockGifts.filter(g => g.userId === userId && g.autoSend === true);
};

const getMockGift = (id: string): Gift | null => {
  const gift = mockGifts.find(g => g.id === id);
  return gift || null;
};

const addMockGift = (userId: string, data: Partial<Gift>): Gift => {
  const now = Date.now();
  const newGift: Gift = {
    id: `gift-${Date.now()}`,
    userId,
    recipientId: data.recipientId || '',
    name: data.name || '',
    description: data.description,
    price: data.price,
    currency: data.currency || 'USD',
    status: data.status || 'idea',
    occasion: data.occasion,
    date: data.date,
    imageURL: data.imageURL,
    url: data.url,
    retailer: data.retailer,
    category: data.category,
    rating: data.rating,
    autoSend: data.autoSend || false,
    autoSendDate: data.autoSendDate,
    autoSendStatus: data.autoSendStatus,
    createdAt: now,
    updatedAt: now
  };
  
  mockGifts.push(newGift);
  return newGift;
};

const updateMockGift = (id: string, data: Partial<Gift>): Gift => {
  const index = mockGifts.findIndex(g => g.id === id);
  if (index === -1) throw new Error('Gift not found');
  
  const now = Date.now();
  mockGifts[index] = {
    ...mockGifts[index],
    ...data,
    updatedAt: now
  };
  
  return mockGifts[index];
};

const deleteMockGift = (id: string): void => {
  const index = mockGifts.findIndex(g => g.id === id);
  if (index !== -1) {
    mockGifts.splice(index, 1);
  }
};

const getMockGiftSuggestions = (recipientId: string): GiftSuggestion[] => {
  // Return predefined suggestions for this recipient or empty array
  return mockGiftSuggestions[recipientId] || [];
}; 