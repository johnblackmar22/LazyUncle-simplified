// Utility to calculate age from birthdate
const calculateAge = (birthdate: string): number | null => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Age-based interest categories
const getAgeBasedInterests = (age: number | null): string[] => {
  if (!age) return [];
  
  if (age <= 12) {
    // Children
    return [
      'toys', 'games', 'art supplies', 'books', 'puzzles', 'sports', 
      'science kits', 'building blocks', 'stuffed animals', 'music', 
      'outdoor play', 'crafts', 'board games'
    ];
  } else if (age <= 17) {
    // Teenagers
    return [
      'music', 'gaming', 'sports', 'fashion', 'technology', 'art',
      'photography', 'social media', 'movies', 'books', 'skateboarding',
      'makeup', 'fitness', 'cooking', 'anime', 'streaming', 'headphones'
    ];
  } else if (age <= 30) {
    // Young adults
    return [
      'travel', 'fitness', 'cooking', 'technology', 'music', 'movies',
      'books', 'fashion', 'photography', 'gaming', 'outdoor activities',
      'career development', 'coffee', 'concerts', 'social media', 'art',
      'nightlife', 'festivals', 'wellness', 'gadgets'
    ];
  } else if (age <= 50) {
    // Middle-aged adults
    return [
      'cooking', 'wine', 'travel', 'gardening', 'books', 'fitness',
      'home improvement', 'family time', 'career', 'investing',
      'outdoor activities', 'photography', 'music', 'art', 'wellness',
      'craft beer', 'technology', 'movies', 'podcasts', 'golf'
    ];
  } else {
    // Seniors
    return [
      'gardening', 'reading', 'travel', 'cooking', 'family time',
      'history', 'music', 'art', 'crafts', 'wellness', 'nature',
      'photography', 'grandchildren', 'puzzles', 'bridge', 'golf',
      'volunteering', 'birdwatching', 'antiques', 'classical music'
    ];
  }
};

// Gender-based interest modifications
const getGenderInfluencedInterests = (baseInterests: string[], gender: string): string[] => {
  const genderSpecific: Record<string, string[]> = {
    male: [
      'sports cars', 'woodworking', 'grilling', 'beer', 'watches',
      'tools', 'motorcycles', 'fishing', 'hunting', 'cigars',
      'electronics', 'video games', 'sports memorabilia'
    ],
    female: [
      'jewelry', 'skincare', 'makeup', 'handbags', 'spa treatments',
      'flowers', 'candles', 'home decor', 'fashion', 'yoga',
      'nail art', 'aromatherapy', 'romance novels'
    ],
    other: [
      'activism', 'community', 'self-expression', 'art', 'music',
      'literature', 'philosophy', 'equality', 'volunteering'
    ]
  };

  const specificInterests = genderSpecific[gender] || [];
  return [...baseInterests, ...specificInterests];
};

// Main function to get interest suggestions
export const getInterestSuggestions = (
  birthdate: string, 
  gender?: string
): string[] => {
  const age = calculateAge(birthdate);
  const baseInterests = getAgeBasedInterests(age);
  
  if (!gender || gender === 'other') {
    return baseInterests.slice(0, 24); // Limit to 24 suggestions
  }
  
  const genderInfluenced = getGenderInfluencedInterests(baseInterests, gender);
  
  // Remove duplicates and limit to reasonable number
  const uniqueInterests = [...new Set(genderInfluenced)];
  return uniqueInterests.slice(0, 24); // Limit to 24 suggestions
};

// Helper to get age group label for display
export const getAgeGroupLabel = (birthdate: string): string => {
  const age = calculateAge(birthdate);
  if (!age) return '';
  
  if (age <= 12) return 'Child';
  if (age <= 17) return 'Teen';
  if (age <= 30) return 'Young Adult';
  if (age <= 50) return 'Adult';
  return 'Senior';
}; 