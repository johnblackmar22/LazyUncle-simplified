const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

module.exports = {
  stripe,
  getWebhookSecret
}; 