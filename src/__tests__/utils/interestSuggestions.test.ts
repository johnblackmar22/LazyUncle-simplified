import { getInterestSuggestions, getAgeGroupLabel } from '../../utils/interestSuggestions';

describe('Interest Suggestions', () => {
  describe('getInterestSuggestions', () => {
    it('should return child interests for ages 0-12', () => {
      const suggestions = getInterestSuggestions('2015-01-01'); // ~10 years old
      expect(suggestions).toContain('toys');
      expect(suggestions).toContain('games');
      expect(suggestions).toContain('art supplies');
    });

    it('should return teen interests for ages 13-17', () => {
      const suggestions = getInterestSuggestions('2008-01-01'); // ~16 years old
      expect(suggestions).toContain('music');
      expect(suggestions).toContain('gaming');
      expect(suggestions).toContain('technology');
    });

    it('should return young adult interests for ages 18-30', () => {
      const suggestions = getInterestSuggestions('1995-01-01'); // ~29 years old
      expect(suggestions).toContain('travel');
      expect(suggestions).toContain('fitness');
      expect(suggestions).toContain('cooking');
    });

    it('should return adult interests for ages 31-50', () => {
      const suggestions = getInterestSuggestions('1980-01-01'); // ~44 years old
      expect(suggestions).toContain('wine');
      expect(suggestions).toContain('gardening');
      expect(suggestions).toContain('home improvement');
    });

    it('should return senior interests for ages 51+', () => {
      const suggestions = getInterestSuggestions('1960-01-01'); // ~64 years old
      expect(suggestions).toContain('gardening');
      expect(suggestions).toContain('reading');
      expect(suggestions).toContain('history');
    });

    it('should include gender-specific interests for males', () => {
      const suggestions = getInterestSuggestions('1990-01-01', 'male'); // ~34 years old male
      expect(suggestions).toContain('grilling');
      // Use a more common one that should definitely be there
      expect(suggestions.some(s => ['tools', 'beer', 'electronics', 'grilling'].includes(s))).toBe(true);
    });

    it('should include gender-specific interests for females', () => {
      const suggestions = getInterestSuggestions('1990-01-01', 'female'); // ~34 years old female
      expect(suggestions).toContain('jewelry');
      // Use a more common one that should definitely be there
      expect(suggestions.some(s => ['jewelry', 'skincare', 'candles', 'yoga'].includes(s))).toBe(true);
    });

    it('should return empty array for invalid birthdate', () => {
      const suggestions = getInterestSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('should limit results to 24 suggestions', () => {
      const suggestions = getInterestSuggestions('1990-01-01', 'male');
      expect(suggestions.length).toBeLessThanOrEqual(24);
    });

    it('should not contain duplicates', () => {
      const suggestions = getInterestSuggestions('1990-01-01', 'male');
      const uniqueSuggestions = [...new Set(suggestions)];
      expect(suggestions.length).toBe(uniqueSuggestions.length);
    });
  });

  describe('getAgeGroupLabel', () => {
    it('should return "Child" for ages 0-12', () => {
      expect(getAgeGroupLabel('2015-01-01')).toBe('Child');
    });

    it('should return "Teen" for ages 13-17', () => {
      expect(getAgeGroupLabel('2008-01-01')).toBe('Teen');
    });

    it('should return "Young Adult" for ages 18-30', () => {
      expect(getAgeGroupLabel('1995-01-01')).toBe('Young Adult');
    });

    it('should return "Adult" for ages 31-50', () => {
      expect(getAgeGroupLabel('1980-01-01')).toBe('Adult');
    });

    it('should return "Senior" for ages 51+', () => {
      expect(getAgeGroupLabel('1960-01-01')).toBe('Senior');
    });

    it('should return empty string for invalid birthdate', () => {
      expect(getAgeGroupLabel('')).toBe('');
    });
  });
}); 