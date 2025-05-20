import React, { useState } from 'react';
import type { Recipient, Address, AutoSendPreferences, OccasionPreference } from '../types';
import { useRecipientStore } from '../store/recipientStore';
import {
  Box, Heading, Switch, FormControl, FormLabel, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Button, Stack, Text, Tooltip, Divider, Select, useToast
} from '@chakra-ui/react';

interface AutoSendPreferencesProps {
  recipient: Recipient;
}

export const AutoSendPreferences: React.FC<AutoSendPreferencesProps> = ({ recipient }) => {
  const { updateAutoSendPreferences, toggleAutoSend, toggleOccasionAutoSend, setDefaultBudget, updateOccasionPreference, updateShippingAddress, toggleApprovalRequirement } = useRecipientStore();
  const toast = useToast();
  
  const [isEnabled, setIsEnabled] = useState(recipient.autoSendPreferences?.enabled || false);
  const [defaultBudget, setDefaultBudgetState] = useState(recipient.autoSendPreferences?.defaultBudget || 50);
  const [requireApproval, setRequireApproval] = useState(recipient.autoSendPreferences?.requireApproval !== false);
  
  // Occasion states
  const [birthdayEnabled, setBirthdayEnabled] = useState(recipient.autoSendPreferences?.occasions.birthday?.enabled || false);
  const [birthdayBudget, setBirthdayBudget] = useState(recipient.autoSendPreferences?.occasions.birthday?.budget || defaultBudget);
  const [birthdayLeadTime, setBirthdayLeadTime] = useState(recipient.autoSendPreferences?.occasions.birthday?.leadTime || 7);
  
  const [christmasEnabled, setChristmasEnabled] = useState(recipient.autoSendPreferences?.occasions.christmas?.enabled || false);
  const [christmasBudget, setChristmasBudget] = useState(recipient.autoSendPreferences?.occasions.christmas?.budget || defaultBudget);
  const [christmasLeadTime, setChristmasLeadTime] = useState(recipient.autoSendPreferences?.occasions.christmas?.leadTime || 14);
  
  const [anniversaryEnabled, setAnniversaryEnabled] = useState(recipient.autoSendPreferences?.occasions.anniversary?.enabled || false);
  const [anniversaryBudget, setAnniversaryBudget] = useState(recipient.autoSendPreferences?.occasions.anniversary?.budget || defaultBudget);
  const [anniversaryLeadTime, setAnniversaryLeadTime] = useState(recipient.autoSendPreferences?.occasions.anniversary?.leadTime || 7);
  
  // Shipping address state
  const [address, setAddress] = useState<Address>(recipient.autoSendPreferences?.shippingAddress || {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  
  // Payment method state (simplified for demo)
  const [paymentType, setPaymentType] = useState<'creditCard' | 'paypal' | 'other'>(
    recipient.autoSendPreferences?.paymentMethod?.type || 'creditCard'
  );
  
  // Handle toggle of main auto-send switch
  const handleToggleAutoSend = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    await toggleAutoSend(recipient.id, newValue);
  };
  
  // Handle toggle of approval requirement
  const handleToggleApproval = async () => {
    const newValue = !requireApproval;
    setRequireApproval(newValue);
    await toggleApprovalRequirement(recipient.id, newValue);
  };
  
  // Handle change of default budget
  const handleDefaultBudgetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDefaultBudgetState(value);
      await setDefaultBudget(recipient.id, value);
    }
  };
  
  // Handle toggle of an occasion
  const handleToggleOccasion = async (occasion: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    switch (occasion) {
      case 'birthday':
        setBirthdayEnabled(newValue);
        break;
      case 'christmas':
        setChristmasEnabled(newValue);
        break;
      case 'anniversary':
        setAnniversaryEnabled(newValue);
        break;
    }
    
    await toggleOccasionAutoSend(recipient.id, occasion, newValue);
  };
  
  // Handle change of occasion preferences
  const handleOccasionPreferenceChange = async (
    occasion: string,
    preference: Partial<OccasionPreference>
  ) => {
    await updateOccasionPreference(recipient.id, occasion, preference);
  };
  
  // Handle address field changes
  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save shipping address
  const handleSaveAddress = async () => {
    await updateShippingAddress(recipient.id, address);
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" maxW="lg" mx="auto">
      <Heading size="md" mb={4}>Auto-Send Preferences</Heading>
      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="auto-send-switch" mb="0">Enable Auto-Send for {recipient.name}</FormLabel>
        <Tooltip label="Automatically send gifts for this recipient on special occasions" aria-label="Auto-send help">
          <Switch id="auto-send-switch" isChecked={isEnabled} onChange={handleToggleAutoSend} colorScheme="blue" />
        </Tooltip>
      </FormControl>
      {isEnabled && (
        <>
          <FormControl mb={4}>
            <FormLabel>Default Budget ($)</FormLabel>
            <NumberInput min={1} value={defaultBudget} onChange={(_, value) => setDefaultBudgetState(value)} onBlur={handleDefaultBudgetChange}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="approval-switch" mb="0">Require Approval Before Sending</FormLabel>
            <Tooltip label="If enabled, you'll be notified to review and approve all auto-send gifts before they're ordered." aria-label="Approval help">
              <Switch id="approval-switch" isChecked={requireApproval} onChange={handleToggleApproval} colorScheme="blue" />
            </Tooltip>
          </FormControl>
          <Divider my={4} />
          <Heading size="sm" mb={2}>Occasions</Heading>
          {recipient.birthdate && (
            <Box mb={4}>
              <FormControl display="flex" alignItems="center" mb={2}>
                <FormLabel htmlFor="birthday-switch" mb="0">Enable Birthday Auto-Send</FormLabel>
                <Switch id="birthday-switch" isChecked={birthdayEnabled} onChange={() => handleToggleOccasion('birthday', birthdayEnabled)} colorScheme="blue" />
              </FormControl>
              {birthdayEnabled && (
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={2}>
                  <FormControl>
                    <FormLabel>Budget ($)</FormLabel>
                    <NumberInput min={1} value={birthdayBudget} onChange={(_, value) => setBirthdayBudget(value)} onBlur={e => handleOccasionPreferenceChange('birthday', { budget: birthdayBudget })}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Lead Time (days before)</FormLabel>
                    <NumberInput min={1} max={90} value={birthdayLeadTime} onChange={(_, value) => setBirthdayLeadTime(value)} onBlur={e => handleOccasionPreferenceChange('birthday', { leadTime: birthdayLeadTime })}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Stack>
              )}
            </Box>
          )}
          <Box mb={4}>
            <FormControl display="flex" alignItems="center" mb={2}>
              <FormLabel htmlFor="christmas-switch" mb="0">Enable Christmas Auto-Send</FormLabel>
              <Switch id="christmas-switch" isChecked={christmasEnabled} onChange={() => handleToggleOccasion('christmas', christmasEnabled)} colorScheme="blue" />
            </FormControl>
            {christmasEnabled && (
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={2}>
                <FormControl>
                  <FormLabel>Budget ($)</FormLabel>
                  <NumberInput min={1} value={christmasBudget} onChange={(_, value) => setChristmasBudget(value)} onBlur={e => handleOccasionPreferenceChange('christmas', { budget: christmasBudget })}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Lead Time (days before)</FormLabel>
                  <NumberInput min={1} max={90} value={christmasLeadTime} onChange={(_, value) => setChristmasLeadTime(value)} onBlur={e => handleOccasionPreferenceChange('christmas', { leadTime: christmasLeadTime })}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Stack>
            )}
          </Box>
          {recipient.anniversary && (
            <Box mb={4}>
              <FormControl display="flex" alignItems="center" mb={2}>
                <FormLabel htmlFor="anniversary-switch" mb="0">Enable Anniversary Auto-Send</FormLabel>
                <Switch id="anniversary-switch" isChecked={anniversaryEnabled} onChange={() => handleToggleOccasion('anniversary', anniversaryEnabled)} colorScheme="blue" />
              </FormControl>
              {anniversaryEnabled && (
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={2}>
                  <FormControl>
                    <FormLabel>Budget ($)</FormLabel>
                    <NumberInput min={1} value={anniversaryBudget} onChange={(_, value) => setAnniversaryBudget(value)} onBlur={e => handleOccasionPreferenceChange('anniversary', { budget: anniversaryBudget })}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Lead Time (days before)</FormLabel>
                    <NumberInput min={1} max={90} value={anniversaryLeadTime} onChange={(_, value) => setAnniversaryLeadTime(value)} onBlur={e => handleOccasionPreferenceChange('anniversary', { leadTime: anniversaryLeadTime })}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Stack>
              )}
            </Box>
          )}
          <Divider my={4} />
          <Heading size="sm" mb={2}>Shipping Address</Heading>
          <Stack spacing={2} mb={4}>
            <FormControl isRequired>
              <FormLabel>Street Address</FormLabel>
              <Input value={address.line1} onChange={e => handleAddressChange('line1', e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Apartment/Suite (optional)</FormLabel>
              <Input value={address.line2 || ''} onChange={e => handleAddressChange('line2', e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>City</FormLabel>
              <Input value={address.city} onChange={e => handleAddressChange('city', e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>State</FormLabel>
              <Input value={address.state} onChange={e => handleAddressChange('state', e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Postal Code</FormLabel>
              <Input value={address.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Country</FormLabel>
              <Input value={address.country} onChange={e => handleAddressChange('country', e.target.value)} />
            </FormControl>
          </Stack>
          <Button colorScheme="blue" onClick={handleSaveAddress} isDisabled={!address.line1 || !address.city || !address.state || !address.postalCode || !address.country} mb={4}>
            Save Address
          </Button>
          <Divider my={4} />
          <Heading size="sm" mb={2}>Payment Method</Heading>
          <FormControl mb={2}>
            <FormLabel>Payment Method</FormLabel>
            <Select value={paymentType} onChange={e => setPaymentType(e.target.value as 'creditCard' | 'paypal' | 'other')}>
              <option value="creditCard">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </Select>
          </FormControl>
          <Text fontSize="sm" color="gray.500">
            For security, payment details are managed in the payment settings page.
          </Text>
        </>
      )}
    </Box>
  );
};

export default AutoSendPreferences; 