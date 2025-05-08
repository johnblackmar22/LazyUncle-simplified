import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, addMonths, addYears, format } from 'date-fns';

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
const emmaId = uuidv4();
const liamId = uuidv4();
const robertId = uuidv4();
const sophiaId = uuidv4();

// Demo Recipients
export const demoRecipients = [
  {
    id: emmaId,
    userId: "demo-user",
    name: "Emma Johnson",
    relationship: "Wife",
    birthdate: addDays(today, 10), // Birthday in 10 days
    anniversary: addDays(today, 15), // Anniversary in 15 days
    interests: ["Books", "Hiking", "Yoga", "Cooking"],
    giftPreferences: {
      priceRange: {
        min: 50,
        max: 200
      },
      categories: ["Jewelry", "Experiences", "Books"]
    },
    specialDates: [
      {
        id: uuidv4(),
        name: "First Date Anniversary",
        date: addDays(today, 20), // 20 days from now
        recurring: true,
        type: "anniversary",
        description: "Our first date"
      }
    ],
    createdAt: subDays(today, 365),
    updatedAt: yesterday
  },
  {
    id: liamId,
    userId: "demo-user",
    name: "Liam Smith",
    relationship: "Son",
    birthdate: addDays(today, 7), // Birthday coming up soon in 7 days
    interests: ["Video Games", "Soccer", "Science", "Drawing"],
    giftPreferences: {
      priceRange: {
        min: 20,
        max: 100
      },
      categories: ["Toys", "Books", "Electronics"]
    },
    specialDates: [
      {
        id: uuidv4(),
        name: "Soccer Tournament",
        date: addDays(today, 14), // 14 days from now
        recurring: false,
        type: "other",
        description: "Annual school tournament"
      }
    ],
    createdAt: subDays(today, 300),
    updatedAt: yesterday
  },
  {
    id: robertId,
    userId: "demo-user",
    name: "Robert Chen",
    relationship: "Friend",
    birthdate: addDays(today, 22), // Birthday in 22 days
    interests: ["Technology", "Coffee", "Travel", "Photography"],
    giftPreferences: {
      priceRange: {
        min: 30,
        max: 150
      },
      categories: ["Gadgets", "Coffee Accessories", "Photography Equipment"]
    },
    specialDates: [
      {
        id: uuidv4(),
        name: "Promotion Celebration",
        date: addDays(today, 3), // 3 days from now
        recurring: false,
        type: "other",
        description: "Celebrating promotion at work"
      }
    ],
    createdAt: subDays(today, 180),
    updatedAt: yesterday
  },
  {
    id: sophiaId,
    userId: "demo-user",
    name: "Sophia Rodriguez",
    relationship: "Mother",
    birthdate: addDays(today, 3), // Birthday very soon - 3 days
    anniversary: addDays(today, 28), // 28 days from now
    interests: ["Gardening", "Cooking", "Classical Music", "Painting"],
    giftPreferences: {
      priceRange: {
        min: 40,
        max: 250
      },
      categories: ["Home Decor", "Kitchen Gadgets", "Art Supplies"]
    },
    specialDates: [
      {
        id: uuidv4(),
        name: "Retirement Anniversary",
        date: addDays(today, 25), // 25 days from now
        recurring: true,
        type: "anniversary",
        description: "Celebrates 5 years of retirement"
      }
    ],
    createdAt: subDays(today, 400),
    updatedAt: yesterday
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
    occasion: "Anniversary",
    date: addDays(today, 15), // For upcoming anniversary
    status: "planned", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?ixlib=rb-4.0.3",
    notes: "She mentioned liking this style at the mall last month",
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    recipientId: liamId, // For Liam
    userId: "demo-user",
    name: "LEGO Space Station",
    description: "Advanced building set with 1,200 pieces",
    price: 89.99,
    category: "Toys",
    occasion: "Birthday",
    date: addDays(today, 7), // For upcoming birthday
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1619158404527-a21de95ade6e?ixlib=rb-4.0.3",
    notes: "Already ordered from Amazon, should arrive in 2 days",
    createdAt: subDays(today, 10),
    updatedAt: subDays(today, 2)
  },
  {
    id: uuidv4(),
    recipientId: robertId, // For Robert
    userId: "demo-user",
    name: "Premium Coffee Subscription",
    description: "3-month subscription of premium single-origin coffees",
    price: 75.99,
    category: "Coffee Accessories",
    occasion: "Promotion",
    date: addDays(today, 3), // For promotion celebration
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3",
    notes: "Include a personal note about the promotion",
    createdAt: subDays(today, 5),
    updatedAt: subDays(today, 1)
  },
  {
    id: uuidv4(),
    recipientId: sophiaId, // For Sophia
    userId: "demo-user",
    name: "Indoor Herb Garden Kit",
    description: "Self-watering indoor garden with LED grow lights",
    price: 64.99,
    category: "Gardening",
    occasion: "Birthday",
    date: addDays(today, 3), // Very soon
    status: "ordered", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1585502892072-450ab2f2e2f7?ixlib=rb-4.0.3",
    notes: "Arrives tomorrow, remember to hide it!",
    createdAt: subDays(today, 7),
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    recipientId: emmaId, // For Emma
    userId: "demo-user",
    name: "Weekend Spa Retreat",
    description: "Two-night stay with full spa package",
    price: 399.99,
    category: "Experiences",
    occasion: "Birthday",
    date: addDays(today, 10), // For birthday
    status: "planned", // Valid status
    notes: "Need to book at least 7 days in advance",
    createdAt: subDays(today, 15),
    updatedAt: subDays(today, 15)
  },
  {
    id: uuidv4(),
    recipientId: liamId, // For Liam
    userId: "demo-user",
    name: "Science Museum Annual Pass",
    description: "Yearly membership to the science museum with special exhibits access",
    price: 129.99,
    category: "Experiences",
    occasion: "Soccer Tournament",
    date: addDays(today, 14), // For upcoming tournament
    status: "planned", // Valid status
    notes: "He's been asking for this for months",
    createdAt: subDays(today, 20),
    updatedAt: subDays(today, 5)
  },
  {
    id: uuidv4(),
    recipientId: robertId, // For Robert
    userId: "demo-user",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium over-ear headphones with 30-hour battery life",
    price: 249.99,
    category: "Electronics",
    occasion: "Birthday",
    date: addDays(today, 22), // For birthday
    status: "planned", // Valid status
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3",
    notes: "Black color, the latest model",
    createdAt: subDays(today, 10),
    updatedAt: yesterday
  }
];

// A function to initialize all demo data
export const initializeDemoData = () => {
  localStorage.setItem('demo-mode', 'true');
  localStorage.setItem('recipients', JSON.stringify(demoRecipients));
  localStorage.setItem('gifts', JSON.stringify(demoGifts));
  return { recipients: demoRecipients, gifts: demoGifts };
};

// A function to check if demo mode is active
export const isDemoMode = () => {
  return localStorage.getItem('demo-mode') === 'true';
};

// A function to clear demo data
export const clearDemoData = () => {
  localStorage.removeItem('demo-mode');
  localStorage.removeItem('recipients');
  localStorage.removeItem('gifts');
}; 