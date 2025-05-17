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

export default function SettingsPage() {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load settings from localStorage when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('lazyuncle-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing settings:', error);
        // If parsing fails, use default settings
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: UserSettings) => {
    localStorage.setItem('lazyuncle-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // Creates a handler for any setting update
  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    
    toast({
      title: 'Settings updated',
      description: `${key} has been updated`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
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

  // Test notifications
  const handleTestNotifications = async () => {
    if (!settings.notificationsEnabled) {
      toast({
        title: 'Notifications disabled',
        description: 'Please enable notifications to test them',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (settings.emailNotifications && !settings.email) {
      toast({
        title: 'Email required',
        description: 'Please add your email address to receive email notifications',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (settings.textNotifications && !settings.phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please add your phone number to receive text notifications',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
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

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl">Settings</Heading>
          <Text mt={2} color="gray.500">Customize your LazyUncle experience</Text>
        </Box>

        {/* Account Settings */}
        <Box bg="white" shadow="md" borderRadius="md" p={6}>
          <Heading as="h2" size="md" mb={4}>Account Settings</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Email Address</FormLabel>
            <Input 
              type="email" 
              value={settings.email} 
              onChange={(e) => handleSettingChange('email', e.target.value)} 
              placeholder="your@email.com"
            />
            <FormHelperText>Your email is used for account recovery and notifications</FormHelperText>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Phone Number</FormLabel>
            <InputGroup>
              <InputLeftAddon>+1</InputLeftAddon>
              <Input 
                type="tel" 
                value={settings.phoneNumber} 
                onChange={(e) => handleSettingChange('phoneNumber', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </InputGroup>
            <FormHelperText>Your phone number is used for text notifications</FormHelperText>
          </FormControl>

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
            <FormLabel mb="0">Enable Notifications</FormLabel>
            <Switch 
              isChecked={settings.notificationsEnabled}
              onChange={handleSwitchChange('notificationsEnabled')}
              colorScheme="blue"
            />
          </FormControl>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Email Notifications</FormLabel>
            <Switch 
              isChecked={settings.emailNotifications}
              onChange={handleSwitchChange('emailNotifications')}
              colorScheme="blue"
              isDisabled={!settings.notificationsEnabled}
            />
          </FormControl>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Text Notifications</FormLabel>
            <Switch 
              isChecked={settings.textNotifications}
              onChange={handleSwitchChange('textNotifications')}
              colorScheme="blue"
              isDisabled={!settings.notificationsEnabled}
            />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Reminder Days Before Event</FormLabel>
            <NumberInput 
              value={settings.reminderDays} 
              min={1} 
              max={90}
              isDisabled={!settings.notificationsEnabled}
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

          <Button 
            onClick={handleTestNotifications}
            colorScheme="blue"
            isDisabled={!settings.notificationsEnabled}
            mt={4}
          >
            Test Notifications
          </Button>
        </Box>

        {/* Integration Settings */}
        <Box bg="white" shadow="md" borderRadius="md" p={6}>
          <Heading as="h2" size="md" mb={4}>Integration</Heading>
          
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Calendar Sync</FormLabel>
            <Switch 
              isChecked={settings.calendarSync}
              onChange={handleSwitchChange('calendarSync')}
              colorScheme="blue"
            />
          </FormControl>
          
          <Text fontSize="sm" color="gray.500">
            Syncing with your calendar will create events for upcoming gift occasions
          </Text>
        </Box>

        {/* Appearance Settings */}
        <Box bg="white" shadow="md" borderRadius="md" p={6}>
          <Heading as="h2" size="md" mb={4}>Appearance</Heading>
          
          <FormControl mb={4}>
            <FormLabel>Theme</FormLabel>
            <Select value={settings.theme} onChange={handleThemeChange}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </Select>
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Date Format</FormLabel>
            <Select 
              value={settings.dateFormat} 
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Currency</FormLabel>
            <Select 
              value={settings.currency} 
              onChange={(e) => handleSettingChange('currency', e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </Select>
          </FormControl>
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