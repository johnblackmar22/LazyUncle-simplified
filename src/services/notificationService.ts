// This is a mock notification service
// In a real application, you would integrate with actual email and SMS providers

import type { UserSettings } from '../types/settings';
import { useRecipientStore } from '../store/recipientStore';
import { useGiftStore } from '../store/giftStore';

// Interface for notification payloads
export interface NotificationPayload {
  recipientId: string;
  recipientName: string;
  giftName: string;
  giftDate: Date;
  eventType: 'birthday' | 'anniversary' | 'holiday' | 'other';
  message?: string;
}

interface UpcomingGift {
  recipientName: string;
  giftTitle: string;
  occasionName: string;
  daysUntil: number;
}

/**
 * Send an email notification
 */
export const sendEmailNotification = async (
  email: string,
  payload: NotificationPayload
): Promise<{ success: boolean; message: string }> => {
  // In a real application, this would connect to an email service like SendGrid, Mailgun, etc.
  console.log(`Sending email notification to ${email}:`, payload);
  
  // Simulate successful API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Email notification sent to ${email} successfully`
      });
    }, 1000);
  });
};

/**
 * Send a text (SMS) notification
 */
export const sendTextNotification = async (
  phoneNumber: string,
  payload: NotificationPayload
): Promise<{ success: boolean; message: string }> => {
  // In a real application, this would connect to an SMS service like Twilio, etc.
  console.log(`Sending text notification to ${phoneNumber}:`, payload);
  
  // Simulate successful API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Text notification sent to ${phoneNumber} successfully`
      });
    }, 1000);
  });
};

/**
 * Check for upcoming gifts and send reminders based on user settings
 */
export const checkAndSendReminders = async (settings: UserSettings): Promise<void> => {
  if (!settings.emailNotifications && !settings.textNotifications) {
    console.log('All notifications are disabled.');
    return;
  }

  try {
    // Use proper stores instead of hardcoded localStorage
    const { gifts } = useGiftStore.getState();
    const { recipients } = useRecipientStore.getState();
    
    if (!gifts.length) {
      console.log('No upcoming gifts to check.');
      return;
    }

    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + settings.reminderDays);

    // Find gifts that need reminders
    const giftsToRemind = gifts.filter((gift) => {
      const giftDate = new Date(gift.date);
      return giftDate >= today && giftDate <= reminderDate && gift.status === 'selected';
    });

    if (!giftsToRemind.length) {
      console.log('No gifts need reminders at this time.');
      return;
    }

    // Send notifications for each gift
    for (const gift of giftsToRemind) {
      const recipient = recipients.find((r) => r.id === gift.recipientId);
      
      if (!recipient) continue;

      const notificationPayload: NotificationPayload = {
        recipientId: recipient.id,
        recipientName: recipient.name,
        giftName: gift.name,
        giftDate: new Date(gift.date),
        eventType: gift.category.toLowerCase() as any || 'other',
        message: `Reminder: ${gift.name} for ${recipient.name} is coming up in ${settings.reminderDays} days!`
      };

      // Send email notification if enabled
      if (settings.emailNotifications && settings.email) {
        await sendEmailNotification(settings.email, notificationPayload);
      }

      // Send text notification if enabled
      if (settings.textNotifications && settings.phoneNumber) {
        await sendTextNotification(settings.phoneNumber, notificationPayload);
      }
    }

    console.log('Reminder check completed.');
  } catch (error) {
    console.error('Error checking for reminders:', error);
  }
};

class NotificationService {
  static getUpcomingGifts(days: number = 7): UpcomingGift[] {
    const { gifts } = useGiftStore.getState();
    const { recipients } = useRecipientStore.getState();
    
    const now = new Date();
    const upcomingGifts: UpcomingGift[] = [];

    gifts.forEach(gift => {
      const giftDate = new Date(gift.date);
      const timeDiff = giftDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff > 0 && daysDiff <= days && gift.status === 'selected') {
        const recipient = recipients.find(r => r.id === gift.recipientId);
        if (recipient) {
          upcomingGifts.push({
            recipientName: recipient.name,
            giftTitle: gift.name,
            occasionName: gift.category, // Using category as occasion name
            daysUntil: daysDiff,
          });
        }
      }
    });

    return upcomingGifts.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  static getOverdueGifts(): UpcomingGift[] {
    const { gifts } = useGiftStore.getState();
    const { recipients } = useRecipientStore.getState();
    
    const now = new Date();
    const overdueGifts: UpcomingGift[] = [];

    gifts.forEach(gift => {
      const giftDate = new Date(gift.date);
      const timeDiff = now.getTime() - giftDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff > 0 && (gift.status === 'idea' || gift.status === 'selected')) {
        const recipient = recipients.find(r => r.id === gift.recipientId);
        if (recipient) {
          overdueGifts.push({
            recipientName: recipient.name,
            giftTitle: gift.name,
            occasionName: gift.category,
            daysUntil: -daysDiff, // Negative for overdue
          });
        }
      }
    });

    return overdueGifts.sort((a, b) => b.daysUntil - a.daysUntil); // Most overdue first
  }
}

export default NotificationService; 