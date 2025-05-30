import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Stack,
  Switch,
  Text,
  useColorMode,
  useToast,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  FormHelperText,
  Divider,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import type { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';
import { checkAndSendReminders } from '../services/notificationService';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user, demoMode } = useAuthStore();
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');

  // Load settings from localStorage when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('lazyuncle-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setTempPhoneNumber(parsedSettings.phoneNumber || '');
      } catch (error) {
        console.error('Error parsing settings:', error);
        // If parsing fails, use default settings
        setSettings(DEFAULT_SETTINGS);
        setTempPhoneNumber('');
      }
    } else {
      setTempPhoneNumber('');
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: UserSettings) => {
    localStorage.setItem('lazyuncle-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setHasUnsavedChanges(false);
  };

  // Save all settings including phone number
  const handleSaveAllSettings = () => {
    if (!validatePhoneNumber()) return;
    
    const newSettings = { ...settings, phoneNumber: tempPhoneNumber };
    saveSettings(newSettings);
    
    toast({
      title: 'Settings saved',
      description: 'All settings have been saved successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Validate phone number (10 digits)
  const validatePhoneNumber = () => {
    if (settings.textNotifications && tempPhoneNumber) {
      const digitsOnly = tempPhoneNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        toast({
          title: 'Invalid phone number',
          description: 'Please enter a valid 10-digit phone number',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }
    return true;
  };

  // Creates a handler for any setting update
  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    
    // Only show toast for non-phone number changes
    if (key !== 'phoneNumber') {
      toast({
        title: 'Settings updated',
        description: `${key} has been updated`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Handle theme change
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as UserSettings['theme'];
    handleSettingChange('theme', newTheme);
    
    // If theme is not 'system', also update the color mode
    if (newTheme !== 'system') {
      if (newTheme !== colorMode) {
        toggleColorMode();
      }
    }
  };

  // Handle switch toggle changes
  const handleSwitchChange = (key: keyof UserSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    handleSettingChange(key, event.target.checked);
  };

  // Handle password change
  const handlePasswordChange = () => {
    // In a real application, you would make an API call to change the password
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Simulate success
    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordChangeVisible(false);
  };

  // Handle reset button
  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to defaults',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Handle text notifications toggle
  const handleTextNotificationsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    handleSettingChange('textNotifications', checked);
  };

  // Handle phone number change without saving immediately
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempPhoneNumber(value);
    setHasUnsavedChanges(true);
  };

  // Update handleTestNotifications to validate phone number if text notifications are enabled
  const handleTestNotifications = async () => {
    if (settings.emailNotifications && !user?.email) {
      toast({
        title: 'Email required',
        description: 'Please add your email address to receive email notifications',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (settings.textNotifications) {
      if (!isValidPhone(tempPhoneNumber)) {
        toast({
          title: 'Phone number required',
          description: 'Please enter a valid phone number to receive text notifications',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    toast({
      title: 'Testing notifications',
      description: 'Sending test notifications...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    try {
      await checkAndSendReminders(settings);
      toast({
        title: 'Test complete',
        description: 'Test notifications sent successfully. Check the console for details.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error testing notifications:', error);
      toast({
        title: 'Test failed',
        description: 'Failed to send test notifications. See console for details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Email update handler
  const handleEmailUpdate = () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (demoMode) {
      setEditingEmail(false);
      toast({
        title: 'Demo mode',
        description: 'Email updated locally (demo mode only).',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      // In demo mode, just update local state
      setNewEmail(newEmail);
    } else {
      // In real mode, update auth store/backend
      // TODO: Implement backend update if needed
      setEditingEmail(false);
      toast({
        title: 'Email updated',
        description: 'Your email address has been updated.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Phone number validation
  const isValidPhone = (phone: string) => /^(\(\d{3}\)\s?|\d{3}-)\d{3}-\d{4}$/.test(phone) || /^\d{10}$/.test(phone.replace(/\D/g, ''));

  return (
    <Container maxW="container.md" py={8}>
      <Box mb={6} textAlign="right">
        <Button as={RouterLink} to="/subscription/plans" colorScheme="blue" variant="solid" size="md">
          Manage Subscription
        </Button>
      </Box>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl">Settings</Heading>
          <Text mt={2} color="gray.500">Customize your LazyUncle experience</Text>
        </Box>

        {/* Account Settings */}
        <Box bg="white" shadow="md" borderRadius="md" p={6}>
          <Heading as="h2" size="md" mb={4}>Account Settings</Heading>
          
          {/* Email field with change workflow */}
          <FormControl mb={4} isRequired>
            <FormLabel>Email Address</FormLabel>
            {editingEmail ? (
              <Stack direction="row" spacing={2} align="center">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <Button colorScheme="blue" size="sm" onClick={handleEmailUpdate}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingEmail(false); setNewEmail(user?.email || ''); }}>Cancel</Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2} align="center">
                <Text>{demoMode ? newEmail : user?.email}</Text>
                <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)}>Change Email</Button>
              </Stack>
            )}
            <FormHelperText>Your email is used for account recovery and notifications</FormHelperText>
          </FormControl>

          {/* Only show phone number if text notifications is enabled */}
          {settings.textNotifications && (
            <FormControl mb={4}>
              <FormLabel>Phone Number</FormLabel>
              <InputGroup>
                <InputLeftAddon>+1</InputLeftAddon>
                <Input 
                  type="tel" 
                  value={settings.phoneNumber} 
                  onChange={handlePhoneNumberChange}
                  placeholder="(555) 123-4567"
                />
              </InputGroup>
              <FormHelperText>Your phone number is used for text notifications</FormHelperText>
            </FormControl>
          )}

          <Divider my={4} />

          {!isPasswordChangeVisible ? (
            <Button 
              onClick={() => setIsPasswordChangeVisible(true)}
              colorScheme="blue"
              variant="outline"
              size="sm"
            >
              Change Password
            </Button>
          ) : (
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </FormControl>
              
              <HStack>
                <Button 
                  onClick={handlePasswordChange}
                  colorScheme="blue"
                  size="sm"
                >
                  Update Password
                </Button>
                <Button 
                  onClick={() => setIsPasswordChangeVisible(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>

        {/* Notification Settings */}
        <Box bg="white" shadow="md" borderRadius="md" p={6}>
          <Heading as="h2" size="md" mb={4}>Notifications</Heading>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Email Notifications</FormLabel>
            <Switch 
              isChecked={settings.emailNotifications}
              onChange={handleSwitchChange('emailNotifications')}
              colorScheme="blue"
            />
          </FormControl>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Text Notifications</FormLabel>
            <Switch 
              isChecked={settings.textNotifications}
              onChange={handleTextNotificationsToggle}
              colorScheme="blue"
            />
          </FormControl>
          
          {/* Phone number field appears only if text notifications is enabled */}
          {settings.textNotifications && (
            <FormControl mb={4} isRequired>
              <FormLabel>Phone Number</FormLabel>
              <InputGroup>
                <InputLeftAddon>+1</InputLeftAddon>
                <Input 
                  type="tel" 
                  value={tempPhoneNumber} 
                  onChange={handlePhoneNumberChange}
                  placeholder="(555) 123-4567"
                />
              </InputGroup>
              <FormHelperText>Your phone number is used for text notifications (10 digits required)</FormHelperText>
            </FormControl>
          )}

          <FormControl mb={4}>
            <FormLabel>Reminder Days Before Event</FormLabel>
            <NumberInput 
              value={settings.reminderDays} 
              min={1} 
              max={90}
              onChange={(_, value) => handleSettingChange('reminderDays', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>How many days before an event to send a reminder</FormHelperText>
          </FormControl>

          <HStack spacing={4}>
            <Button 
              onClick={handleTestNotifications}
              colorScheme="blue"
              variant="outline"
            >
              Test Notifications
            </Button>
            
            {hasUnsavedChanges && (
              <Button 
                onClick={handleSaveAllSettings}
                colorScheme="green"
              >
                Save Settings
              </Button>
            )}
          </HStack>
        </Box>

        <Box textAlign="right">
          <Button colorScheme="red" variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </Box>
      </Stack>
    </Container>
  );
} 