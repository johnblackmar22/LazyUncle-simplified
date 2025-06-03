# LazyUncle Data Architecture

## Overview

This document defines the complete data architecture for the LazyUncle application, including all schemas, types, and data relationships. This serves as the single source of truth for data structures across Firebase, TypeScript interfaces, and API contracts.

## Core Principles

1. **No undefined values** in Firebase documents (use null or omit fields)
2. **Consistent field naming** using camelCase
3. **Timestamps** stored as Firebase Timestamp objects in database, converted to numbers in application
4. **Required vs Optional** fields clearly defined
5. **Nested objects** kept minimal to avoid deep update issues

---

## Firebase Collections

### 1. Users Collection (`users`)

**Collection Path:** `/users/{userId}`

```typescript
interface User {
  id: string;                    // Document ID (Firebase UID)
  email: string;                 // Required - User's email address
  displayName?: string;          // Optional - User's display name
  photoURL?: string;             // Optional - Profile picture URL
  planId: string;               // Required - Subscription plan ID ('free', 'pro', etc.)
  createdAt: number;            // Required - Account creation timestamp
  updatedAt: number;            // Required - Last update timestamp
}
```

**Example:**
```json
{
  "id": "RmiLm4MF34afDhosnASDjBoZz3F3",
  "email": "john@example.com",
  "displayName": "John Smith",
  "photoURL": "https://example.com/photo.jpg",
  "planId": "pro",
  "createdAt": 1672531200000,
  "updatedAt": 1672531200000
}
```

---

### 2. Recipients Collection (`recipients`)

**Collection Path:** `/recipients/{recipientId}`

```typescript
interface Recipient {
  id: string;                           // Document ID
  userId: string;                       // Required - Owner's user ID
  name: string;                         // Required - Full name
  relationship: string;                 // Required - Relationship type
  birthdate?: string;                   // Optional - Format: 'YYYY-MM-DD'
  anniversary?: string;                 // Optional - Format: 'YYYY-MM-DD'
  interests: string[];                  // Required - Array of interest strings
  description?: string;                 // Optional - Free text about the person
  deliveryAddress?: Address;            // Optional - Default delivery address
  giftPreferences?: GiftPreferences;    // Optional - Gift preferences
  autoSendPreferences?: AutoSendPreferences; // Optional - Auto-send settings
  occasionIds?: string[];               // Optional - List of associated occasion IDs
  createdAt: number;                    // Required - Creation timestamp
  updatedAt: number;                    // Required - Last update timestamp
}
```

**Example:**
```json
{
  "id": "O1sUoJihtxQEGg2kvXez",
  "userId": "RmiLm4MF34afDhosnASDjBoZz3F3",
  "name": "Sarah Johnson",
  "relationship": "Sister",
  "birthdate": "1990-05-15",
  "interests": ["books", "hiking", "photography"],
  "description": "My sister who loves the outdoors and reading mystery novels",
  "deliveryAddress": {
    "line1": "123 Oak Street",
    "line2": "Apt 4B",
    "city": "Portland",
    "state": "OR",
    "postalCode": "97201",
    "country": "US"
  },
  "createdAt": 1672531200000,
  "updatedAt": 1672531200000
}
```

---

### 3. Occasions Collection (`occasions`)

**Collection Path:** `/occasions/{occasionId}`

```typescript
interface Occasion {
  id: string;                    // Document ID
  recipientId: string;           // Required - Associated recipient ID
  userId: string;                // Required - Owner's user ID (for security)
  name: string;                  // Required - Occasion name
  date: string;                  // Required - Format: 'YYYY-MM-DD'
  deliveryDate?: string;         // Optional - Format: 'YYYY-MM-DD'
  type: OccasionType;           // Required - Enum: 'birthday' | 'anniversary' | 'custom' | 'christmas'
  notes?: string;               // Optional - Additional notes
  budget?: number;              // Optional - Budget in cents
  giftWrap?: boolean;           // Optional - Whether to gift wrap
  personalizedNote?: boolean;   // Optional - Include personalized note
  noteText?: string;            // Optional - Custom note text
  createdAt: number;            // Required - Creation timestamp
  updatedAt: number;            // Required - Last update timestamp
}

type OccasionType = 'birthday' | 'anniversary' | 'custom' | 'christmas';
```

**Example:**
```json
{
  "id": "occasion_123",
  "recipientId": "O1sUoJihtxQEGg2kvXez",
  "userId": "RmiLm4MF34afDhosnASDjBoZz3F3",
  "name": "Sarah's Birthday",
  "date": "2024-05-15",
  "deliveryDate": "2024-05-14",
  "type": "birthday",
  "notes": "She mentioned wanting hiking gear",
  "budget": 10000,
  "giftWrap": true,
  "personalizedNote": true,
  "noteText": "Happy Birthday! Hope you love this!",
  "createdAt": 1672531200000,
  "updatedAt": 1672531200000
}
```

---

### 4. Gifts Collection (`gifts`)

**Collection Path:** `/gifts/{giftId}`

```typescript
interface Gift {
  id: string;                    // Document ID
  recipientId: string;           // Required - Associated recipient ID
  userId: string;                // Required - Owner's user ID
  occasionId: string;           // Required - Associated occasion ID
  name: string;                  // Required - Gift name
  description?: string;          // Optional - Gift description
  price: number;                // Required - Price in cents
  category: string;             // Required - Gift category
  status: GiftStatus;           // Required - Current status
  date: number;                 // Required - Timestamp when gift is for
  imageUrl?: string;            // Optional - Product image URL
  affiliateLink?: string;       // Optional - Purchase link
  notes?: string;               // Optional - Internal notes
  autoSend?: boolean;           // Optional - Auto-send flag
  recurring?: boolean;          // Optional - Yearly recurring
  createdAt: number;            // Required - Creation timestamp
  updatedAt: number;            // Required - Last update timestamp
}

type GiftStatus = 'planned' | 'ordered' | 'shipped' | 'delivered' | 'given' | 'archived' | 'idea' | 'purchased';
```

---

## Nested Object Schemas

### Address Schema

```typescript
interface Address {
  line1: string;                // Required - Street address
  line2?: string;               // Optional - Apartment, suite, etc.
  city: string;                 // Required - City name
  state: string;                // Required - State/province code
  postalCode: string;           // Required - ZIP/postal code
  country: string;              // Required - Country code (default: 'US')
}
```

### Gift Preferences Schema

```typescript
interface GiftPreferences {
  priceRange?: {
    min: number;                // Minimum price in cents
    max: number;                // Maximum price in cents
  };
  categories?: string[];        // Preferred gift categories
}
```

### Auto Send Preferences Schema

```typescript
interface AutoSendPreferences {
  enabled: boolean;                     // Required - Master enable/disable
  defaultBudget: number;               // Required - Default budget in cents
  requireApproval: boolean;            // Required - Require manual approval
  occasions: AutoSendOccasions;       // Required - Per-occasion settings
  shippingAddress: Address;            // Required - Default shipping address
  paymentMethod: PaymentMethod;        // Required - Payment method info
}

interface AutoSendOccasions {
  birthday?: OccasionPreference;
  christmas?: OccasionPreference;
  anniversary?: OccasionPreference;
  [key: string]: OccasionPreference | undefined;
}

interface OccasionPreference {
  enabled: boolean;                    // Required - Enable for this occasion
  budget: number;                      // Required - Budget in cents
  leadTime: number;                    // Required - Days before occasion
}

interface PaymentMethod {
  type: 'creditCard' | 'paypal' | 'other';  // Required - Payment type
  last4?: string;                           // Optional - Last 4 digits
  brand?: string;                           // Optional - Card brand
}
```

---

## Local Storage Schema (Demo Mode)

### Storage Keys
```typescript
const STORAGE_KEYS = {
  RECIPIENTS: 'lazyuncle_recipients',
  OCCASIONS: 'lazyuncle_occasions',
  GIFTS: 'lazyuncle_gifts',
  USER: 'lazyuncle_user',
  DEMO_MODE: 'lazyuncle_demo_mode'
};
```

### Data Format
All localStorage data is stored as JSON strings of arrays:

```typescript
// Recipients
localStorage.setItem('lazyuncle_recipients', JSON.stringify(Recipient[]));

// Occasions (grouped by recipient)
localStorage.setItem('lazyuncle_occasions', JSON.stringify({
  [recipientId: string]: Occasion[]
}));
```

---

## Data Relationships

```
User (1) ──── (many) Recipients
    │
    └── (many) Occasions ──── (many) Gifts
                │
                └── (1) Recipient
```

### Relationship Rules

1. **User to Recipients**: One-to-many, cascading delete
2. **Recipient to Occasions**: One-to-many, cascading delete
3. **Occasion to Gifts**: One-to-many, cascading delete
4. **User Security**: All documents include `userId` for access control

---

## Validation Rules

### Required Fields
- All entities must have: `id`, `userId`, `createdAt`, `updatedAt`
- Recipients must have: `name`, `relationship`, `interests` (array)
- Occasions must have: `recipientId`, `name`, `date`, `type`
- Gifts must have: `recipientId`, `occasionId`, `name`, `price`, `category`, `status`, `date`

### Data Constraints
- **Email**: Valid email format
- **Dates**: ISO format 'YYYY-MM-DD'
- **Timestamps**: Positive integers (milliseconds since epoch)
- **Prices/Budgets**: Positive integers (cents)
- **Arrays**: Never null, use empty array `[]`
- **Optional Fields**: Use `undefined` in TypeScript, omit in Firebase

### Firebase-Specific Rules
- **No undefined values** - use `deepCleanUndefined()` before saving
- **Use Firestore Timestamp** for server timestamps
- **Index required fields** for efficient queries
- **Security rules** enforce `userId` ownership

---

## Migration Guidelines

### Adding New Fields
1. Add to TypeScript interface
2. Update this documentation
3. Add migration logic for existing data
4. Update validation rules

### Changing Field Types
1. Create migration script
2. Update TypeScript types
3. Test with existing data
4. Deploy in phases

### Removing Fields
1. Mark as deprecated first
2. Remove from new writes
3. Clean up existing data
4. Remove from types

---

## Example Queries

### Firebase Queries
```typescript
// Get all recipients for a user
const recipientsRef = query(
  collection(db, 'recipients'),
  where('userId', '==', userId)
);

// Get all occasions for a recipient
const occasionsRef = query(
  collection(db, 'occasions'),
  where('recipientId', '==', recipientId),
  where('userId', '==', userId)
);
```

### Type Guards
```typescript
// Validate recipient data
function isValidRecipient(data: any): data is Recipient {
  return (
    typeof data.id === 'string' &&
    typeof data.userId === 'string' &&
    typeof data.name === 'string' &&
    typeof data.relationship === 'string' &&
    Array.isArray(data.interests) &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}
```

---

## Version History

- **v1.0** - Initial schema definition
- **v1.1** - Added deep cleaning for Firebase undefined values
- **v1.2** - Enhanced address validation and occasion types

---

*This document should be updated whenever data schemas change. All developers must reference this document when working with data structures.* 