require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4242;
const { stripe } = require('./stripe');
const bodyParser = require('body-parser');
const { getWebhookSecret } = require('./stripe');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('LazyUncle Stripe backend is running.');
});

// Create a Stripe customer
app.post('/create-customer', async (req, res) => {
  const { email, name } = req.body;
  try {
    const customer = await stripe.customers.create({
      email,
      name
    });
    res.json({ customerId: customer.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create a Stripe subscription
app.post('/create-subscription', async (req, res) => {
  const { customerId, priceId, payment_method } = req.body;
  try {
    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: payment_method }
    });
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent']
    });
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create a one-time PaymentIntent for a gift
app.post('/create-payment-intent', async (req, res) => {
  const { customerId, amount, currency } = req.body;
  try {
    // Convert amount to cents
    const amountCents = Math.round(Number(amount) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency || 'usd',
      customer: customerId,
      payment_method_types: ['card'],
      // Automatically charge the default payment method
      off_session: true,
      confirm: true
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, getWebhookSecret());
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the event
  console.log('Received Stripe event:', event.type);
  // Add event handling logic here as needed
  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 