# LazyUncle-Simplified Data Architecture

> **Updated**: This document reflects the simplified data architecture for the "set-it-and-forget-it" approach.

## Core Philosophy

LazyUncle-Simplified focuses on **minimal user input** and **maximum automation**. The data structure is designed to support:
- Quick recipient setup
- Simple occasion management  
- Automated gift recommendations
- Streamlined gift ordering

## Core Entities

### 1. User
```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  planId: string; // 'free' | 'pro'
  createdAt: number;
  updatedAt: number;
}
```

### 2. Recipient (Core Entity)
```typescript
interface Recipient {
  id: string;
  userId: string;
  name: string;
  relationship: string;         // "Sister", "Mom", "Friend"
  birthdate?: string;          // 'YYYY-MM-DD'
  interests: string[];         // ["coffee", "books", "travel"]
  description?: string;        // Free text about them
  deliveryAddress?: Address;   // Where to send gifts
  autoSendPreferences?: AutoSendPreferences;
  createdAt: number;
  updatedAt: number;
}
```

### 3. Occasion (New Core Entity)
```typescript
interface Occasion {
  id: string;
  recipientId: string;
  userId: string;
  name: string;               // "Birthday", "Christmas", "Anniversary"
  date: string;               // 'YYYY-MM-DD'
  deliveryDate?: string;      // When to deliver (before occasion)
  type: 'birthday' | 'anniversary' | 'custom' | 'christmas';
  notes?: string;
  budget?: number;            // Gift budget
  recurring?: boolean;        // Annual repeat
  createdAt: number;
  updatedAt: number;
}
```

### 4. Gift (Simplified)
```typescript
interface Gift {
  id: string;
  recipientId: string;
  userId: string;
  name: string;
  description?: string;
  price: number;              // in cents
  category: string;
  occasionId: string;         // Links to specific occasion
  date: number;               // Timestamp
  status: 'idea' | 'selected' | 'ordered' | 'shipped' | 'delivered';
  imageUrl?: string;
  purchaseUrl?: string;
  notes?: string;
  
  // Simple metadata
  isAIGenerated?: boolean;
  aiMetadata?: {
    confidence?: number;
    reasoning?: string;
    tags?: string[];
  };
  
  createdAt: number;
  updatedAt: number;
}
```

## Supporting Types

### Address
```typescript
interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### AutoSendPreferences (Future Feature)
```typescript
interface AutoSendPreferences {
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
```

## Data Relationships

```
User (1) ──→ (many) Recipient
Recipient (1) ──→ (many) Occasion  
Occasion (1) ──→ (many) Gift
```

## Storage Strategy

### Primary Storage: Firebase Firestore
- **Production**: Real-time sync across devices
- **Offline**: Local caching for offline use
- **Security**: Row-level security by userId

### Development Storage: localStorage
- **Demo Mode**: Full app functionality without Firebase
- **Testing**: Fast development and testing
- **Fallback**: Graceful degradation if Firebase unavailable

### Collections Structure
```
/users/{userId}
/recipients/{recipientId} 
/occasions/{occasionId}
/gifts/{giftId}
```

## Key Design Decisions

### 1. Occasion-Centric Architecture
- **Why**: Occasions are the core planning unit ("Birthday 2024", "Christmas 2024")
- **Benefit**: Clear organization and recurring event support
- **Example**: Same birthday can have different years, budgets, and gifts

### 2. Minimal Required Fields
- **Why**: Reduces user friction during setup
- **Required**: name, relationship, userId
- **Optional**: Almost everything else
- **Benefit**: Users can start immediately, add details later

### 3. Simple Status Workflow
- **Status Flow**: `idea → selected → ordered → shipped → delivered`
- **Why**: Clear, linear progression that users understand
- **Automation**: Status updates can be automated via integrations

### 4. Flexible Budget System
- **Per-Occasion**: Each occasion can have its own budget
- **Optional**: Not required, users can add if desired
- **Smart Defaults**: System can suggest budgets based on relationship

## Migration Strategy

### From Complex to Simple
The previous complex AI system has been simplified:
- ❌ **Removed**: Complex AI recommendation engine
- ❌ **Removed**: Multiple recommendation strategies  
- ❌ **Removed**: Advanced personalization metadata
- ✅ **Kept**: Core gift selection and persistence
- ✅ **Simplified**: Basic AI metadata for future use

### Backward Compatibility
- Legacy types preserved temporarily for migration
- Gradual cleanup of unused fields
- Data migration scripts for existing users

## Performance Considerations

### Efficient Queries
```typescript
// Get recipient's upcoming occasions
occasions.where('recipientId', '==', recipientId)
  .where('date', '>=', today)
  .orderBy('date')

// Get gifts for an occasion  
gifts.where('occasionId', '==', occasionId)
  .where('status', 'in', ['selected', 'ordered'])
```

### Caching Strategy
- **Recipients**: Cache on app load
- **Occasions**: Cache per recipient
- **Gifts**: Lazy load per occasion
- **Demo Mode**: Full localStorage caching

## Future Enhancements

### Phase 1: Gift Automation
- Curated gift catalog
- Simple recommendation engine
- One-click gift ordering

### Phase 2: Smart Scheduling  
- Automatic occasion detection
- Delivery date optimization
- Reminder system

### Phase 3: Purchase Integration
- E-commerce partnerships
- Affiliate link management
- Order tracking

## Security & Privacy

### Data Protection
- All data scoped to userId
- No cross-user data sharing
- Minimal data collection

### API Security
- Firebase security rules
- Environment variable protection
- Input validation and sanitization

This simplified architecture supports the core "set-it-and-forget-it" experience while maintaining the flexibility for future enhancements.