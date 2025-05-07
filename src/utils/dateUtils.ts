/**
 * Format a date string to a more readable format
 * @param dateString Date in ISO format (YYYY-MM-DD)
 * @returns Formatted date (e.g., "January 15, 1990")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Calculate days until a date, accounting for yearly recurrence
 * @param dateString Date in ISO format (YYYY-MM-DD)
 * @returns Number of days until the date
 */
export const getDaysUntil = (dateString: string): number => {
  if (!dateString) return Infinity;
  
  try {
    // Create date objects
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse the date, but use current year
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
 * Get the current date in ISO format (YYYY-MM-DD)
 * @returns Current date in ISO format
 */
export const getCurrentDateISO = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0];
}; 