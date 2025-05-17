/**
 * Subscription plans for LazyUncle service
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  recipientLimit: number;
  giftLimit: number; // Gifts per year per recipient
  priorityShipping: boolean;
  giftWrap: boolean;
  customMessages: boolean;
  description: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    billingCycle: 'monthly',
    features: [
      'Up to 3 recipients',
      'Birthday & Christmas gifting',
      'Standard shipping',
      'Basic gift recommendations'
    ],
    recipientLimit: 3,
    giftLimit: 2,
    priorityShipping: false,
    giftWrap: false,
    customMessages: false,
    description: 'Perfect for keeping in touch with your closest family members.'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 19.99,
    billingCycle: 'monthly',
    features: [
      'Up to 10 recipients',
      'All important occasions',
      'Priority shipping',
      'Free gift wrapping',
      'Personalized gift recommendations'
    ],
    recipientLimit: 10,
    giftLimit: 4,
    priorityShipping: true,
    giftWrap: true,
    customMessages: false,
    description: 'Never miss an important occasion with our most popular plan.'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited recipients',
      'All occasions covered',
      'Premium shipping',
      'Luxury gift wrapping',
      'AI-powered gift recommendations',
      'Custom gift messages',
      'Dedicated gift concierge'
    ],
    recipientLimit: Infinity,
    giftLimit: Infinity,
    priorityShipping: true,
    giftWrap: true,
    customMessages: true,
    description: 'The ultimate hands-off gifting experience for those who want the best.'
  }
];

/**
 * Get subscription plan by ID
 */
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return subscriptionPlans.find(plan => plan.id === planId);
};

/**
 * Get yearly price (with discount) for a subscription plan
 */
export const getYearlyPrice = (planId: string): number | undefined => {
  const plan = getPlanById(planId);
  if (!plan) return undefined;
  
  // Apply 20% discount for yearly billing
  return Number((plan.price * 12 * 0.8).toFixed(2));
};

/**
 * Check if a plan supports a specific feature
 */
export const planSupportsFeature = (planId: string, feature: keyof SubscriptionPlan): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return false;
  
  return Boolean(plan[feature]);
}; 