// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  planId: string; // 'free' | 'pro' | etc.
  createdAt: number;
  updatedAt: number;
}

// Address type
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Auto-send preferences types
export interface AutoSendPreferences {
  enabled: boolean;
  defaultBudget: number;
  requireApproval: boolean;
  shippingAddress?: Address;
  paymentMethod?: {
    type: 'creditCard' | 'paypal' | 'other';
    last4?: string;
    brand?: string;
  };
}

// Recipient types
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthdate?: string; // Format: 'YYYY-MM-DD'
  interests: string[];
  description?: string;
  deliveryAddress?: Address;
  autoSendPreferences?: AutoSendPreferences;
  createdAt: number;
  updatedAt: number;
}

// Occasion type
export interface Occasion {
  id: string;
  recipientId: string;
  userId: string;
  name: string; // e.g., 'Birthday', 'Anniversary', 'Graduation', etc.
  date: string; // Format: 'YYYY-MM-DD' - when the occasion actually happens
  deliveryDate?: string; // Format: 'YYYY-MM-DD' - when to deliver the gift
  type: 'birthday' | 'anniversary' | 'custom' | 'christmas';
  notes?: string;
  budget?: number;
  recurring?: boolean; // Annual repeat
  createdAt: number;
  updatedAt: number;
}

// Gift types - simplified
export interface Gift {
  id: string;
  recipientId: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  occasionId: string;
  date: number; // Timestamp when gift is for
  status: 'idea' | 'selected' | 'ordered' | 'shipped' | 'delivered';
  imageUrl?: string;
  purchaseUrl?: string;
  notes?: string;
  recurring?: boolean;
  createdAt: number;
  updatedAt: number;
}

// Simple gift suggestion type
export interface GiftSuggestion {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  purchaseUrl?: string;
}
