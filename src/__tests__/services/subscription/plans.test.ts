import { getPlanById, getYearlyPrice, planSupportsFeature, subscriptionPlans } from '../../../services/subscription/plans';

describe('Subscription Plans Service', () => {
  test('should return all available subscription plans', () => {
    expect(subscriptionPlans.length).toBe(3);
    expect(subscriptionPlans[0].id).toBe('basic');
    expect(subscriptionPlans[1].id).toBe('standard');
    expect(subscriptionPlans[2].id).toBe('premium');
  });

  test('should retrieve a plan by ID', () => {
    const basicPlan = getPlanById('basic');
    expect(basicPlan).toBeDefined();
    expect(basicPlan?.name).toBe('Basic');
    expect(basicPlan?.price).toBe(9.99);

    const nonExistentPlan = getPlanById('nonexistent');
    expect(nonExistentPlan).toBeUndefined();
  });

  test('should calculate yearly price with discount', () => {
    // Basic plan: $9.99/month -> $9.99 * 12 * 0.8 = $95.90
    const basicYearlyPrice = getYearlyPrice('basic');
    expect(basicYearlyPrice).toBe(95.9);

    // Standard plan: $19.99/month -> $19.99 * 12 * 0.8 = $191.90
    const standardYearlyPrice = getYearlyPrice('standard');
    expect(standardYearlyPrice).toBe(191.9);

    // Non-existent plan
    const nonExistentYearlyPrice = getYearlyPrice('nonexistent');
    expect(nonExistentYearlyPrice).toBeUndefined();
  });

  test('should check if a plan supports specific features', () => {
    // Basic plan
    expect(planSupportsFeature('basic', 'priorityShipping')).toBe(false);
    expect(planSupportsFeature('basic', 'giftWrap')).toBe(false);
    expect(planSupportsFeature('basic', 'customMessages')).toBe(false);

    // Standard plan
    expect(planSupportsFeature('standard', 'priorityShipping')).toBe(true);
    expect(planSupportsFeature('standard', 'giftWrap')).toBe(true);
    expect(planSupportsFeature('standard', 'customMessages')).toBe(false);

    // Premium plan
    expect(planSupportsFeature('premium', 'priorityShipping')).toBe(true);
    expect(planSupportsFeature('premium', 'giftWrap')).toBe(true);
    expect(planSupportsFeature('premium', 'customMessages')).toBe(true);

    // Non-existent plan
    expect(planSupportsFeature('nonexistent', 'priorityShipping')).toBe(false);
  });

  test('premium plan should have unlimited recipients and gifts', () => {
    const premiumPlan = getPlanById('premium');
    expect(premiumPlan?.recipientLimit).toBe(Infinity);
    expect(premiumPlan?.giftLimit).toBe(Infinity);
  });
}); 