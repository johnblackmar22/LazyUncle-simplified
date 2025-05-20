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
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: [
      '1 recipient',
      'Birthday & Christmas gifting',
      'Standard shipping',
      'Basic gift recommendations'
    ],
    recipientLimit: 1,
    giftLimit: 2,
    priorityShipping: false,
    giftWrap: false,
    customMessages: false,
    description: 'Try Lazy Uncle with one recipient. Perfect for testing the service.'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited recipients',
      'All occasions covered',
      'Priority support',
      'AI-powered gift recommendations',
      'Automated gifting workflow'
    ],
    recipientLimit: Infinity,
    giftLimit: Infinity,
    priorityShipping: true,
    giftWrap: false,
    customMessages: true,
    description: 'Automate gifting for everyone you care about, with AI-powered recommendations and full control.'
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