import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
  FormErrorMessage,
  FormHelperText,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import type { Address } from '../types';
import AddressVerificationService from '../services/addressVerification';
import type { AddressValidationResult } from '../services/addressVerification';

// US states for the dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

interface AddressFormProps {
  address?: Address;
  onChange: (address: Address | undefined) => void;
  isRequired?: boolean;
  label?: string;
  helperText?: string;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onChange,
  isRequired = false,
  label = "Delivery Address",
  helperText = "Where should gifts be delivered for this recipient?"
}) => {
  const toast = useToast();
  
  // Local form state
  const [line1, setLine1] = useState(address?.line1 || '');
  const [line2, setLine2] = useState(address?.line2 || '');
  const [city, setCity] = useState(address?.city || '');
  const [state, setState] = useState(address?.state || '');
  const [postalCode, setPostalCode] = useState(address?.postalCode || '');
  
  // Validation state
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasBeenValidated, setHasBeenValidated] = useState(false);
  
  // Memoize the onChange callback to prevent infinite re-renders
  const handleAddressChange = useCallback(() => {
    console.log('AddressForm - handleAddressChange called with:', { line1, line2, city, state, postalCode });
    
    if (line1 || line2 || city || state || postalCode) {
      const newAddress: Address = {
        line1,
        line2: line2 || undefined,
        city,
        state,
        postalCode,
        country: 'US'
      };
      console.log('AddressForm - Calling onChange with:', newAddress);
      onChange(newAddress);
    } else {
      console.log('AddressForm - Calling onChange with undefined (empty address)');
      onChange(undefined);
    }
  }, [line1, line2, city, state, postalCode, onChange]);
  
  // Update parent when local state changes
  useEffect(() => {
    handleAddressChange();
  }, [handleAddressChange]);
  
  // Update local state when address prop changes
  useEffect(() => {
    if (address) {
      setLine1(address.line1 || '');
      setLine2(address.line2 || '');
      setCity(address.city || '');
      setState(address.state || '');
      setPostalCode(address.postalCode || '');
    }
  }, [address]);
  
  const handleValidateAddress = async () => {
    const currentAddress = {
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: 'US'
    };
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const result = await AddressVerificationService.validateAddress(currentAddress);
      setValidationResult(result);
      setHasBeenValidated(true);
      
      if (result.isValid && result.standardizedAddress) {
        // Update form with standardized address
        setLine1(result.standardizedAddress.line1);
        setLine2(result.standardizedAddress.line2 || '');
        setCity(result.standardizedAddress.city);
        setState(result.standardizedAddress.state);
        setPostalCode(result.standardizedAddress.postalCode);
        
        toast({
          title: 'Address Verified',
          description: 'Address has been verified and standardized.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (result.errors && result.errors.length > 0) {
        toast({
          title: 'Address Validation Failed',
          description: result.errors[0],
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Address validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Unable to verify address. Please check your connection.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleUseSuggestion = (suggestion: Address) => {
    setLine1(suggestion.line1);
    setLine2(suggestion.line2 || '');
    setCity(suggestion.city);
    setState(suggestion.state);
    setPostalCode(suggestion.postalCode);
    setValidationResult(null);
    setHasBeenValidated(false);
  };
  
  const isFormFilled = line1.trim() && city.trim() && state.trim() && postalCode.trim();
  
  return (
    <Box>
      <FormControl isRequired={isRequired} mb={4}>
        <FormLabel>{label}</FormLabel>
        <FormHelperText mb={3}>{helperText}</FormHelperText>
        
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={validationResult?.errors?.some(e => e.includes('Street'))}>
            <FormLabel>Street Address</FormLabel>
            <Input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="123 Main Street"
            />
            <FormErrorMessage>
              {validationResult?.errors?.find(e => e.includes('Street'))}
            </FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Apartment, Suite, etc. (Optional)</FormLabel>
            <Input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Apt 4B"
            />
          </FormControl>
          
          <HStack spacing={4}>
            <FormControl isInvalid={validationResult?.errors?.some(e => e.includes('City'))}>
              <FormLabel>City</FormLabel>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Springfield"
              />
              <FormErrorMessage>
                {validationResult?.errors?.find(e => e.includes('City'))}
              </FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={validationResult?.errors?.some(e => e.includes('State'))} maxW="150px">
              <FormLabel>State</FormLabel>
              <Select
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              >
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>
                {validationResult?.errors?.find(e => e.includes('State'))}
              </FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={validationResult?.errors?.some(e => e.includes('ZIP'))} maxW="120px">
              <FormLabel>ZIP Code</FormLabel>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
              />
              <FormErrorMessage>
                {validationResult?.errors?.find(e => e.includes('ZIP'))}
              </FormErrorMessage>
            </FormControl>
          </HStack>
          
          {isFormFilled && (
            <Box>
              <Button
                onClick={handleValidateAddress}
                isLoading={isValidating}
                loadingText="Validating..."
                colorScheme="blue"
                variant="outline"
                size="sm"
                leftIcon={isValidating ? <Spinner size="xs" /> : undefined}
              >
                Verify Address
              </Button>
            </Box>
          )}
          
          {/* Validation Results */}
          {validationResult && (
            <Box>
              {validationResult.isValid ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Address Verified!</AlertTitle>
                  <AlertDescription>
                    This address has been verified and is ready for delivery.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Address Not Verified</AlertTitle>
                  <AlertDescription>
                    {validationResult.errors?.join('. ')}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Address Suggestions */}
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <Box mt={3}>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Did you mean:
                  </Text>
                  {validationResult.suggestions.map((suggestion, index) => (
                    <Box
                      key={index}
                      p={2}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleUseSuggestion(suggestion)}
                      fontSize="sm"
                    >
                      {suggestion.line1}
                      {suggestion.line2 && `, ${suggestion.line2}`}
                      <br />
                      {suggestion.city}, {suggestion.state} {suggestion.postalCode}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </VStack>
      </FormControl>
    </Box>
  );
};

export default AddressForm; 