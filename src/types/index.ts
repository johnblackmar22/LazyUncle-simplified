// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  planId: string; // 'free' | 'pro' | etc.
}

// Auto-send preferences types
export type OccasionPreference = {
  enabled: boolean;
  budget: number;
  leadTime: number;
};

export type AutoSendOccasions = {
  birthday?: OccasionPreference;
  christmas?: OccasionPreference;
  anniversary?: OccasionPreference;
  [key: string]: OccasionPreference | undefined;
};

export type PaymentMethod = {
  type: 'creditCard' | 'paypal' | 'other';
  last4?: string;
  brand?: string;
};

export interface AutoSendPreferences {
  enabled: boolean;
  defaultBudget: number;
  requireApproval: boolean;
  occasions: AutoSendOccasions;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
}

// Recipient types
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthdate?: string; // Format: 'YYYY-MM-DD'
  interests: string[];
  giftPreferences?: {
    priceRange?: {
      min: number;
      max: number;
    };
    categories?: string[];
  };
  anniversary?: string; // Format: 'YYYY-MM-DD'
  autoSendPreferences?: AutoSendPreferences;
  occasionIds?: string[]; // List of occasion ids for this recipient
  createdAt: Date | number;
  updatedAt: Date | number;
}

// Address type - keep for future use
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// GiftSuggestion type for recommendations
export interface GiftSuggestion {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  ageRange?: string;
  gender?: string;
  interests?: string[];
  occasion?: string;
  imageUrl?: string;
}

// Occasion type - new first-class entity
export interface Occasion {
  id: string;
  recipientId: string;
  name: string; // e.g., 'Birthday', 'Anniversary', 'Graduation', etc.
  date: string; // Format: 'YYYY-MM-DD'
  type: 'birthday' | 'anniversary' | 'custom';
  notes?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
}

// Gift types - updated to use occasionId
export interface Gift {
  id: string;
  recipientId: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  occasionId: string; // New: link to Occasion entity
  date: Date;
  status: 'planned' | 'ordered' | 'shipped' | 'delivered' | 'given' | 'archived' | 'idea' | 'purchased';
  imageUrl?: string;
  notes?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  autoSend?: boolean; // For test compatibility
} 