import { collection, getDocs, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { db, DEMO_MODE } from './firebase';
import type { Recipient, Gift, GiftSuggestion } from '../types';
import { useRecipientStore } from '../store/recipientStore';

// Simple auto-send service for managing automated gift sending
export const AutoSendService = {
  // Check for upcoming birthdays and occasions
  checkUpcomingOccasions: async (userId: string, daysAhead = 14): Promise<{recipient: Recipient, occasion: string, date: Date}[]> => {
    if (DEMO_MODE) {
      // Return mock data for demo mode
      return mockCheckUpcomingOccasions(userId, daysAhead);
    }

    try {
      // Get all recipients for the user
      const recipientsQuery = query(
        collection(db, 'recipients'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(recipientsQuery);
      const upcomingEvents: {recipient: Recipient, occasion: string, date: Date}[] = [];
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + daysAhead);
      
      querySnapshot.forEach(doc => {
        const recipient = {
          id: doc.id,
          ...doc.data()
        } as Recipient;
        
        // Check for upcoming birthdays
        if (recipient.birthdate) {
          const birthdate = new Date(recipient.birthdate);
          const thisYearBirthday = new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate());
          
          // If birthday already passed this year, check next year
          if (thisYearBirthday < now) {
            thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
          }
          
          if (thisYearBirthday <= futureDate && thisYearBirthday >= now) {
            upcomingEvents.push({
              recipient,
              occasion: 'birthday',
              date: thisYearBirthday
            });
          }
        }
      });
      
      return upcomingEvents;
    } catch (error) {
      console.error('Error checking upcoming occasions:', error);
      return [];
    }
  },
  
  // Get simple gift suggestions for a recipient
  getGiftSuggestions: async (recipientId: string, occasion: string, budget: number): Promise<GiftSuggestion[]> => {
    if (DEMO_MODE) {
      return mockGetGiftSuggestions(recipientId, occasion, budget);
    }
    
    // TODO: Implement simple gift suggestion system
    console.log('Gift suggestions requested for:', { recipientId, occasion, budget });
    return [];
  },
  
  // Create a gift for an occasion
  createGift: async (userId: string, recipientId: string, giftData: Partial<Gift>): Promise<{success: boolean, giftId?: string, message?: string}> => {
    if (DEMO_MODE) {
      return { success: true, giftId: 'demo-gift-' + Date.now(), message: 'Demo gift created' };
    }
    
    try {
      const gift: Omit<Gift, 'id'> = {
        userId,
        recipientId,
        name: giftData.name || '',
        description: giftData.description || '',
        price: giftData.price || 0,
        category: giftData.category || 'general',
        occasionId: giftData.occasionId || '',
        date: giftData.date || Date.now(),
        status: 'idea',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...giftData
      };
      
      const docRef = await addDoc(collection(db, 'gifts'), gift);
      return { success: true, giftId: docRef.id, message: 'Gift created successfully' };
    } catch (error) {
      console.error('Error creating gift:', error);
      return { success: false, message: 'Failed to create gift' };
    }
  }
};

// Mock functions for demo mode
function mockCheckUpcomingOccasions(userId: string, daysAhead: number): {recipient: Recipient, occasion: string, date: Date}[] {
  const recipients = useRecipientStore.getState().recipients;
  const upcomingEvents: {recipient: Recipient, occasion: string, date: Date}[] = [];
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);
  
  recipients.forEach(recipient => {
    if (recipient.birthdate) {
      const birthdate = new Date(recipient.birthdate);
      const thisYearBirthday = new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate());
      
      if (thisYearBirthday < now) {
        thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
      }
      
      if (thisYearBirthday <= futureDate && thisYearBirthday >= now) {
        upcomingEvents.push({
          recipient,
          occasion: 'birthday',
          date: thisYearBirthday
        });
      }
    }
  });
  
  return upcomingEvents;
}

function mockGetGiftSuggestions(recipientId: string, occasion: string, budget: number): GiftSuggestion[] {
  const recipient = useRecipientStore.getState().recipients.find(r => r.id === recipientId);
  if (!recipient) return [];
  
  // Simple gift suggestions based on interests
  const suggestions: GiftSuggestion[] = [];
  
  if (recipient.interests.includes('coffee')) {
    suggestions.push({
      id: '1',
      name: 'Premium Coffee Beans',
      description: 'High-quality artisan coffee beans',
      price: Math.min(budget * 0.8, 25),
      category: 'food',
      imageUrl: '/images/coffee.jpg',
      purchaseUrl: 'https://example.com/coffee'
    });
  }
  
  if (recipient.interests.includes('books')) {
    suggestions.push({
      id: '2',
      name: 'Bestselling Novel',
      description: 'Popular fiction book',
      price: Math.min(budget * 0.6, 20),
      category: 'books',
      imageUrl: '/images/book.jpg',
      purchaseUrl: 'https://example.com/book'
    });
  }
  
  return suggestions;
} 