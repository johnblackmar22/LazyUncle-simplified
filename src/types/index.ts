// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
}

// Auto-send types
export interface OccasionPreference {
  enabled: boolean;
  budget: number;
  leadTime: number; // Days before the occasion to send
  lastSent?: Date;
}

export interface RecipientAutoSendPreferences {
  enabled: boolean;
  defaultBudget: number;
  occasions: {
    birthday?: OccasionPreference;
    christmas?: OccasionPreference;
    anniversary?: OccasionPreference;
    custom?: Record<string, OccasionPreference>;
  };
  paymentMethod?: {
    type: 'creditCard' | 'paypal' | 'other';
    details: Record<string, any>;
  };
  shippingAddress?: Address;
  requireApproval: boolean; // Whether to get user approval before sending
}

// Recipient types
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthdate?: Date;
  anniversary?: Date; // Added for auto-send anniversary occasions
  interests: string[];
  giftPreferences?: {
    priceRange?: {
      min: number;
      max: number;
    };
    categories?: string[];
    dislikes?: string[];
  };
  autoSendPreferences?: RecipientAutoSendPreferences;
  specialDates?: SpecialDate[]; // Special dates for custom occasions
  createdAt: Date | number;
  updatedAt: Date | number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SpecialDate {
  id: string;
  name: string;
  date: Date | number;
  recurring: boolean;
  type: 'birthday' | 'anniversary' | 'holiday' | 'other';
}

// Gift types
export interface Gift {
  id: string;
  recipientId: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  occasion: string;
  date: Date;
  status: 'planned' | 'ordered' | 'shipped' | 'delivered' | 'pending_approval' | 'payment_failed' | 'shipping_failed' | 'declined';
  imageUrl?: string;
  notes?: string;
  autoSend?: boolean; // Whether this gift was auto-sent
  paymentId?: string; // Payment reference ID
  shippingId?: string; // Shipping reference ID
  createdAt: Date | number;
  updatedAt: Date | number;
}

// Gift recommendation types
export interface GiftRecommendation {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  affiliateLink?: string;
  score?: number; // Relevance score
} 