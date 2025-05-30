// Types for user settings

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  reminderDays: number;
  emailNotifications: boolean;
  textNotifications: boolean;
  calendarSync: boolean;
  language: string;
  currency: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  email: string;
  phoneNumber: string;
}

// Default settings that can be used throughout the app
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  reminderDays: 7,
  emailNotifications: true,
  textNotifications: false,
  calendarSync: false,
  language: 'en',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  email: '',
  phoneNumber: '',
}; 