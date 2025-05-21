import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
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
import { useAuthStore } from '../store/authStore';
import { HomeNavbar } from '../components/HomeNavbar';

// TODO: Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_12345');

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CheckoutForm: React.FC<{ planId: string; billing: string }> = ({ planId, billing }) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const navigate = useNavigate();

  // TODO: Map planId to Stripe priceId
  const priceId = planId === 'pro' ? 'price_12345' : 'price_free';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Create customer
      const customerRes = await fetch('http://localhost:4242/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const { customerId, error: customerError } = await customerRes.json();
      if (customerError || !customerId) throw new Error(customerError || 'Failed to create customer');

      // 2. Create payment method
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { email, name },
      });
      if (pmError || !paymentMethod) throw new Error(pmError?.message || 'Failed to create payment method');

      // 3. Create subscription
      const subRes = await fetch('http://localhost:4242/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          priceId,
          payment_method: paymentMethod.id,
        }),
      });
      const { clientSecret, error: subError } = await subRes.json();
      if (subError || !clientSecret) throw new Error(subError || 'Failed to create subscription');

      // 4. Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
      if (confirmError) throw new Error(confirmError.message);

      setSuccess(true);
      toast({ title: 'Subscription successful!', status: 'success', duration: 5000, isClosable: true });
      // Optionally, redirect to dashboard or show more info
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="lg" mb={4}>Subscription Successful!</Heading>
        <Text>Thank you for subscribing. Redirecting...</Text>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} maxW="400px" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="md" bg="white">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Checkout</Heading>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Card Details</FormLabel>
          <Box borderWidth={1} borderRadius="md" p={2}>
            <CardElement options={{ hidePostalCode: true }} />
          </Box>
        </FormControl>
        {error && <Text color="red.500">{error}</Text>}
        <Button colorScheme="blue" type="submit" isLoading={loading} loadingText="Processing..." width="full">
          Subscribe
        </Button>
      </VStack>
    </Box>
  );
};

const CheckoutPage: React.FC = () => {
  const query = useQuery();
  const planId = query.get('plan') || 'pro';
  const billing = query.get('billing') || 'monthly';

  return (
    <Box bg="neutral.100" minH="100vh">
      <HomeNavbar />
      <Container maxW="container.md" py={8} pt={{ base: 24, md: 32 }}>
        <Elements stripe={stripePromise}>
          <CheckoutForm planId={planId} billing={billing} />
        </Elements>
      </Container>
    </Box>
  );
};

export default CheckoutPage; 