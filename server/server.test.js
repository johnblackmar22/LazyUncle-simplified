const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

jest.mock('./stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' })
    },
    paymentMethods: {
      attach: jest.fn().mockResolvedValue({ id: 'pm_test123' })
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        latest_invoice: {
          payment_intent: { client_secret: 'cs_test_sub' }
        }
      })
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'cs_test_pi'
      })
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
      update: jest.fn().mockResolvedValue({})
    }
  }
}));

const { stripe } = require('./stripe');

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.post('/create-customer', async (req, res) => {
    const { email, name } = req.body;
    try {
      const customer = await stripe.customers.create({ email, name });
      res.json({ customerId: customer.id });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post('/create-subscription', async (req, res) => {
    const { customerId, priceId, payment_method } = req.body;
    try {
      await stripe.paymentMethods.attach(payment_method, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: payment_method }
      });
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
  app.post('/create-payment-intent', async (req, res) => {
    const { customerId, amount, currency } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency: currency || 'usd',
        customer: customerId,
        payment_method_types: ['card'],
        off_session: true,
        confirm: true
      });
      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
});

describe('POST /create-customer', () => {
  it('should create a Stripe customer and return customerId', async () => {
    const res = await request(app)
      .post('/create-customer')
      .send({ email: 'test@example.com', name: 'Test User' });
    expect(res.statusCode).toBe(200);
    expect(res.body.customerId).toBe('cus_test123');
    expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'test@example.com', name: 'Test User' });
  });
});

describe('POST /create-subscription', () => {
  it('should create a subscription and return subscriptionId and clientSecret', async () => {
    const res = await request(app)
      .post('/create-subscription')
      .send({ customerId: 'cus_test123', priceId: 'price_123', payment_method: 'pm_test123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.subscriptionId).toBe('sub_test123');
    expect(res.body.clientSecret).toBe('cs_test_sub');
    expect(stripe.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', { customer: 'cus_test123' });
    expect(stripe.customers.update).toHaveBeenCalledWith('cus_test123', { invoice_settings: { default_payment_method: 'pm_test123' } });
    expect(stripe.subscriptions.create).toHaveBeenCalledWith({
      customer: 'cus_test123',
      items: [{ price: 'price_123' }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent']
    });
  });
});

describe('POST /create-payment-intent', () => {
  it('should create a payment intent and return clientSecret and paymentIntentId', async () => {
    const res = await request(app)
      .post('/create-payment-intent')
      .send({ customerId: 'cus_test123', amount: 25, currency: 'usd' });
    expect(res.statusCode).toBe(200);
    expect(res.body.clientSecret).toBe('cs_test_pi');
    expect(res.body.paymentIntentId).toBe('pi_test123');
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 2500,
      currency: 'usd',
      customer: 'cus_test123',
      payment_method_types: ['card'],
      off_session: true,
      confirm: true
    });
  });
}); 