/**
 * Gift Recommendation Engine
 * 
 * This service provides functionality for recommending gifts based on recipient data.
 */

interface GiftSuggestion {
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

// Mock database of gift ideas
const giftCatalog: GiftSuggestion[] = [
  // Birthday gifts
  {
    id: 'gift-1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality noise-cancelling headphones for music lovers',
    price: 199.99,
    category: 'Electronics',
    interests: ['Music', 'Technology'],
    occasion: 'Birthday',
    imageUrl: 'https://example.com/headphones.jpg'
  },
  {
    id: 'gift-2',
    name: 'Leather Wallet',
    description: 'Handcrafted leather wallet with RFID protection',
    price: 49.99,
    category: 'Accessories',
    gender: 'Male',
    occasion: 'Birthday',
    imageUrl: 'https://example.com/wallet.jpg'
  },
  {
    id: 'gift-3',
    name: 'Scented Candle Set',
    description: 'Set of 4 luxury scented candles in decorative jars',
    price: 39.99,
    category: 'Home',
    gender: 'Female',
    occasion: 'Birthday',
    imageUrl: 'https://example.com/candles.jpg'
  },
  
  // Anniversary gifts
  {
    id: 'gift-4',
    name: 'Personalized Photo Album',
    description: 'Custom photo album with your favorite memories',
    price: 59.99,
    category: 'Personalized',
    occasion: 'Anniversary',
    imageUrl: 'https://example.com/album.jpg'
  },
  {
    id: 'gift-5',
    name: 'Gourmet Chocolate Box',
    description: 'Luxury assortment of handcrafted chocolates',
    price: 34.99,
    category: 'Food',
    occasion: 'Anniversary',
    imageUrl: 'https://example.com/chocolate.jpg'
  },
  
  // Christmas/Holiday gifts
  {
    id: 'gift-6',
    name: 'Smart Home Starter Kit',
    description: 'All-in-one smart home system with voice control',
    price: 149.99,
    category: 'Electronics',
    interests: ['Technology', 'Gadgets'],
    occasion: 'Christmas',
    imageUrl: 'https://example.com/smarthome.jpg'
  },
  {
    id: 'gift-7',
    name: 'Cozy Knit Blanket',
    description: 'Super soft knitted throw blanket for cold winter nights',
    price: 79.99,
    category: 'Home',
    occasion: 'Christmas',
    imageUrl: 'https://example.com/blanket.jpg'
  },
  
  // For book lovers
  {
    id: 'gift-8',
    name: 'E-Reader',
    description: 'Waterproof e-reader with adjustable lighting',
    price: 129.99,
    category: 'Electronics',
    interests: ['Books', 'Reading'],
    imageUrl: 'https://example.com/ereader.jpg'
  },
  {
    id: 'gift-9',
    name: 'Book Subscription Box',
    description: '3-month subscription to curated book box with goodies',
    price: 89.99,
    category: 'Subscription',
    interests: ['Books', 'Reading'],
    imageUrl: 'https://example.com/bookbox.jpg'
  },
  
  // For sports enthusiasts
  {
    id: 'gift-10',
    name: 'Fitness Tracker',
    description: 'Advanced fitness and activity tracker with heart rate monitoring',
    price: 149.99,
    category: 'Electronics',
    interests: ['Sports', 'Fitness', 'Running'],
    imageUrl: 'https://example.com/fitnesstracker.jpg'
  },
  
  // For cooking enthusiasts
  {
    id: 'gift-11',
    name: 'Premium Chef\'s Knife',
    description: 'Professional-grade stainless steel chef\'s knife',
    price: 89.99,
    category: 'Kitchen',
    interests: ['Cooking', 'Food'],
    imageUrl: 'https://example.com/knife.jpg'
  },
  {
    id: 'gift-12',
    name: 'Cooking Class Voucher',
    description: 'Gift certificate for a gourmet cooking class',
    price: 99.99,
    category: 'Experience',
    interests: ['Cooking', 'Food'],
    imageUrl: 'https://example.com/cookingclass.jpg'
  },
  
  // For travelers
  {
    id: 'gift-13',
    name: 'Travel Backpack',
    description: 'Weather-resistant backpack with built-in charging port',
    price: 79.99,
    category: 'Travel',
    interests: ['Travel', 'Adventure'],
    imageUrl: 'https://example.com/backpack.jpg'
  },
  
  // For music lovers
  {
    id: 'gift-14',
    name: 'Vinyl Record Subscription',
    description: '3-month subscription to receive curated vinyl records',
    price: 119.99,
    category: 'Subscription',
    interests: ['Music', 'Vinyl'],
    imageUrl: 'https://example.com/vinyl.jpg'
  },
  
  // For art lovers
  {
    id: 'gift-15',
    name: 'Art Print Set',
    description: 'Set of 3 high-quality art prints from renowned artists',
    price: 69.99,
    category: 'Art',
    interests: ['Art', 'Design'],
    imageUrl: 'https://example.com/artprints.jpg'
  }
];

/**
 * Get gift recommendations based on recipient data
 */
export const getGiftRecommendations = (recipientData: any, occasion?: string, budget?: number): GiftSuggestion[] => {
  // Get the recipient's interests, if available
  const interests = recipientData.interests || [];
  const gender = recipientData.gender || '';
  const age = recipientData.age || 30;
  const maxPrice = budget || 200;
  
  // Filter the catalog based on recipient data and occasion
  let recommendations = giftCatalog.filter(gift => {
    // Filter by price
    if (gift.price > maxPrice) {
      return false;
    }
    
    // If occasion is specified, filter by occasion
    if (occasion && gift.occasion && gift.occasion.toLowerCase() !== occasion.toLowerCase()) {
      return false;
    }
    
    // If gender is specified, consider gender-specific gifts
    if (gender && gift.gender && gift.gender.toLowerCase() !== gender.toLowerCase()) {
      return false;
    }
    
    return true;
  });
  
  // Sort by interest matching
  recommendations = recommendations.sort((a, b) => {
    const scoreA = calculateInterestMatchScore(a, interests);
    const scoreB = calculateInterestMatchScore(b, interests);
    return scoreB - scoreA;
  });
  
  // Return top 5 recommendations
  return recommendations.slice(0, 5);
};

/**
 * Calculate how well a gift matches the recipient's interests
 */
const calculateInterestMatchScore = (gift: GiftSuggestion, recipientInterests: string[]): number => {
  if (!gift.interests || gift.interests.length === 0 || recipientInterests.length === 0) {
    return 0;
  }
  
  // Count matching interests
  let matchCount = 0;
  gift.interests.forEach(interest => {
    if (recipientInterests.some(recInterest => 
      recInterest.toLowerCase() === interest.toLowerCase()
    )) {
      matchCount++;
    }
  });
  
  // Calculate score based on percentage of matches
  return (matchCount / gift.interests.length) * 10;
};

/**
 * Generate a personal message for the gift
 */
export const generateGiftMessage = (recipientName: string, occasion: string, relationship: string): string => {
  const occasions = {
    'birthday': [
      `Happy Birthday, ${recipientName}! Hope this gift brings a smile to your special day.`,
      `Wishing you an amazing birthday, ${recipientName}! Enjoy your gift!`,
      `Happy Birthday to the best ${relationship}! Hope you love this gift.`
    ],
    'christmas': [
      `Merry Christmas, ${recipientName}! Wishing you joy and happiness this holiday season.`,
      `Happy Holidays, ${recipientName}! Hope this gift brings you joy.`,
      `Warmest wishes to you, ${recipientName}, during this festive season!`
    ],
    'anniversary': [
      `Happy Anniversary, ${recipientName}! Here's to many more wonderful years.`,
      `Celebrating another year of love and happiness with you, ${recipientName}.`,
      `Cheers to us, ${recipientName}! Happy Anniversary!`
    ],
    'graduation': [
      `Congratulations on your graduation, ${recipientName}! So proud of your accomplishment.`,
      `Well done, ${recipientName}! Celebrating your hard work and achievement.`,
      `Here's to new beginnings, ${recipientName}! Congrats on your graduation!`
    ]
  };
  
  // Get the appropriate message array based on the occasion
  const occasionKey = Object.keys(occasions).find(key => 
    occasion.toLowerCase().includes(key.toLowerCase())
  ) || 'birthday';
  
  const messages = occasions[occasionKey as keyof typeof occasions];
  
  // Return a random message from the array
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Auto-send gift based on settings and recipient data
 */
export const handleAutoSendGift = async (gift: any, recipient: any, settings: any): Promise<boolean> => {
  // In a real application, this would connect to an e-commerce API
  // or gift card provider to actually purchase and send the gift
  
  console.log(`Auto-sending gift: ${gift.name} to ${recipient.name}`);
  
  // Simulate sending the gift (would be an API call in production)
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Gift sent successfully');
      resolve(true);
    }, 1500);
  });
}; 