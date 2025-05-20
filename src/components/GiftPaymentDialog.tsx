import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_12345'); // TODO: Replace with your real key

interface GiftPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // in dollars
  customerId: string;
  onSuccess?: () => void;
}

const GiftPaymentForm: React.FC<GiftPaymentDialogProps> = ({ isOpen, onClose, amount, customerId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Create payment intent
      const res = await fetch('http://localhost:4242/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount, currency: 'usd' }),
      });
      const { clientSecret, error: intentError } = await res.json();
      if (intentError || !clientSecret) throw new Error(intentError || 'Failed to create payment intent');

      // 2. Confirm payment
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      if (confirmError) throw new Error(confirmError.message);

      setSuccess(true);
      toast({ title: 'Gift payment successful!', status: 'success', duration: 5000, isClosable: true });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold">Gift Amount: ${amount.toFixed(2)}</Text>
        <FormControl isRequired>
          <FormLabel>Card Details</FormLabel>
          <Box borderWidth={1} borderRadius="md" p={2}>
            <CardElement options={{ hidePostalCode: true }} />
          </Box>
        </FormControl>
        {error && <Text color="red.500">{error}</Text>}
        <Button colorScheme="blue" type="submit" isLoading={loading} loadingText="Processing..." width="full">
          Pay for Gift
        </Button>
        {success && <Text color="green.500">Payment successful!</Text>}
      </VStack>
    </form>
  );
};

const GiftPaymentDialog: React.FC<GiftPaymentDialogProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <Modal isOpen={props.isOpen} onClose={props.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pay for Gift</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <GiftPaymentForm {...props} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={props.onClose} variant="ghost">Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Elements>
  );
};

export default GiftPaymentDialog; 