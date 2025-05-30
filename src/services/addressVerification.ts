import type { Address } from '../types';

export interface AddressValidationResult {
  isValid: boolean;
  suggestions?: Address[];
  errors?: string[];
  standardizedAddress?: Address;
}

// US states for validation
const US_STATES = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA',
  'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
  'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
];

/**
 * Simple address validation service
 * TODO: Replace with real address verification service like USPS, Google Places API, or SmartyStreets
 */
export class AddressVerificationService {
  
  /**
   * Validates a US address
   * @param address The address to validate
   * @returns Promise with validation result
   */
  static async validateAddress(address: Partial<Address>): Promise<AddressValidationResult> {
    const errors: string[] = [];
    
    // Basic validation
    if (!address.line1?.trim()) {
      errors.push('Street address is required');
    }
    
    if (!address.city?.trim()) {
      errors.push('City is required');
    }
    
    if (!address.state?.trim()) {
      errors.push('State is required');
    } else if (!US_STATES.includes(address.state.toUpperCase())) {
      errors.push('Please enter a valid US state (2-letter code)');
    }
    
    if (!address.postalCode?.trim()) {
      errors.push('ZIP code is required');
    } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode.trim())) {
      errors.push('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
    }
    
    // If basic validation fails, return early
    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, we'll consider most addresses valid and standardize them
    const standardizedAddress: Address = {
      line1: this.standardizeStreetAddress(address.line1!),
      line2: address.line2?.trim() || undefined,
      city: this.titleCase(address.city!.trim()),
      state: address.state!.toUpperCase().trim(),
      postalCode: this.standardizeZipCode(address.postalCode!.trim()),
      country: 'US'
    };
    
    // Mock some invalid addresses for testing
    const invalidCities = ['invalid', 'test', 'fake'];
    if (invalidCities.includes(address.city!.toLowerCase().trim())) {
      return {
        isValid: false,
        errors: ['Address could not be verified. Please check the city name.'],
        suggestions: [
          {
            ...standardizedAddress,
            city: 'Springfield'
          }
        ]
      };
    }
    
    return {
      isValid: true,
      standardizedAddress
    };
  }
  
  /**
   * Gets address suggestions based on partial input
   * @param partialAddress Partial address to get suggestions for
   * @returns Promise with address suggestions
   */
  static async getAddressSuggestions(partialAddress: string): Promise<Address[]> {
    // Simple mock suggestions
    if (!partialAddress || partialAddress.length < 3) {
      return [];
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock suggestions based on common addresses
    const mockSuggestions: Address[] = [
      {
        line1: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US'
      },
      {
        line1: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        country: 'US'
      }
    ];
    
    return mockSuggestions.filter(addr => 
      addr.line1.toLowerCase().includes(partialAddress.toLowerCase()) ||
      addr.city.toLowerCase().includes(partialAddress.toLowerCase())
    );
  }
  
  private static standardizeStreetAddress(address: string): string {
    return address.trim()
      .replace(/\bst\b/gi, 'Street')
      .replace(/\bave\b/gi, 'Avenue')
      .replace(/\brd\b/gi, 'Road')
      .replace(/\bdr\b/gi, 'Drive')
      .replace(/\bln\b/gi, 'Lane')
      .replace(/\bct\b/gi, 'Court')
      .replace(/\bpl\b/gi, 'Place');
  }
  
  private static titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  private static standardizeZipCode(zip: string): string {
    // Ensure 5-digit zip codes are properly formatted
    if (/^\d{5}$/.test(zip)) {
      return zip;
    }
    // Handle 9-digit zip codes
    if (/^\d{9}$/.test(zip)) {
      return `${zip.slice(0, 5)}-${zip.slice(5)}`;
    }
    return zip;
  }
}

export default AddressVerificationService; 