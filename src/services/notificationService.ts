// This is a mock notification service
// In a real application, you would integrate with actual email and SMS providers

import type { UserSettings } from '../types/settings';

// Interface for notification payloads
export interface NotificationPayload {
  recipientId: string;
  recipientName: string;
  giftName: string;
  giftDate: Date;
  eventType: 'birthday' | 'anniversary' | 'holiday' | 'other';
  message?: string;
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
    // In a real app, you would fetch the user's upcoming gifts from a database
    // For this demo, we'll simulate it
    const upcomingGifts = JSON.parse(localStorage.getItem('lazyuncle_gifts') || '[]');
    const recipients = JSON.parse(localStorage.getItem('lazyuncle_recipients') || '[]');
    
    if (!upcomingGifts.length) {
      console.log('No upcoming gifts to check.');
      return;
    }

    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + settings.reminderDays);

    // Find gifts that need reminders
    const giftsToRemind = upcomingGifts.filter((gift: any) => {
      const giftDate = new Date(gift.date);
      return giftDate >= today && giftDate <= reminderDate;
    });

    if (!giftsToRemind.length) {
      console.log('No gifts need reminders at this time.');
      return;
    }

    // Send notifications for each gift
    for (const gift of giftsToRemind) {
      const recipient = recipients.find((r: any) => r.id === gift.recipientId);
      
      if (!recipient) continue;

      const notificationPayload: NotificationPayload = {
        recipientId: recipient.id,
        recipientName: recipient.name,
        giftName: gift.name,
        giftDate: new Date(gift.date),
        eventType: gift.occasion?.toLowerCase() || 'other',
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