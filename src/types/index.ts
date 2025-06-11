// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  planId: string; // 'free' | 'pro' | etc.
  role?: 'user' | 'admin' | 'super_admin';
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

// Recipient types - simplified
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthdate?: string; // Format: 'YYYY-MM-DD'
  gender?: 'male' | 'female' | 'other';
  interests: string[];
  description?: string;
  deliveryAddress?: Address;
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
  type: 'birthday' | 'custom' | 'christmas';
  notes?: string;
  budget?: number;
  recurring?: boolean; // Annual repeat
  giftWrap?: boolean; // Whether to include gift wrapping
  personalizedNote?: boolean; // Whether to include a personalized note
  noteText?: string; // Text for the personalized note
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
  asin?: string; // Amazon ASIN for easy ordering
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
  asin?: string; // Amazon ASIN for easy ordering
}

// Admin order interface for gift selection workflow
export interface AdminOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPlan?: string;
  recipientName: string;
  recipientRelationship: string;
  recipientAddress?: string;
  occasion: string;
  occasionId?: string;
  occasionDate?: string;
  giftTitle: string;
  giftDescription: string;
  giftPrice: number;
  giftImageUrl: string;
  giftUrl?: string;  // Generic product URL
  asin?: string;
  status: 'pending' | 'processing' | 'ordered' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string;
  createdAt: number;
  updatedAt: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  amazonOrderId?: string;
  billingStatus?: 'pending' | 'charged' | 'refunded';
  chargeAmount?: number;
  source?: 'gift_selection' | 'auto_send' | 'manual';
  giftWrap?: boolean;
  personalNote?: string;
}
