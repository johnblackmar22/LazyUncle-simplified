import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  Button,
  HStack,
  Box,
  Text,
  useColorModeValue,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Flex,
  Badge,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FaGift, FaCalendarAlt, FaTruck, FaRedo, FaEdit } from 'react-icons/fa';
import type { Recipient, Occasion } from '../types';
import { useAuthStore } from '../store/authStore';
import { getNextBirthday, getNextChristmas, getCurrentDateISO } from '../utils/dateUtils';
import { subDays, format, addDays } from 'date-fns';

type OccasionType = 'birthday' | 'christmas' | 'other';

interface OccasionFormProps {
  recipient: Recipient;
  initialValues?: Partial<Omit<Occasion, 'id' | 'recipientId' | 'createdAt' | 'updatedAt'>> & { recurring?: boolean };
  loading?: boolean;
  onSubmit: (occasion: Omit<Occasion, 'id' | 'recipientId' | 'createdAt' | 'updatedAt'> & { 
    recurring?: boolean;
    budget?: number;
    giftWrap?: boolean;
    personalizedNote?: boolean;
    noteText?: string;
    deliveryDate?: string;
    userId: string;
  }) => void;
  onCancel: () => void;
}

export const OccasionForm: React.FC<OccasionFormProps> = ({
  recipient,
  initialValues,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [type, setType] = useState<OccasionType>(initialValues?.type as OccasionType || 'birthday');
  const [otherName, setOtherName] = useState(initialValues?.name || '');
  const [occasionDate, setOccasionDate] = useState(''); // When the event actually happens
  const [deliveryDate, setDeliveryDate] = useState(''); // When to deliver the gift
  const [recurring, setRecurring] = useState(initialValues?.recurring ?? true);
  const [budget, setBudget] = useState<number>(initialValues?.budget || 50);
  const [giftWrap, setGiftWrap] = useState(initialValues?.giftWrap ?? false);
  const [personalizedNote, setPersonalizedNote] = useState(initialValues?.personalizedNote ?? false);
  const [noteText, setNoteText] = useState(initialValues?.noteText || '');

  const { user } = useAuthStore();

  // Helper function to calculate delivery date (one week before occasion)
  const calculateDeliveryDate = (eventDate: string): string => {
    if (!eventDate) return '';
    try {
      const [year, month, day] = eventDate.split('-').map(Number);
      const event = new Date(year, month - 1, day);
      const delivery = subDays(event, 7); // One week before
      return format(delivery, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  // Set dates based on type and calculate next occurrence
  useEffect(() => {
    if (type === 'birthday') {
      if (recipient.birthdate) {
        // Use the next birthday date instead of the historical birthdate
        const nextBirthday = getNextBirthday(recipient.birthdate);
        setOccasionDate(nextBirthday);
        setDeliveryDate(calculateDeliveryDate(nextBirthday));
      } else {
        // If no birthdate is set, default to today's date for setting up
        const today = getCurrentDateISO();
        setOccasionDate(today);
        setDeliveryDate(calculateDeliveryDate(today));
      }
    } else if (type === 'christmas') {
      // Use the next Christmas date
      const nextChristmas = getNextChristmas();
      setOccasionDate(nextChristmas);
      setDeliveryDate(calculateDeliveryDate(nextChristmas));
    } else if (initialValues?.date) {
      // For editing existing occasions, use the provided date
      setOccasionDate(initialValues.date);
      setDeliveryDate(calculateDeliveryDate(initialValues.date));
    } else {
      // For new non-birthday/christmas occasions, reset the dates
      setOccasionDate('');
      setDeliveryDate('');
    }
  }, [type, recipient.birthdate, initialValues?.date]);

  // Update delivery date when occasion date changes
  useEffect(() => {
    if (occasionDate && type === 'other') {
      setDeliveryDate(calculateDeliveryDate(occasionDate));
    }
  }, [occasionDate, type]);

  // Generate default note text for placeholder
  const userFirstName = user?.displayName?.split(' ')[0] || 'Your Secret Santa';
  const recipientFirstName = recipient.name.split(' ')[0];
  const occasionName = type === 'other' ? (otherName || 'Special Day') : 
    type.charAt(0).toUpperCase() + type.slice(1);
  const defaultNote = `Dear ${recipientFirstName}, Happy ${occasionName}! Love, ${userFirstName}`;

  // Validate and submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let occasionType: Occasion['type'] = type === 'other' ? 'custom' : type;
    if (type === 'other') {
      if (!otherName.trim()) return;
      name = otherName.trim();
    } else {
      name = type.charAt(0).toUpperCase() + type.slice(1);
    }
    if (!occasionDate || !deliveryDate) return;
    
    onSubmit({
      name,
      type: occasionType,
      date: occasionDate, // Store the occasion date
      budget,
      giftWrap,
      personalizedNote,
      noteText: personalizedNote ? (noteText.trim() ? noteText : defaultNote) : undefined,
      deliveryDate, // Add delivery date
      ...(recurring !== undefined ? { recurring } : {}),
      userId: user?.id || '', // Add userId to fix linter error
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Occasion</FormLabel>
          <Select
            value={type}
            onChange={e => setType(e.target.value as OccasionType)}
            name="type"
          >
            <option value="birthday">Birthday</option>
            <option value="christmas">Christmas</option>
            <option value="other">Other</option>
          </Select>
        </FormControl>

        {type === 'other' && (
          <FormControl isRequired>
            <FormLabel>Occasion Name</FormLabel>
            <Input
              value={otherName}
              onChange={e => setOtherName(e.target.value)}
              placeholder="Enter occasion name"
              name="otherName"
            />
          </FormControl>
        )}

        {/* Occasion Date */}
        <FormControl isRequired>
          <FormLabel>
            <Flex align="center" gap={2}>
              <FaCalendarAlt />
              <Text>Occasion Date</Text>
            </Flex>
          </FormLabel>
          <Input
            type="date"
            value={occasionDate}
            onChange={e => {
              setOccasionDate(e.target.value);
              if (type === 'other') {
                setDeliveryDate(calculateDeliveryDate(e.target.value));
              }
            }}
            disabled={type === 'birthday' || type === 'christmas'}
            min={getCurrentDateISO()}
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            {type === 'birthday' 
              ? (recipient.birthdate 
                  ? `Next birthday: ${occasionDate}` 
                  : 'Please set birthday in recipient details first')
              : type === 'christmas'
              ? `Next Christmas: ${occasionDate}`
              : 'When the occasion actually happens'}
          </Text>
        </FormControl>

        {/* Gift Delivery Date */}
        <FormControl isRequired>
          <FormLabel>
            <Flex align="center" gap={2}>
              <FaTruck />
              <Text>Gift Delivery Date</Text>
              <Badge colorScheme="green" variant="subtle">Auto-calculated</Badge>
            </Flex>
          </FormLabel>
          <Input
            type="date"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            min={getCurrentDateISO()}
          />
          <Text fontSize="xs" color="blue.500" mt={1}>
            <strong>Automatically set to 1 week before the occasion</strong> - you can adjust if needed
          </Text>
          
          {/* Delivery Date Warning */}
          {deliveryDate && (() => {
            const today = new Date();
            const delivery = new Date(deliveryDate);
            const daysUntilDelivery = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDelivery <= 10 && daysUntilDelivery >= 0) {
              return (
                <Text fontSize="xs" color="orange.600" mt={1}>
                  ⚠️ <strong>Warning:</strong> Only {daysUntilDelivery} day{daysUntilDelivery !== 1 ? 's' : ''} until delivery date. 
                  We may not be able to deliver on time.
                </Text>
              );
            } else if (daysUntilDelivery < 0) {
              return (
                <Text fontSize="xs" color="red.600" mt={1}>
                  ❌ <strong>Error:</strong> The delivery date has already passed. Please choose a future date.
                </Text>
              );
            }
            return null;
          })()}
        </FormControl>

        <FormControl>
          <FormLabel>Budget</FormLabel>
          <InputGroup>
            <InputLeftAddon>$</InputLeftAddon>
            <NumberInput min={1} value={budget} onChange={(_, value) => setBudget(value || 50)}>
              <NumberInputField borderLeftRadius={0} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="recurring" mb="0">
            Recurring
            <Tooltip label="Automatically repeat this occasion every year" fontSize="sm">
              <Icon as={FaRedo} color="gray.500" ml={1} boxSize="3" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Switch 
            id="recurring" 
            isChecked={recurring} 
            onChange={e => setRecurring(e.target.checked)} 
            colorScheme="blue" 
          />
          <Text fontSize="xs" color="gray.500" ml={3}>
            Automatically repeat this occasion every year
          </Text>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="gift-wrap" mb="0">
            Gift Wrap
            <Tooltip label="Include beautiful gift wrapping with your order" fontSize="sm">
              <Icon as={FaGift} color="gray.500" ml={1} boxSize="3" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Switch 
            id="gift-wrap" 
            isChecked={giftWrap} 
            onChange={e => setGiftWrap(e.target.checked)} 
            colorScheme="blue" 
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="personalized-note" mb="0">
            Include Personalized Note
            <Tooltip label="Add a custom message to be included with the gift" fontSize="sm">
              <Icon as={FaEdit} color="gray.500" ml={1} boxSize="3" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Switch 
            id="personalized-note" 
            isChecked={personalizedNote} 
            onChange={e => setPersonalizedNote(e.target.checked)} 
            colorScheme="blue" 
          />
        </FormControl>

        {personalizedNote && (
          <FormControl>
            <FormLabel>Personalized Note</FormLabel>
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={defaultNote}
              rows={3}
              name="noteText"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              This note will be included with the gift. You can leave it blank to use the default above.
            </Text>
          </FormControl>
        )}

        <HStack spacing={3} justifyContent="flex-end" pt={4}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            leftIcon={<FaGift />}
            isLoading={loading}
            loadingText="Adding..."
          >
            Add Occasion
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

export default OccasionForm; 