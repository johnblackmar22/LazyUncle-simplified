import { giftRecommendationEngine, type GiftRecommendationRequest } from './giftRecommendationEngine';
import type { Recipient, Occasion, Gift } from '../types';
import { useGiftStore } from '../store/giftStore';
import { useRecipientStore } from '../store/recipientStore';

export interface AutoSendSettings {
  enabled: boolean;
  notificationDays: number; // Days before occasion to notify user
  autoApprovalDelay: number; // Hours to wait before auto-approval
  maxBudget: number;
  preferredCategories: string[];
  blacklistedCategories: string[];
}

export interface PendingAutoSend {
  id: string;
  recipientId: string;
  occasionId: string;
  recommendedGift: Gift;
  notificationSentAt: number;
  approvalDeadline: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'expired';
  userNotified: boolean;
}

class AutoSendService {
  private defaultSettings: AutoSendSettings = {
    enabled: true,
    notificationDays: 7,
    autoApprovalDelay: 48, // 48 hours
    maxBudget: 100,
    preferredCategories: [],
    blacklistedCategories: ['inappropriate', 'controversial']
  };

  /**
   * Check for upcoming occasions and initiate auto-send process
   */
  async checkUpcomingOccasions(): Promise<PendingAutoSend[]> {
    console.log('🔄 Checking for upcoming occasions that need auto-send...');
    
    try {
      const recipients = useRecipientStore.getState().recipients;
      const occasions = this.getUpcomingOccasions(recipients);
      const settings = this.getAutoSendSettings();
      
      if (!settings.enabled) {
        console.log('Auto-send is disabled');
        return [];
      }

      const pendingAutoSends: PendingAutoSend[] = [];

      for (const occasion of occasions) {
        const recipient = recipients.find(r => r.id === occasion.recipientId);
        if (!recipient) continue;

        // Check if we already have a pending auto-send for this occasion
        const existing = this.getPendingAutoSend(occasion.id);
        if (existing) continue;

        // Check if occasion is within notification window
        const daysUntilOccasion = this.getDaysUntilDate(occasion.date);
        if (daysUntilOccasion <= settings.notificationDays && daysUntilOccasion > 0) {
          const pendingAutoSend = await this.createPendingAutoSend(recipient, occasion, settings);
          if (pendingAutoSend) {
            pendingAutoSends.push(pendingAutoSend);
          }
        }
      }

      console.log(`🔄 Created ${pendingAutoSends.length} pending auto-sends`);
      return pendingAutoSends;
    } catch (error) {
      console.error('❌ Error checking upcoming occasions:', error);
      return [];
    }
  }

  /**
   * Process pending auto-sends that are ready for approval
   */
  async processApprovals(): Promise<void> {
    const pendingAutoSends = this.getAllPendingAutoSends();
    const now = Date.now();

    for (const pending of pendingAutoSends) {
      if (pending.status !== 'pending_approval') continue;

      // Check if approval deadline has passed
      if (now >= pending.approvalDeadline) {
        await this.autoApprovePendingSend(pending);
      }
    }
  }

  /**
   * Create a pending auto-send for an upcoming occasion
   */
  private async createPendingAutoSend(
    recipient: Recipient, 
    occasion: Occasion, 
    settings: AutoSendSettings
  ): Promise<PendingAutoSend | null> {
    try {
      console.log(`🎁 Creating auto-send for ${recipient.name}'s ${occasion.name}`);

      // Get AI recommendation
      const request: GiftRecommendationRequest = {
        recipient,
        occasion,
        budget: {
          min: Math.max(10, (occasion.budget || settings.maxBudget) * 0.5),
          max: occasion.budget || settings.maxBudget
        },
        excludeCategories: settings.blacklistedCategories,
        preferredCategories: settings.preferredCategories
      };

      const recommendations = await giftRecommendationEngine.getRecommendations(request);
      
      if (!recommendations.recommendations.length) {
        console.warn(`No recommendations found for ${recipient.name}`);
        return null;
      }

      // Select the highest confidence recommendation
      const bestRecommendation = recommendations.recommendations
        .sort((a, b) => b.confidence - a.confidence)[0];

      // Convert to Gift format
      const recommendedGift: Gift = {
        id: `auto-${Date.now()}`,
        userId: recipient.userId,
        recipientId: recipient.id,
        occasionId: occasion.id,
        name: bestRecommendation.name,
        description: bestRecommendation.description,
        price: bestRecommendation.price,
        category: bestRecommendation.category,
        status: 'idea',
        date: new Date(occasion.date).getTime(),
        imageUrl: bestRecommendation.imageUrl,
        purchaseUrl: bestRecommendation.purchaseUrl,
        notes: `Auto-selected: ${bestRecommendation.reasoning}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const pendingAutoSend: PendingAutoSend = {
        id: `pending-${Date.now()}`,
        recipientId: recipient.id,
        occasionId: occasion.id,
        recommendedGift,
        notificationSentAt: Date.now(),
        approvalDeadline: Date.now() + (settings.autoApprovalDelay * 60 * 60 * 1000),
        status: 'pending_approval',
        userNotified: false
      };

      // Save to local storage
      this.savePendingAutoSend(pendingAutoSend);

      // Send notification to user
      await this.sendUserNotification(pendingAutoSend, recipient, occasion);

      return pendingAutoSend;
    } catch (error) {
      console.error('Error creating pending auto-send:', error);
      return null;
    }
  }

  /**
   * Send notification to user about pending auto-send
   */
  private async sendUserNotification(
    pending: PendingAutoSend, 
    recipient: Recipient, 
    occasion: Occasion
  ): Promise<void> {
    const daysUntil = this.getDaysUntilDate(occasion.date);
    const approvalHours = Math.round((pending.approvalDeadline - Date.now()) / (1000 * 60 * 60));

    const notification = {
      title: `Gift ready for ${recipient.name}!`,
      message: `We've selected "${pending.recommendedGift.name}" ($${pending.recommendedGift.price}) for ${recipient.name}'s ${occasion.name} in ${daysUntil} days. It will be automatically ordered in ${approvalHours} hours unless you make changes.`,
      action: 'review_gift',
      data: {
        pendingId: pending.id,
        recipientName: recipient.name,
        occasionName: occasion.name,
        giftName: pending.recommendedGift.name,
        price: pending.recommendedGift.price
      }
    };

    // In a real app, this would send email/SMS
    console.log('📧 Notification would be sent:', notification);
    
    // For demo, we'll use browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }

    // Mark as notified
    pending.userNotified = true;
    this.savePendingAutoSend(pending);
  }

  /**
   * Auto-approve a pending send that has reached its deadline
   */
  private async autoApprovePendingSend(pending: PendingAutoSend): Promise<void> {
    console.log(`⏰ Auto-approving gift for pending send: ${pending.id}`);

    try {
      // Validate gift is still available
      const validation = await giftRecommendationEngine.validateGift(pending.recommendedGift.id);
      
      if (!validation.available) {
        console.warn('Gift no longer available, seeking alternative...');
        // Here you would get alternative recommendations
        pending.status = 'expired';
        this.savePendingAutoSend(pending);
        return;
      }

      // Add gift to user's selected gifts
      const giftStore = useGiftStore.getState();
      await giftStore.createGift({
        ...pending.recommendedGift,
        status: 'selected',
        notes: (pending.recommendedGift.notes || '') + ' [Auto-approved]'
      });

      // Update pending status
      pending.status = 'approved';
      this.savePendingAutoSend(pending);

      console.log(`✅ Auto-approved and ordered: ${pending.recommendedGift.name}`);
    } catch (error) {
      console.error('Error auto-approving pending send:', error);
      pending.status = 'expired';
      this.savePendingAutoSend(pending);
    }
  }

  /**
   * User manually approves a pending auto-send
   */
  async approvePendingSend(pendingId: string): Promise<boolean> {
    const pending = this.getPendingAutoSend(pendingId);
    if (!pending || pending.status !== 'pending_approval') {
      return false;
    }

    pending.status = 'approved';
    this.savePendingAutoSend(pending);

    // Add to selected gifts
    const giftStore = useGiftStore.getState();
    await giftStore.createGift({
      ...pending.recommendedGift,
      status: 'selected'
    });

    return true;
  }

  /**
   * User rejects a pending auto-send
   */
  rejectPendingSend(pendingId: string): boolean {
    const pending = this.getPendingAutoSend(pendingId);
    if (!pending || pending.status !== 'pending_approval') {
      return false;
    }

    pending.status = 'rejected';
    this.savePendingAutoSend(pending);
    return true;
  }

  // Utility methods
  private getUpcomingOccasions(recipients: Recipient[]): Occasion[] {
    // This would normally fetch from your database
    // For now, we'll use mock data or localStorage
    const occasions: Occasion[] = [];
    
    recipients.forEach(recipient => {
      // Add birthday if we have birthdate
      if (recipient.birthdate) {
        const birthday: Occasion = {
          id: `birthday-${recipient.id}`,
          recipientId: recipient.id,
          userId: recipient.userId,
          name: 'Birthday',
          date: this.getNextBirthday(recipient.birthdate),
          type: 'birthday',
          recurring: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        occasions.push(birthday);
      }
    });

    return occasions;
  }

  private getNextBirthday(birthdate: string): string {
    const today = new Date();
    const birth = new Date(birthdate);
    const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    if (thisYear < today) {
      thisYear.setFullYear(today.getFullYear() + 1);
    }
    
    return thisYear.toISOString().split('T')[0];
  }

  private getDaysUntilDate(dateString: string): number {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getAutoSendSettings(): AutoSendSettings {
    const saved = localStorage.getItem('lazyuncle_autosend_settings');
    return saved ? JSON.parse(saved) : this.defaultSettings;
  }

  private getAllPendingAutoSends(): PendingAutoSend[] {
    const saved = localStorage.getItem('lazyuncle_pending_autosends');
    return saved ? JSON.parse(saved) : [];
  }

  private getPendingAutoSend(occasionId: string): PendingAutoSend | null {
    const pending = this.getAllPendingAutoSends();
    return pending.find(p => p.occasionId === occasionId) || null;
  }

  private savePendingAutoSend(pending: PendingAutoSend): void {
    const all = this.getAllPendingAutoSends();
    const index = all.findIndex(p => p.id === pending.id);
    
    if (index >= 0) {
      all[index] = pending;
    } else {
      all.push(pending);
    }
    
    localStorage.setItem('lazyuncle_pending_autosends', JSON.stringify(all));
  }
}

export const autoSendService = new AutoSendService(); 