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
  description?: string; // Free text description about the recipient and relationship
  deliveryAddress?: Address; // Where to deliver gifts for this recipient
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
  createdAt: number;
  updatedAt: number;
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

// Occasion type - new first-class entity
export interface Occasion {
  id: string;
  recipientId: string;
  userId: string; // Required - Owner's user ID (for security)
  name: string; // e.g., 'Birthday', 'Anniversary', 'Graduation', etc.
  date: string; // Format: 'YYYY-MM-DD' - when the occasion actually happens
  deliveryDate?: string; // Format: 'YYYY-MM-DD' - when to deliver the gift (usually 1 week before)
  type: 'birthday' | 'anniversary' | 'custom' | 'christmas';
  notes?: string;
  budget?: number; // Gift budget for this occasion
  giftWrap?: boolean; // Whether to gift wrap
  personalizedNote?: boolean; // Whether to include a personalized note
  noteText?: string; // Custom note text
  createdAt: number;
  updatedAt: number;
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
  date: number; // Required - Timestamp when gift is for
  status: 'planned' | 'ordered' | 'shipped' | 'delivered' | 'given' | 'archived' | 'idea' | 'purchased';
  imageUrl?: string;
  affiliateLink?: string;
  notes?: string;
  autoSend?: boolean; // For test compatibility
  recurring?: boolean; // Deliver this gift every year
  createdAt: number;
  updatedAt: number;
}

// Gift suggestion/recommendation types
export interface GiftSuggestion {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  affiliateLink?: string;
  score?: number;
  confidence?: number; // Confidence score from 0-1 for AI suggestions
  tags?: string[];
} 