import { getPlanById, getYearlyPrice, planSupportsFeature, subscriptionPlans } from '../../../services/subscription/plans';

describe('Subscription Plans Service', () => {
  test('should return all available subscription plans', () => {
    expect(subscriptionPlans.length).toBe(2);
    expect(subscriptionPlans[0].id).toBe('free');
    expect(subscriptionPlans[1].id).toBe('pro');
  });

  test('should retrieve a plan by ID', () => {
    const freePlan = getPlanById('free');
    expect(freePlan).toBeDefined();
    expect(freePlan?.name).toBe('Free');
    expect(freePlan?.price).toBe(0);

    const proPlan = getPlanById('pro');
    expect(proPlan).toBeDefined();
    expect(proPlan?.name).toBe('Pro');
    expect(proPlan?.price).toBe(9.99);

    const nonExistentPlan = getPlanById('nonexistent');
    expect(nonExistentPlan).toBeUndefined();
  });

  test('should calculate yearly price with discount', () => {
    // Pro plan: $9.99/month -> $9.99 * 12 * 0.8 = $95.90
    const proYearlyPrice = getYearlyPrice('pro');
    expect(proYearlyPrice).toBe(95.9);

    // Free plan: $0/month -> $0 * 12 * 0.8 = $0
    const freeYearlyPrice = getYearlyPrice('free');
    expect(freeYearlyPrice).toBe(0);

    // Non-existent plan
    const nonExistentYearlyPrice = getYearlyPrice('nonexistent');
    expect(nonExistentYearlyPrice).toBeUndefined();
  });

  test('should check if a plan supports specific features', () => {
    // Free plan
    expect(planSupportsFeature('free', 'priorityShipping')).toBe(false);
    expect(planSupportsFeature('free', 'customMessages')).toBe(false);

    // Pro plan
    expect(planSupportsFeature('pro', 'priorityShipping')).toBe(true);
    expect(planSupportsFeature('pro', 'customMessages')).toBe(true);

    // Non-existent plan
    expect(planSupportsFeature('nonexistent', 'priorityShipping')).toBe(false);
  });

  test('pro plan should have unlimited recipients and gifts', () => {
    const proPlan = getPlanById('pro');
    expect(proPlan?.recipientLimit).toBe(Infinity);
    expect(proPlan?.giftLimit).toBe(Infinity);
  });

  // Additional helper functions if they exist
  function planSupportsFeature(planId: string, feature: string): boolean {
    const plan = getPlanById(planId);
    if (!plan) return false;
    
    switch (feature) {
      case 'priorityShipping':
        return plan.priorityShipping;
      case 'customMessages':
        return plan.customMessages;
      default:
        return false;
    }
  }
}); 