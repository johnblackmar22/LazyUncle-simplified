import { collection, getDocs, query, where, Timestamp, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Recipient, Gift, RecipientAutoSendPreferences, GiftRecommendation } from '../types';
import { useRecipientStore } from '../store/recipientStore';
import { useGiftStore } from '../store/giftStore';

// Demo mode flag - set to true to use mock data instead of firebase
const USE_DEMO_MODE = import.meta.env.VITE_USE_DEMO_MODE === 'true';

// Service to manage auto-send functionality
export const AutoSendService = {
  // Check for upcoming occasions that require auto-send gifts
  checkUpcomingOccasions: async (userId: string, daysAhead = 14): Promise<{recipient: Recipient, occasion: string, date: Date}[]> => {
    if (USE_DEMO_MODE) {
      // Return mock data for demo mode
      return mockCheckUpcomingOccasions(userId, daysAhead);
    }

    try {
      // Get all recipients with auto-send enabled
      const recipientsQuery = query(
        collection(db, 'recipients'),
        where('userId', '==', userId),
        where('autoSendPreferences.enabled', '==', true)
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
        
        // Check standard occasions
        if (recipient.autoSendPreferences?.occasions.birthday?.enabled && recipient.birthdate) {
          const birthdate = new Date(recipient.birthdate);
          const thisYearBirthday = new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate());
          
          // If birthday already passed this year, check next year
          if (thisYearBirthday < now) {
            thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
          }
          
          const leadTime = recipient.autoSendPreferences.occasions.birthday.leadTime || 7;
          const sendDate = new Date(thisYearBirthday);
          sendDate.setDate(sendDate.getDate() - leadTime);
          
          if (sendDate <= futureDate && sendDate >= now) {
            upcomingEvents.push({
              recipient,
              occasion: 'birthday',
              date: thisYearBirthday
            });
          }
        }
        
        // Check Christmas if enabled
        if (recipient.autoSendPreferences?.occasions.christmas?.enabled) {
          const thisYearChristmas = new Date(now.getFullYear(), 11, 25); // December 25
          
          // If Christmas already passed this year, check next year
          if (thisYearChristmas < now) {
            thisYearChristmas.setFullYear(thisYearChristmas.getFullYear() + 1);
          }
          
          const leadTime = recipient.autoSendPreferences.occasions.christmas.leadTime || 14;
          const sendDate = new Date(thisYearChristmas);
          sendDate.setDate(sendDate.getDate() - leadTime);
          
          if (sendDate <= futureDate && sendDate >= now) {
            upcomingEvents.push({
              recipient,
              occasion: 'christmas',
              date: thisYearChristmas
            });
          }
        }
        
        // Check anniversary if enabled
        if (recipient.autoSendPreferences?.occasions.anniversary?.enabled) {
          // Note: In a real app, you would store the anniversary date in recipient data
          // This is a placeholder assuming there's an anniversary field
          if (recipient.anniversary) {
            const anniversaryDate = new Date(recipient.anniversary);
            const thisYearAnniversary = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
            
            // If anniversary already passed this year, check next year
            if (thisYearAnniversary < now) {
              thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1);
            }
            
            const leadTime = recipient.autoSendPreferences.occasions.anniversary.leadTime || 7;
            const sendDate = new Date(thisYearAnniversary);
            sendDate.setDate(sendDate.getDate() - leadTime);
            
            if (sendDate <= futureDate && sendDate >= now) {
              upcomingEvents.push({
                recipient,
                occasion: 'anniversary',
                date: thisYearAnniversary
              });
            }
          }
        }
        
        // Check custom occasions
        if (recipient.autoSendPreferences?.occasions.custom) {
          const customOccasions = recipient.autoSendPreferences.occasions.custom;
          
          Object.entries(customOccasions).forEach(([occasionName, preference]) => {
            if (preference.enabled && recipient.specialDates) {
              // Find matching special date
              const specialDate = recipient.specialDates.find(d => d.name.toLowerCase() === occasionName.toLowerCase());
              
              if (specialDate && specialDate.date) {
                const eventDate = new Date(specialDate.date);
                const thisYearEvent = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                
                // If the date already passed this year, check next year
                if (thisYearEvent < now) {
                  thisYearEvent.setFullYear(thisYearEvent.getFullYear() + 1);
                }
                
                const leadTime = preference.leadTime || 7;
                const sendDate = new Date(thisYearEvent);
                sendDate.setDate(sendDate.getDate() - leadTime);
                
                if (sendDate <= futureDate && sendDate >= now) {
                  upcomingEvents.push({
                    recipient,
                    occasion: occasionName,
                    date: thisYearEvent
                  });
                }
              }
            }
          });
        }
      });
      
      return upcomingEvents;
    } catch (error) {
      console.error('Error checking upcoming occasions:', error);
      return [];
    }
  },
  
  // Get gift recommendations for a recipient and occasion
  getGiftRecommendations: async (recipientId: string, occasion: string, budget: number): Promise<GiftRecommendation[]> => {
    if (USE_DEMO_MODE) {
      // Return mock data for demo mode
      return mockGetGiftRecommendations(recipientId, occasion, budget);
    }
    
    // TODO: Implement new simple gift recommendation system
    console.log('Gift recommendations requested for:', { recipientId, occasion, budget });
    
    // For now, return empty array until we rebuild the system
    return [];
  },
  
  // Process an auto-send gift (create gift and handle payment/shipping)
  processAutoSend: async (
    userId: string, 
    recipientId: string, 
    occasion: string, 
    giftRecommendation: GiftRecommendation,
    requireApproval: boolean = true
  ): Promise<{success: boolean, giftId?: string, message?: string}> => {
    if (USE_DEMO_MODE) {
      // Return mock data for demo mode
      return mockProcessAutoSend(userId, recipientId, occasion, giftRecommendation, requireApproval);
    }
    
    try {
      const recipient = useRecipientStore.getState().recipients.find(r => r.id === recipientId);
      if (!recipient || !recipient.autoSendPreferences) {
        return { success: false, message: 'Recipient not found or auto-send not configured' };
      }
      
      // Create a new gift
      const timestamp = Timestamp.now();
      const occasionDate = new Date();
      
      // Set occasion date based on occasion type
      // (In a real app, you would have more sophisticated date handling)
      if (occasion === 'birthday' && recipient.birthdate) {
        const birthdate = new Date(recipient.birthdate);
        occasionDate.setMonth(birthdate.getMonth());
        occasionDate.setDate(birthdate.getDate());
      } else if (occasion === 'christmas') {
        occasionDate.setMonth(11); // December
        occasionDate.setDate(25);
      }
      // Handle other occasions accordingly
      
      // Create gift with the initial status
      const initialStatus = requireApproval ? 'pending_approval' : 'ordered';
      
      const newGift = {
        userId,
        recipientId,
        name: giftRecommendation.name,
        description: giftRecommendation.description,
        price: giftRecommendation.price,
        category: giftRecommendation.category,
        occasion,
        date: occasionDate,
        status: initialStatus,
        imageUrl: giftRecommendation.imageUrl,
        autoSend: true, // Mark this gift as auto-sent
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'gifts'), newGift);
      
      // If no approval required, proceed with "ordering" the gift
      // In a real application, this would connect to payment processing and fulfillment services
      if (!requireApproval) {
        // Process payment
        const paymentResult = await processPayment(
          userId, 
          giftRecommendation.price, 
          recipient.autoSendPreferences.paymentMethod
        );
        
        if (!paymentResult.success) {
          // Update gift status to reflect payment failure
          await updateDoc(doc(db, 'gifts', docRef.id), {
            status: 'payment_failed',
            notes: paymentResult.message,
            updatedAt: Timestamp.now()
          });
          
          return { success: false, giftId: docRef.id, message: `Payment failed: ${paymentResult.message}` };
        }
        
        // Process shipping
        const shippingResult = await processShipping(
          docRef.id, 
          recipient.autoSendPreferences.shippingAddress
        );
        
        if (!shippingResult.success) {
          // Update gift status to reflect shipping setup failure
          await updateDoc(doc(db, 'gifts', docRef.id), {
            status: 'shipping_failed',
            notes: shippingResult.message,
            updatedAt: Timestamp.now()
          });
          
          return { success: false, giftId: docRef.id, message: `Shipping failed: ${shippingResult.message}` };
        }
        
        // Update gift status to reflect successful ordering
        await updateDoc(doc(db, 'gifts', docRef.id), {
          status: 'ordered',
          paymentId: paymentResult.paymentId,
          shippingId: shippingResult.shippingId,
          updatedAt: Timestamp.now()
        });
      }
      
      // Update the occasion's lastSent property
      // This is important to prevent duplicate auto-sends
      if (recipient.autoSendPreferences.occasions) {
        if (['birthday', 'christmas', 'anniversary'].includes(occasion)) {
          const occasionKey = occasion as 'birthday' | 'christmas' | 'anniversary';
          if (recipient.autoSendPreferences.occasions[occasionKey]) {
            const updatedOccasions = { ...recipient.autoSendPreferences.occasions };
            if (updatedOccasions[occasionKey]) {
              updatedOccasions[occasionKey] = {
                ...updatedOccasions[occasionKey]!,
                lastSent: new Date()
              };
              
              await updateDoc(doc(db, 'recipients', recipientId), {
                'autoSendPreferences.occasions': updatedOccasions,
                updatedAt: timestamp
              });
            }
          }
        } else if (recipient.autoSendPreferences.occasions.custom?.[occasion]) {
          const updatedCustomOccasions = { ...recipient.autoSendPreferences.occasions.custom };
          if (updatedCustomOccasions[occasion]) {
            updatedCustomOccasions[occasion] = {
              ...updatedCustomOccasions[occasion],
              lastSent: new Date()
            };
            
            await updateDoc(doc(db, 'recipients', recipientId), {
              'autoSendPreferences.occasions.custom': updatedCustomOccasions,
              updatedAt: timestamp
            });
          }
        }
      }
      
      return { 
        success: true, 
        giftId: docRef.id, 
        message: requireApproval ? 'Gift needs approval' : 'Gift automatically ordered' 
      };
    } catch (error) {
      console.error('Error processing auto-send:', error);
      return { success: false, message: `Error: ${(error as Error).message}` };
    }
  },
  
  // Approve a pending auto-send gift
  approveAutoSendGift: async (giftId: string): Promise<{success: boolean, message?: string}> => {
    if (USE_DEMO_MODE) {
      // Return mock data for demo mode
      return mockApproveAutoSendGift(giftId);
    }
    
    try {
      // Get the gift details
      const gift = useGiftStore.getState().gifts.find(g => g.id === giftId);
      if (!gift || gift.status !== 'pending_approval') {
        return { success: false, message: 'Gift not found or not in pending approval state' };
      }
      
      const recipient = useRecipientStore.getState().recipients.find(r => r.id === gift.recipientId);
      if (!recipient || !recipient.autoSendPreferences) {
        return { success: false, message: 'Recipient not found or auto-send not configured' };
      }
      
      // Process payment
      const paymentResult = await processPayment(
        gift.userId, 
        gift.price, 
        recipient.autoSendPreferences.paymentMethod
      );
      
      if (!paymentResult.success) {
        // Update gift status to reflect payment failure
        await updateDoc(doc(db, 'gifts', giftId), {
          status: 'payment_failed',
          notes: paymentResult.message,
          updatedAt: Timestamp.now()
        });
        
        return { success: false, message: `Payment failed: ${paymentResult.message}` };
      }
      
      // Process shipping
      const shippingResult = await processShipping(
        giftId, 
        recipient.autoSendPreferences.shippingAddress
      );
      
      if (!shippingResult.success) {
        // Update gift status to reflect shipping setup failure
        await updateDoc(doc(db, 'gifts', giftId), {
          status: 'shipping_failed',
          notes: shippingResult.message,
          updatedAt: Timestamp.now()
        });
        
        return { success: false, message: `Shipping failed: ${shippingResult.message}` };
      }
      
      // Update gift status to reflect successful ordering
      await updateDoc(doc(db, 'gifts', giftId), {
        status: 'ordered',
        paymentId: paymentResult.paymentId,
        shippingId: shippingResult.shippingId,
        updatedAt: Timestamp.now()
      });
      
      return { success: true, message: 'Gift approved and ordered successfully' };
    } catch (error) {
      console.error('Error approving auto-send gift:', error);
      return { success: false, message: `Error: ${(error as Error).message}` };
    }
  },
  
  // Decline a pending auto-send gift
  declineAutoSendGift: async (giftId: string, reason?: string): Promise<{success: boolean, message?: string}> => {
    if (USE_DEMO_MODE) {
      // Return mock data for demo mode
      return mockDeclineAutoSendGift(giftId, reason);
    }
    
    try {
      const gift = useGiftStore.getState().gifts.find(g => g.id === giftId);
      if (!gift || gift.status !== 'pending_approval') {
        return { success: false, message: 'Gift not found or not in pending approval state' };
      }
      
      // Update gift status to declined
      await updateDoc(doc(db, 'gifts', giftId), {
        status: 'declined',
        notes: reason || 'No reason provided',
        updatedAt: Timestamp.now()
      });
      
      return { success: true, message: 'Gift declined successfully' };
    } catch (error) {
      console.error('Error declining auto-send gift:', error);
      return { success: false, message: `Error: ${(error as Error).message}` };
    }
  }
};

// Helper functions for payment and shipping (placeholders)
async function processPayment(userId: string, amount: number, paymentMethod?: any): Promise<{success: boolean, paymentId?: string, message?: string}> {
  // This would integrate with a payment processor in a real application
  // For now, just return a successful result
  return {
    success: true,
    paymentId: `payment_${Date.now()}`,
    message: 'Payment processed successfully'
  };
}

async function processShipping(giftId: string, shippingAddress?: any): Promise<{success: boolean, shippingId?: string, message?: string}> {
  // This would integrate with a shipping provider in a real application
  // For now, just return a successful result
  return {
    success: true,
    shippingId: `shipping_${Date.now()}`,
    message: 'Shipping setup successfully'
  };
}

// Mock implementations for demo mode
function mockCheckUpcomingOccasions(userId: string, daysAhead: number): {recipient: Recipient, occasion: string, date: Date}[] {
  const recipients = useRecipientStore.getState().recipients;
  const upcomingEvents: {recipient: Recipient, occasion: string, date: Date}[] = [];
  
  const now = new Date();
  
  // Add some mock upcoming events
  recipients.forEach(recipient => {
    // Add a birthday event for some recipients
    if (Math.random() > 0.5) {
      const eventDate = new Date();
      eventDate.setDate(now.getDate() + Math.floor(Math.random() * daysAhead));
      
      upcomingEvents.push({
        recipient,
        occasion: 'birthday',
        date: eventDate
      });
    }
    
    // Add Christmas for some recipients if current month is November or December
    if ((now.getMonth() === 10 || now.getMonth() === 11) && Math.random() > 0.7) {
      const christmasDate = new Date(now.getFullYear(), 11, 25);
      
      upcomingEvents.push({
        recipient,
        occasion: 'christmas',
        date: christmasDate
      });
    }
  });
  
  return upcomingEvents;
}

function mockGetGiftRecommendations(recipientId: string, occasion: string, budget: number): GiftRecommendation[] {
  // Generate some mock gift recommendations
  const mockGifts: GiftRecommendation[] = [
    {
      id: `rec_${Date.now()}_1`,
      name: 'Premium Headphones',
      description: 'Noise-cancelling headphones with high fidelity sound',
      price: Math.min(budget * 0.9, 120),
      category: 'Electronics',
      imageUrl: 'https://example.com/headphones.jpg',
      score: 95
    },
    {
      id: `rec_${Date.now()}_2`,
      name: 'Gourmet Chocolate Box',
      description: 'Assortment of premium chocolates from around the world',
      price: Math.min(budget * 0.6, 50),
      category: 'Food & Drink',
      imageUrl: 'https://example.com/chocolate.jpg',
      score: 87
    },
    {
      id: `rec_${Date.now()}_3`,
      name: 'Smart Watch',
      description: 'Health tracking and notifications on your wrist',
      price: Math.min(budget * 0.95, 200),
      category: 'Electronics',
      imageUrl: 'https://example.com/smartwatch.jpg',
      score: 82
    },
    {
      id: `rec_${Date.now()}_4`,
      name: 'Personalized Photo Album',
      description: 'Custom photo album with premium leather binding',
      price: Math.min(budget * 0.7, 60),
      category: 'Personalized',
      imageUrl: 'https://example.com/album.jpg',
      score: 78
    },
    {
      id: `rec_${Date.now()}_5`,
      name: 'Scented Candle Set',
      description: 'Set of 4 luxury scented candles in decorative jars',
      price: Math.min(budget * 0.5, 45),
      category: 'Home',
      imageUrl: 'https://example.com/candles.jpg',
      score: 73
    }
  ];
  
  // Filter by budget and adjust prices to be within budget
  return mockGifts.filter(gift => gift.price <= budget);
}

function mockProcessAutoSend(
  userId: string, 
  recipientId: string, 
  occasion: string, 
  giftRecommendation: GiftRecommendation,
  requireApproval: boolean
): {success: boolean, giftId?: string, message?: string} {
  // Generate a mock gift ID
  const giftId = `gift_${Date.now()}`;
  
  return {
    success: true,
    giftId,
    message: requireApproval 
      ? 'Gift created and pending approval' 
      : 'Gift automatically processed and ordered'
  };
}

function mockApproveAutoSendGift(giftId: string): {success: boolean, message?: string} {
  return {
    success: true,
    message: 'Gift approved and processed successfully'
  };
}

function mockDeclineAutoSendGift(giftId: string, reason?: string): {success: boolean, message?: string} {
  return {
    success: true,
    message: `Gift declined: ${reason || 'No reason provided'}`
  };
} 