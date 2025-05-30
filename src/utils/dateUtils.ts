import { format, isAfter, isBefore, addDays, subDays, parseISO, startOfDay } from 'date-fns';

/**
 * Format a date string to a more readable format
 * @param dateString Date in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted date (e.g., "January 15, 1990")
 */
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // Create date from YYYY-MM-DD string in local timezone to avoid UTC issues
    const [year, month, day] = date.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'MMM dd, yyyy');
  }
  return format(date, 'MMM dd, yyyy');
};

/**
 * Calculate days until a date, accounting for yearly recurrence
 * @param dateString Date in ISO format (YYYY-MM-DD)
 * @returns Number of days until the date
 */
export const getDaysUntil = (dateString: string): number => {
  if (!dateString) return Infinity;
  
  try {
    // Create date objects in local timezone
    const today = startOfDay(new Date());
    
    // Parse the date, but use current year in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    let nextOccurrence = new Date(today.getFullYear(), month - 1, day);
    
    // If the date has already passed this year, use next year
    if (nextOccurrence < today) {
      nextOccurrence = new Date(today.getFullYear() + 1, month - 1, day);
    }
    
    // Calculate the difference in days
    const diffTime = nextOccurrence.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days until date:', error);
    return Infinity;
  }
};

/**
 * Get the current date in ISO format (YYYY-MM-DD) in local timezone
 * @returns Current date in ISO format
 */
export const getCurrentDateISO = (): string => {
  const date = new Date();
  // Use local timezone to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const days = Array.from({ length: 31 }, (_, i) => i + 1);
export const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);

export const safeFormatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  try {
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Calculate the next occurrence of an annual date (birthday, anniversary, Christmas) in local timezone
export const getNextOccurrence = (monthDay: string, referenceYear?: number): string => {
  try {
    const [month, day] = monthDay.split('-').map(Number);
    const currentYear = referenceYear || new Date().getFullYear();
    const today = startOfDay(new Date());
    
    // Create this year's occurrence in local timezone
    const thisYearDate = new Date(currentYear, month - 1, day);
    
    // If this year's date has already passed, use next year
    if (isBefore(thisYearDate, today) || (thisYearDate.toDateString() === today.toDateString())) {
      const nextYearDate = new Date(currentYear + 1, month - 1, day);
      return format(nextYearDate, 'yyyy-MM-dd');
    }
    
    return format(thisYearDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error calculating next occurrence:', error);
    return '';
  }
};

// Get the next birthday date from a birthdate string in local timezone
export const getNextBirthday = (birthdate: string): string => {
  try {
    const [year, month, day] = birthdate.split('-').map(Number);
    // Use just the month-day to calculate next occurrence
    return getNextOccurrence(`${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
  } catch (error) {
    console.error('Error calculating next birthday:', error);
    return '';
  }
};

// Get the next Christmas date in local timezone
export const getNextChristmas = (): string => {
  return getNextOccurrence('12-25');
}; 