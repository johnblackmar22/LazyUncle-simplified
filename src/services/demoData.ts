import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, addMonths, addYears } from 'date-fns';

// Generate dates relative to today for more realistic demo data
const today = new Date();
const yesterday = subDays(today, 1);
const nextWeek = addDays(today, 7);
const nextMonth = addMonths(today, 1);
const twoMonthsLater = addMonths(today, 2);
const christmas = new Date(today.getFullYear(), 11, 25); // December 25th
const valentinesDay = new Date(today.getFullYear(), 1, 14); // February 14th

// Demo Special Dates
export const demoSpecialDates = [
  {
    id: uuidv4(),
    name: "Birthday",
    date: addDays(today, 15), // 15 days from now
    recurring: true,
    type: "birthday",
    description: "Annual celebration"
  },
  {
    id: uuidv4(),
    name: "Anniversary",
    date: addDays(today, 45), // 45 days from now
    recurring: true,
    type: "anniversary",
    description: "Wedding anniversary"
  },
  {
    id: uuidv4(),
    name: "Graduation",
    date: addMonths(today, 2), // 2 months from now
    recurring: false,
    type: "other",
    description: "College graduation"
  }
];

// Demo Recipients
export const demoRecipients = [
  {
    id: uuidv4(),
    userId: "demo-user",
    name: "Emma Johnson",
    relationship: "Wife",
    birthdate: subDays(today, 40),
    anniversary: addDays(today, 10),
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
        date: addDays(today, 30),
        recurring: true,
        type: "anniversary",
        description: "Our first date"
      }
    ],
    createdAt: subDays(today, 365),
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    userId: "demo-user",
    name: "Liam Smith",
    relationship: "Son",
    birthdate: addDays(today, 7), // Birthday coming up soon
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
        date: addDays(today, 14),
        recurring: false,
        type: "other",
        description: "Annual school tournament"
      }
    ],
    createdAt: subDays(today, 300),
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    userId: "demo-user",
    name: "Robert Chen",
    relationship: "Friend",
    birthdate: addDays(today, 60),
    interests: ["Technology", "Coffee", "Travel", "Photography"],
    giftPreferences: {
      priceRange: {
        min: 30,
        max: 150
      },
      categories: ["Gadgets", "Coffee Accessories", "Photography Equipment"]
    },
    createdAt: subDays(today, 180),
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    userId: "demo-user",
    name: "Sophia Rodriguez",
    relationship: "Mother",
    birthdate: addDays(today, 3), // Birthday very soon
    anniversary: addMonths(today, 3),
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
        date: addDays(today, 45),
        recurring: true,
        type: "anniversary",
        description: "Celebrates 5 years of retirement"
      }
    ],
    createdAt: subDays(today, 400),
    updatedAt: yesterday
  }
];

// Demo Gifts
export const demoGifts = [
  {
    id: uuidv4(),
    recipientId: demoRecipients[0].id, // For Emma
    userId: "demo-user",
    name: "Diamond Necklace",
    description: "14k white gold with small diamond pendant",
    price: 249.99,
    category: "Jewelry",
    occasion: "Anniversary",
    date: addDays(today, 10), // For upcoming anniversary
    status: "planned",
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?ixlib=rb-4.0.3",
    notes: "She mentioned liking this style at the mall last month",
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    recipientId: demoRecipients[1].id, // For Liam
    userId: "demo-user",
    name: "LEGO Space Station",
    description: "Advanced building set with 1,200 pieces",
    price: 89.99,
    category: "Toys",
    occasion: "Birthday",
    date: addDays(today, 7), // For upcoming birthday
    status: "ordered",
    imageUrl: "https://images.unsplash.com/photo-1619158404527-a21de95ade6e?ixlib=rb-4.0.3",
    notes: "Already ordered from Amazon, should arrive in 2 days",
    createdAt: subDays(today, 10),
    updatedAt: subDays(today, 2)
  },
  {
    id: uuidv4(),
    recipientId: demoRecipients[2].id, // For Robert
    userId: "demo-user",
    name: "Espresso Machine",
    description: "Semi-automatic espresso maker with milk frother",
    price: 129.99,
    category: "Coffee Accessories",
    occasion: "Christmas",
    date: christmas,
    status: "planned",
    imageUrl: "https://images.unsplash.com/photo-1585135497273-b5594efca9cd?ixlib=rb-4.0.3",
    createdAt: subDays(today, 30),
    updatedAt: subDays(today, 30)
  },
  {
    id: uuidv4(),
    recipientId: demoRecipients[3].id, // For Sophia
    userId: "demo-user",
    name: "Indoor Herb Garden Kit",
    description: "Self-watering indoor garden with LED grow lights",
    price: 64.99,
    category: "Gardening",
    occasion: "Birthday",
    date: addDays(today, 3),
    status: "ordered",
    imageUrl: "https://images.unsplash.com/photo-1585502892072-450ab2f2e2f7?ixlib=rb-4.0.3",
    notes: "Arrives tomorrow, remember to hide it!",
    createdAt: subDays(today, 7),
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    recipientId: demoRecipients[0].id, // For Emma
    userId: "demo-user",
    name: "Weekend Spa Retreat",
    description: "Two-night stay with full spa package",
    price: 399.99,
    category: "Experiences",
    occasion: "Valentine's Day",
    date: valentinesDay,
    status: "planned",
    notes: "Need to book at least 30 days in advance",
    createdAt: subDays(today, 15),
    updatedAt: subDays(today, 15)
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