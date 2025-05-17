// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
}

// Recipient types
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthdate?: Date;
  interests: string[];
  giftPreferences?: {
    priceRange?: {
      min: number;
      max: number;
    };
    categories?: string[];
  };
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

// Gift types - simplified
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
  status: 'planned' | 'ordered' | 'shipped' | 'delivered';
  imageUrl?: string;
  notes?: string;
  createdAt: Date | number;
  updatedAt: Date | number;
} 