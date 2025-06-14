import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, addMonths, addYears, format as formatDate } from 'date-fns';

// Generate dates relative to today for more realistic demo data
const today = new Date();
const yesterday = subDays(today, 1);
const nextWeek = addDays(today, 7);
const nextMonth = addMonths(today, 1);
const twoMonthsLater = addMonths(today, 2);
const thisMonth = today.getMonth();
const thisYear = today.getFullYear();

// Next upcoming holiday dates
const christmas = new Date(thisYear, 11, 25); // December 25th
const valentinesDay = new Date(
  thisMonth > 1 || (thisMonth === 1 && today.getDate() > 14) 
    ? thisYear + 1 
    : thisYear, 
  1, 14
); // February 14th
const thanksgiving = new Date(thisYear, 10, 
  // 4th Thursday in November
  new Date(thisYear, 10, 1).getDay() === 4 ? 22 : 
  new Date(thisYear, 10, 1).getDay() === 5 ? 21 : 
  new Date(thisYear, 10, 1).getDay() === 6 ? 27 : 
  new Date(thisYear, 10, 1).getDay() === 0 ? 26 : 
  new Date(thisYear, 10, 1).getDay() === 1 ? 25 : 
  new Date(thisYear, 10, 1).getDay() === 2 ? 24 : 23
);

// Demo Special Dates - ensure they're all within next 30 days
export const demoSpecialDates = [
  {
    id: uuidv4(),
    name: "Birthday Party",
    date: addDays(today, 5), // 5 days from now
    recurring: true,
    type: "birthday",
    description: "Annual birthday celebration"
  },
  {
    id: uuidv4(),
    name: "Wedding Anniversary",
    date: addDays(today, 12), // 12 days from now
    recurring: true,
    type: "anniversary",
    description: "Wedding anniversary dinner"
  },
  {
    id: uuidv4(),
    name: "Graduation Ceremony",
    date: addDays(today, 18), // 18 days from now
    recurring: false,
    type: "other",
    description: "College graduation ceremony"
  },
  {
    id: uuidv4(),
    name: "Housewarming Party",
    date: addDays(today, 8), // 8 days from now
    recurring: false,
    type: "other",
    description: "Moving into new house"
  },
  {
    id: uuidv4(),
    name: "Baby Shower",
    date: addDays(today, 25), // 25 days from now
    recurring: false,
    type: "other",
    description: "Baby shower for first child"
  }
];

// Create unique IDs for recipients to ensure consistent references
const emmaId = 'demo-recipient-emma';
const liamId = 'demo-recipient-liam';
const robertId = 'demo-recipient-robert';
const sophiaId = 'demo-recipient-sophia';

// Demo Recipients
export const demoRecipients = [
  {
    id: emmaId,
    userId: "demo-user",
    name: "Emma Johnson",
    relationship: "Wife",
    birthdate: formatDate(addDays(today, 10), 'yyyy-MM-dd'), // Birthday in 10 days
    anniversary: formatDate(addDays(today, 15), 'yyyy-MM-dd'), // Anniversary in 15 days
    interests: ["Books", "Hiking", "Yoga", "Cooking"],
    deliveryAddress: {
      line1: "123 Maple Street",
      line2: "Apt 4B",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "US"
    },
    giftPreferences: {
      priceRange: {
        min: 50,
        max: 200
      },
      categories: ["Jewelry", "Experiences", "Books"]
    },
    createdAt: subDays(today, 365).getTime(),
    updatedAt: yesterday.getTime()
  },
  {
    id: liamId,
    userId: "demo-user",
    name: "Liam Smith",
    relationship: "Son",
    birthdate: formatDate(addDays(today, 7), 'yyyy-MM-dd'), // Birthday coming up soon in 7 days
    interests: ["Video Games", "Soccer", "Science", "Drawing"],
    deliveryAddress: {
      line1: "456 Oak Avenue",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "US"
    },
    giftPreferences: {
      priceRange: {
        min: 20,
        max: 100
      },
      categories: ["Toys", "Books", "Electronics"]
    },
    createdAt: subDays(today, 300).getTime(),
    updatedAt: yesterday.getTime()
  },
  {
    id: robertId,
    userId: "demo-user",
    name: "Robert Chen",
    relationship: "Friend",
    birthdate: formatDate(addDays(today, 22), 'yyyy-MM-dd'), // Birthday in 22 days
    interests: ["Technology", "Coffee", "Travel", "Photography"],
    deliveryAddress: {
      line1: "789 Pine Road",
      line2: "Unit 12",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "US"
    },
    giftPreferences: {
      priceRange: {
        min: 30,
        max: 150
      },
      categories: ["Gadgets", "Coffee Accessories", "Photography Equipment"]
    },
    createdAt: subDays(today, 180).getTime(),
    updatedAt: yesterday.getTime()
  },
  {
    id: sophiaId,
    userId: "demo-user",
    name: "Sophia Rodriguez",
    relationship: "Mother",
    birthdate: formatDate(addDays(today, 3), 'yyyy-MM-dd'), // Birthday very soon - 3 days
    anniversary: formatDate(addDays(today, 28), 'yyyy-MM-dd'), // 28 days from now
    interests: ["Gardening", "Cooking", "Classical Music", "Painting"],
    deliveryAddress: {
      line1: "321 Elm Drive",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "US"
    },
    giftPreferences: {
      priceRange: {
        min: 40,
        max: 250
      },
      categories: ["Home Decor", "Kitchen Gadgets", "Art Supplies"]
    },
    createdAt: subDays(today, 400).getTime(),
    updatedAt: yesterday.getTime()
  }
];

// Demo Gifts - ensure they all have proper status values
export const demoGifts = [
  {
    id: uuidv4(),
    recipientId: emmaId, // For Emma
    userId: "demo-user",
    name: "Diamond Necklace",
    description: "14k white gold with small diamond pendant",
    price: 249.99,
    category: "Jewelry",
    occasionId: `demo-occasion-${Date.now()}-2`, // Reference to Anniversary occasion
    date: addDays(today, 15).getTime(), // For upcoming anniversary
    status: "planned", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?ixlib=rb-4.0.3",
    notes: "She mentioned liking this style at the mall last month",
    createdAt: yesterday.getTime(),
    updatedAt: yesterday.getTime()
  },
  {
    id: uuidv4(),
    recipientId: liamId, // For Liam
    userId: "demo-user",
    name: "LEGO Space Station",
    description: "Advanced building set with 1,200 pieces",
    price: 89.99,
    category: "Toys",
    occasionId: `demo-occasion-${Date.now()}-3`, // Reference to Birthday occasion
    date: addDays(today, 7).getTime(), // For upcoming birthday
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1619158404527-a21de95ade6e?ixlib=rb-4.0.3",
    notes: "Already ordered from Amazon, should arrive in 2 days",
    createdAt: subDays(today, 10).getTime(),
    updatedAt: subDays(today, 2).getTime()
  },
  {
    id: uuidv4(),
    recipientId: robertId, // For Robert
    userId: "demo-user",
    name: "Premium Coffee Subscription",
    description: "3-month subscription of premium single-origin coffees",
    price: 75.99,
    category: "Coffee Accessories",
    occasionId: `demo-occasion-${Date.now()}-4`, // Reference to Promotion occasion
    date: addDays(today, 3).getTime(), // For promotion celebration
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3",
    notes: "Include a personal note about the promotion",
    createdAt: subDays(today, 5).getTime(),
    updatedAt: subDays(today, 1).getTime()
  },
  {
    id: uuidv4(),
    recipientId: sophiaId, // For Sophia
    userId: "demo-user",
    name: "Indoor Herb Garden Kit",
    description: "Self-watering indoor garden with LED grow lights",
    price: 64.99,
    category: "Gardening",
    occasionId: `demo-occasion-${Date.now()}-6`, // Reference to Birthday occasion
    date: addDays(today, 3).getTime(), // Very soon
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1585502892072-450ab2f2e2f7?ixlib=rb-4.0.3",
    notes: "Arrives tomorrow, remember to hide it!",
    createdAt: subDays(today, 7).getTime(),
    updatedAt: yesterday.getTime()
  },
  {
    id: uuidv4(),
    recipientId: emmaId, // For Emma
    userId: "demo-user",
    name: "Weekend Spa Retreat",
    description: "Two-night stay with full spa package",
    price: 399.99,
    category: "Experiences",
    occasionId: `demo-occasion-${Date.now()}-1`, // Reference to Birthday occasion
    date: addDays(today, 10).getTime(), // For birthday
    status: "planned", // Valid status
    notes: "Need to book at least 7 days in advance",
    createdAt: subDays(today, 15).getTime(),
    updatedAt: subDays(today, 15).getTime()
  },
  {
    id: uuidv4(),
    recipientId: liamId, // For Liam
    userId: "demo-user",
    name: "Science Museum Annual Pass",
    description: "Yearly membership to the science museum with special exhibits access",
    price: 129.99,
    category: "Experiences",
    occasionId: `demo-occasion-soccer-tournament`, // Reference to custom occasion
    date: addDays(today, 14).getTime(), // For upcoming tournament
    status: "planned", // Valid status
    notes: "He's been asking for this for months",
    createdAt: subDays(today, 20).getTime(),
    updatedAt: subDays(today, 5).getTime()
  },
  {
    id: uuidv4(),
    recipientId: robertId, // For Robert
    userId: "demo-user",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium over-ear headphones with 30-hour battery life",
    price: 249.99,
    category: "Electronics",
    occasionId: `demo-occasion-${Date.now()}-5`, // Reference to Birthday occasion
    date: addDays(today, 22).getTime(), // For birthday
    status: "planned", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3",
    notes: "Black color, the latest model",
    createdAt: subDays(today, 10).getTime(),
    updatedAt: yesterday.getTime()
  }
];

// Demo Occasions for Recipients
export const demoOccasions = {
  [emmaId]: [
    {
      id: `demo-occasion-${Date.now()}-1`,
      recipientId: emmaId,
      userId: "demo-user",
      name: "Birthday",
      date: formatDate(addDays(today, 10), 'yyyy-MM-dd'),
      type: "birthday",
      notes: "Annual birthday celebration",
      budget: 100,
      giftWrap: true,
      personalizedNote: true,
      noteText: "Happy Birthday Emma! Hope you have a wonderful day!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: `demo-occasion-${Date.now()}-2`,
      recipientId: emmaId,
      userId: "demo-user",
      name: "Anniversary",
      date: formatDate(addDays(today, 15), 'yyyy-MM-dd'),
      type: "anniversary",
      notes: "Wedding anniversary",
      budget: 200,
      giftWrap: true,
      personalizedNote: true,
      noteText: "Happy Anniversary! Love you!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  [liamId]: [
    {
      id: `demo-occasion-${Date.now()}-3`,
      recipientId: liamId,
      userId: "demo-user",
      name: "Birthday",
      date: formatDate(addDays(today, 7), 'yyyy-MM-dd'),
      type: "birthday",
      notes: "Son's birthday",
      budget: 75,
      giftWrap: true,
      personalizedNote: false,
      noteText: "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "demo-occasion-soccer-tournament",
      recipientId: liamId,
      userId: "demo-user",
      name: "Soccer Tournament",
      date: formatDate(addDays(today, 14), 'yyyy-MM-dd'),
      type: "custom",
      notes: "End of season soccer tournament celebration",
      budget: 130,
      giftWrap: false,
      personalizedNote: true,
      noteText: "Great job this season!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  [robertId]: [
    {
      id: `demo-occasion-${Date.now()}-4`,
      recipientId: robertId,
      userId: "demo-user",
      name: "Promotion Celebration",
      date: formatDate(addDays(today, 3), 'yyyy-MM-dd'),
      type: "custom",
      notes: "Celebrating work promotion",
      budget: 80,
      giftWrap: false,
      personalizedNote: true,
      noteText: "Congrats on the promotion!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: `demo-occasion-${Date.now()}-5`,
      recipientId: robertId,
      userId: "demo-user",
      name: "Birthday",
      date: formatDate(addDays(today, 22), 'yyyy-MM-dd'),
      type: "birthday",
      notes: "Friend's birthday",
      budget: 120,
      giftWrap: true,
      personalizedNote: true,
      noteText: "Happy Birthday Robert!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  [sophiaId]: [
    {
      id: `demo-occasion-${Date.now()}-6`,
      recipientId: sophiaId,
      userId: "demo-user",
      name: "Birthday",
      date: formatDate(addDays(today, 3), 'yyyy-MM-dd'),
      type: "birthday",
      notes: "Mother's birthday - very important!",
      budget: 150,
      giftWrap: true,
      personalizedNote: true,
      noteText: "Happy Birthday Mom! Love you so much!",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]
};

// A function to safely get data from localStorage with error handling
const safeGetItem = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// A function to safely set data in localStorage with error handling
const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Simple environment variable getter
const getEnv = (key: string): string | undefined => {
  return import.meta.env[key];
};

// A function to initialize all demo data
export const initializeDemoData = () => {
  try {
    // Check if demo data already exists
    const hasUser = !!safeGetItem('lazyuncle_demoUser');
    const hasRecipients = !!safeGetItem('lazyuncle_recipients');
    const hasGifts = !!safeGetItem('lazyuncle_gifts');
    
    console.log('=== INITIALIZING DEMO DATA ===');
    console.log('Data status:', { hasUser, hasRecipients, hasGifts });
    
    // Initialize the demo user if it doesn't exist
    if (!hasUser) {
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@lazyuncle.com',
        displayName: 'Demo User',
        planId: 'premium',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      safeSetItem('lazyuncle_demoUser', demoUser);
      console.log('Demo user created');
    }
    
    // Initialize recipients if they don't exist
    if (!hasRecipients) {
      safeSetItem('lazyuncle_recipients', demoRecipients);
      console.log('Demo recipients created:', demoRecipients.length);
    }
    
    // Initialize occasions for each recipient
    Object.entries(demoOccasions).forEach(([recipientId, occasions]) => {
      const occasionKey = `lazyuncle_occasions_${recipientId}`;
      if (!safeGetItem(occasionKey)) {
        safeSetItem(occasionKey, occasions);
        console.log(`Demo occasions created for recipient ${recipientId}:`, occasions.length);
      }
    });
    
    // Initialize gifts if they don't exist
    if (!hasGifts) {
      safeSetItem('lazyuncle_gifts', demoGifts);
      console.log('Demo gifts created:', demoGifts.length);
    }
    
    // Set demo mode flag
    safeSetItem('lazyuncle_demoMode', true);
    console.log('Demo mode initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Error initializing demo data:', error);
    return false;
  }
};

// A function to check if demo mode is active
export const isDemoMode = () => {
  try {
    // Check for explicit env setting first
    if (getEnv('VITE_DEMO_MODE') === 'true') {
      // If demo mode is enabled via environment, store it in localStorage for persistence
      localStorage.setItem('lazyuncle_demoMode', 'true');
      return true;
    }
    
    // Then check for persisted demo mode in localStorage (using the correct key)
    return localStorage.getItem('lazyuncle_demoMode') === 'true';
  } catch (error) {
    console.error('Error checking demo mode:', error);
    return false;
  }
};

// A function to clear demo data
export const clearDemoData = () => {
  try {
    // Clear localStorage
    localStorage.removeItem('lazyuncle_demoMode');
    localStorage.removeItem('lazyuncle_demoUser');
    localStorage.removeItem('lazyuncle_recipients');
    localStorage.removeItem('lazyuncle_gifts');
    
    // Clear all occasion data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('lazyuncle_occasions_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Demo data cleared successfully');
  } catch (error) {
    console.error('Error clearing demo data:', error);
  }
}; 