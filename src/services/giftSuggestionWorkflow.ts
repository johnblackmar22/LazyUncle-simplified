import type { Recipient, Occasion, GiftSuggestion, Gift } from '../types';
import { getGiftRecommendationsFromAI } from './giftRecommendationEngine';
import { useGiftStore } from '../store/giftStore';

export interface GiftApprovalStatus {
  occasionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  selectedSuggestion?: GiftSuggestion;
  approvedAt?: Date;
  rejectedAt?: Date;
  userNotes?: string;
}

export interface GiftPreview {
  occasionId: string;
  recipientId: string;
  suggestions: GiftSuggestion[];
  generatedAt: Date;
  status: 'preview_shown' | 'approved' | 'rejected' | 'modified';
  approvalStatus?: GiftApprovalStatus;
}

class GiftSuggestionWorkflowService {
  private static previews: { [occasionId: string]: GiftPreview } = {};

  /**
   * Step 1: Generate gift suggestions immediately when occasion is created
   */
  static async generatePreviewSuggestions(
    recipient: Recipient,
    occasion: Occasion
  ): Promise<GiftPreview> {
    console.log('=== GENERATING PREVIEW SUGGESTIONS ===');
    console.log('Recipient:', recipient.name);
    console.log('Occasion:', occasion.name);
    console.log('Budget:', occasion.budget);

    try {
      // Get past gifts for this recipient to avoid duplicates
      const pastGifts = this.getPastGifts(recipient.id);
      
      // Generate AI-powered suggestions
      const suggestions = await getGiftRecommendationsFromAI({
        recipient: {
          name: recipient.name,
          interests: recipient.interests || [],
          age: this.calculateAge(recipient.birthdate),
          relationship: recipient.relationship,
          description: recipient.description,
        },
        budget: occasion.budget || 50,
        pastGifts: pastGifts.map(g => ({ name: g.name, category: g.category })),
      });

      const preview: GiftPreview = {
        occasionId: occasion.id,
        recipientId: recipient.id,
        suggestions: suggestions.slice(0, 3), // Top 3 suggestions
        generatedAt: new Date(),
        status: 'preview_shown',
      };

      // Store preview for later reference
      this.previews[occasion.id] = preview;

      console.log('Generated suggestions:', suggestions.length);
      return preview;
    } catch (error) {
      console.error('Error generating preview suggestions:', error);
      
      // Fallback to local suggestions if AI fails
      const fallbackSuggestions = this.getFallbackSuggestions(recipient, occasion);
      
      const preview: GiftPreview = {
        occasionId: occasion.id,
        recipientId: recipient.id,
        suggestions: fallbackSuggestions,
        generatedAt: new Date(),
        status: 'preview_shown',
      };

      this.previews[occasion.id] = preview;
      return preview;
    }
  }

  /**
   * Step 2: Handle user approval/rejection of suggestions
   */
  static async handleUserApproval(
    occasionId: string,
    action: 'approve' | 'reject' | 'modify',
    selectedSuggestion?: GiftSuggestion,
    userNotes?: string
  ): Promise<void> {
    const preview = this.previews[occasionId];
    if (!preview) {
      throw new Error('Preview not found for occasion');
    }

    const approvalStatus: GiftApprovalStatus = {
      occasionId,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified',
      selectedSuggestion,
      approvedAt: action === 'approve' ? new Date() : undefined,
      rejectedAt: action === 'reject' ? new Date() : undefined,
      userNotes,
    };

    preview.approvalStatus = approvalStatus;
    preview.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified';

    // If approved, create a planned gift
    if (action === 'approve' && selectedSuggestion) {
      await this.createPlannedGift(preview, selectedSuggestion);
    }

    console.log(`User ${action}ed suggestion for occasion ${occasionId}`);
  }

  /**
   * Step 3: Create a planned gift when user approves
   */
  private static async createPlannedGift(
    preview: GiftPreview,
    suggestion: GiftSuggestion
  ): Promise<void> {
    const { createGift } = useGiftStore.getState();

    await createGift({
      recipientId: preview.recipientId,
      name: suggestion.name,
      description: suggestion.description || '',
      price: suggestion.price,
      category: suggestion.category,
      occasionId: preview.occasionId,
      date: new Date(), // Will be updated based on occasion timing
      status: 'planned',
      notes: `Auto-suggested gift. User approved on ${new Date().toLocaleDateString()}`,
    });

    console.log('Created planned gift:', suggestion.name);
  }

  /**
   * Get past gifts for recipient to avoid duplicates
   */
  private static getPastGifts(recipientId: string): Gift[] {
    const { gifts } = useGiftStore.getState();
    return gifts.filter(gift => gift.recipientId === recipientId);
  }

  /**
   * Calculate age from birthdate
   */
  private static calculateAge(birthdate?: string): number {
    if (!birthdate) return 30; // Default age
    
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Fallback suggestions when AI fails
   */
  private static getFallbackSuggestions(recipient: Recipient, occasion: Occasion): GiftSuggestion[] {
    const budget = occasion.budget || 50;
    const interests = recipient.interests || [];
    
    const fallbacks: GiftSuggestion[] = [
      {
        id: 'fallback-1',
        name: 'Gift Card',
        description: `A ${budget <= 25 ? '$25' : budget <= 50 ? '$50' : '$100'} gift card to their favorite store`,
        price: Math.min(budget * 0.8, 50),
        category: 'Gift Cards',
        tags: ['safe', 'versatile', 'always appreciated'],
      },
      {
        id: 'fallback-2',
        name: interests.includes('Books') ? 'Book Collection' : 'Gourmet Treats',
        description: interests.includes('Books') 
          ? 'A carefully curated selection of books in their favorite genre'
          : 'An assortment of gourmet chocolates and treats',
        price: Math.min(budget * 0.6, 40),
        category: interests.includes('Books') ? 'Books' : 'Food & Drink',
        tags: interests.includes('Books') ? ['personalized', 'thoughtful'] : ['delicious', 'luxury'],
      },
      {
        id: 'fallback-3',
        name: 'Personalized Item',
        description: `A custom ${occasion.name.toLowerCase()} gift with their name or initials`,
        price: Math.min(budget * 0.7, 45),
        category: 'Personalized',
        tags: ['unique', 'memorable', 'special'],
      },
    ];

    return fallbacks.filter(f => f.price <= budget).slice(0, 3);
  }

  /**
   * Get preview for an occasion
   */
  static getPreview(occasionId: string): GiftPreview | undefined {
    return this.previews[occasionId];
  }

  /**
   * Clear preview (for cleanup)
   */
  static clearPreview(occasionId: string): void {
    delete this.previews[occasionId];
  }

  /**
   * Get all previews (for debugging)
   */
  static getAllPreviews(): { [occasionId: string]: GiftPreview } {
    return { ...this.previews };
  }

  /**
   * Generate suggestions for an occasion (alias for generatePreviewSuggestions)
   */
  static async generateSuggestions(occasion: Occasion, recipient: Recipient): Promise<GiftPreview> {
    return this.generatePreviewSuggestions(recipient, occasion);
  }

  /**
   * Approve a specific suggestion
   */
  static async approveSuggestion(occasionId: string, suggestion: GiftSuggestion): Promise<void> {
    return this.handleUserApproval(occasionId, 'approve', suggestion);
  }

  /**
   * Reject all suggestions for an occasion
   */
  static async rejectSuggestions(occasionId: string, userNotes?: string): Promise<void> {
    return this.handleUserApproval(occasionId, 'reject', undefined, userNotes);
  }
}

export default GiftSuggestionWorkflowService; 