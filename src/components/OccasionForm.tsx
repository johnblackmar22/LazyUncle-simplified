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
} from '@chakra-ui/react';
import { FaGift } from 'react-icons/fa';
import type { Recipient, Occasion } from '../types';
import { useAuthStore } from '../store/authStore';

type OccasionType = 'birthday' | 'anniversary' | 'christmas' | 'other';

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
  const [date, setDate] = useState(initialValues?.date ? initialValues.date.slice(5) : ''); // MM-DD
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [recurring, setRecurring] = useState(initialValues?.recurring ?? true);
  const [budget, setBudget] = useState<number>(initialValues?.budget || 50);
  const [giftWrap, setGiftWrap] = useState(initialValues?.giftWrap ?? false);
  const [personalizedNote, setPersonalizedNote] = useState(initialValues?.personalizedNote ?? false);
  const [noteText, setNoteText] = useState(initialValues?.noteText || '');

  const { user } = useAuthStore();

  // Set date based on type
  useEffect(() => {
    if (type === 'birthday' && recipient.birthdate) {
      const [, month, day] = recipient.birthdate.split('-');
      setDate(`${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else if (type === 'christmas') {
      setDate('12-25');
    } else if (type !== 'other') {
      setDate('');
    }
  }, [type, recipient.birthdate]);

  // Generate default note text when personalized note is enabled
  useEffect(() => {
    if (personalizedNote && !noteText) {
      const userName = user?.displayName?.split(' ')[0] || 'Your Secret Santa';
      const occasionName = type === 'other' ? (otherName || 'Special Day') : 
                          type.charAt(0).toUpperCase() + type.slice(1);
      const defaultNote = `Dear ${recipient.name}, Happy ${occasionName}! Love, ${userName}`;
      setNoteText(defaultNote);
    }
  }, [personalizedNote, type, otherName, recipient.name, user?.displayName, noteText]);

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
    if (!date) return;
    // Save as MM-DD, but backend may expect YYYY-MM-DD, so use 2000 as dummy year
    const formattedDate = `2000-${date}`;
    onSubmit({
      name,
      type: occasionType,
      date: formattedDate,
      notes,
      budget,
      giftWrap,
      personalizedNote,
      noteText: personalizedNote ? noteText : undefined,
      ...(recurring !== undefined ? { recurring } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isRequired mb={3}>
        <FormLabel>Occasion</FormLabel>
        <Select
          value={type}
          onChange={e => setType(e.target.value as OccasionType)}
          name="type"
        >
          <option value="birthday">Birthday</option>
          <option value="christmas">Christmas</option>
          <option value="anniversary">Anniversary</option>
          <option value="other">Other</option>
        </Select>
      </FormControl>
      {type === 'other' && (
        <FormControl isRequired mb={3}>
          <FormLabel>Occasion Name</FormLabel>
          <Input
            value={otherName}
            onChange={e => setOtherName(e.target.value)}
            placeholder="Enter occasion name"
            name="otherName"
          />
        </FormControl>
      )}
      <FormControl isRequired mb={3}>
        <FormLabel>Date</FormLabel>
        <Input
          type="text"
          pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"
          placeholder="MM-DD"
          value={date}
          onChange={e => setDate(e.target.value)}
          disabled={type === 'birthday' || type === 'christmas'}
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          {type === 'birthday' && recipient.birthdate
            ? 'Birthday date is from recipient info'
            : type === 'christmas'
            ? 'Christmas is always December 25'
            : 'Format: MM-DD (e.g., 04-12)'}
        </Text>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Notes</FormLabel>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Is there anything else you'd like us to know about this occasion?"
          name="notes"
        />
      </FormControl>
      <FormControl display="flex" alignItems="center" mb={3}>
        <FormLabel mb="0">Recurring</FormLabel>
        <Switch
          isChecked={recurring}
          onChange={e => setRecurring(e.target.checked)}
          colorScheme="blue"
          name="recurring"
          ml={2}
        />
        <Tooltip label="We'll automatically send another gift next year if this is on.">
          <Text fontSize="sm" color="gray.500" ml={2}>
            Auto-send every year
          </Text>
        </Tooltip>
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Budget</FormLabel>
        <InputGroup>
          <InputLeftAddon children="$" />
          <NumberInput
            value={budget}
            onChange={(valueString) => setBudget(parseFloat(valueString) || 0)}
            min={0}
            precision={2}
            step={5}
            name="budget"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </InputGroup>
      </FormControl>
      <FormControl display="flex" alignItems="center" mb={3}>
        <FormLabel mb="0">Gift Wrap</FormLabel>
        <Switch
          isChecked={giftWrap}
          onChange={e => setGiftWrap(e.target.checked)}
          colorScheme="blue"
          name="giftWrap"
          ml={2}
        />
        <Tooltip label="We'll wrap the gift for you if this is on.">
          <Text fontSize="sm" color="gray.500" ml={2}>
            Wrap gift
          </Text>
        </Tooltip>
      </FormControl>
      <FormControl display="flex" alignItems="center" mb={3}>
        <FormLabel mb="0">Personalized Note</FormLabel>
        <Switch
          isChecked={personalizedNote}
          onChange={e => setPersonalizedNote(e.target.checked)}
          colorScheme="blue"
          name="personalizedNote"
          ml={2}
        />
        <Tooltip label="We'll include a personalized note with the gift if this is on.">
          <Text fontSize="sm" color="gray.500" ml={2}>
            Include note
          </Text>
        </Tooltip>
      </FormControl>
      {personalizedNote && (
        <FormControl mb={3}>
          <FormLabel>Note Text</FormLabel>
          <Textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Enter your personalized message..."
            name="noteText"
            rows={3}
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            This note will be included with the gift.
          </Text>
        </FormControl>
      )}
      <HStack mt={6} justify="flex-end">
        <Button onClick={onCancel} variant="ghost" isDisabled={loading}>
          Cancel
        </Button>
        <Button colorScheme="blue" type="submit" isLoading={loading}>
          Add Occasion
        </Button>
      </HStack>
    </form>
  );
};

export default OccasionForm; 