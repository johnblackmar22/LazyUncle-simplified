// localStorage keys used throughout the app
export const STORAGE_KEYS = {
  RECIPIENTS: 'lazyuncle_recipients',
  OCCASIONS: (recipientId: string) => `lazyuncle_occasions_${recipientId}`,
  DEMO_MODE: 'lazyuncle_demoMode',
  GIFTS: 'lazyuncle_gifts',
  USER_SETTINGS: 'lazyuncle_userSettings',
} as const;

// Firebase collection names
export const COLLECTIONS = {
  RECIPIENTS: 'recipients',
  OCCASIONS: 'occasions',
  GIFTS: 'gifts',
  USERS: 'users',
} as const;

// Demo user ID constant
export const DEMO_USER_ID = 'demo-user';

// Default values
export const DEFAULTS = {
  BUDGET: 50,
  REMINDER_DAYS: 7,
  AUTO_SEND_ENABLED: false,
  REQUIRE_APPROVAL: true,
} as const; 