# LazyUncle - Never Forget Another Birthday

LazyUncle is a gift automation platform for busy uncles and aunts who want to be the cool relative without all the hassle. Set it up once, and we'll remind you, recommend age-appropriate gifts, and ship them directly to your nephews and nieces.

## Features

- **Automated Gift Giving**: Set it and forget it. We handle everything from reminders to delivery.
- **Smart Gift Recommendations**: Age-appropriate suggestions that kids will actually love.
- **Multiple Subscription Tiers**: Choose the plan that fits your needs and budget.
- **Simple Setup Process**: Add your nephews and nieces in just a few minutes.

## Development Status

LazyUncle is currently in development. The core functionality includes:

- [x] Homepage with clear value proposition
- [x] Simplified recipient addition flow
- [x] Subscription plan management
- [x] Basic test infrastructure

## Development Roadmap

### 1. Firebase Authentication & Database Setup
- Implement proper user authentication
- Set up Firestore database security rules
- Create authentication flow (login/signup/password reset)

### 2. Gift Recommendation Engine
- Enhance AI-based gift recommendation algorithms
- Build age-appropriate gift catalog
- Implement interest-based filtering

### 3. Automatic Shipping Integration
- Connect to shipping APIs (USPS, UPS, FedEx)
- Implement address validation
- Create shipment tracking notifications

### 4. Payment Processing
- Integrate with Stripe for subscription billing
- Implement subscription management
- Set up secure payment processing

### 5. Notification System
- Birthday reminders via email/SMS
- Shipping confirmations
- Gift approval requests

### 6. Admin Dashboard
- Order management 
- User management
- Analytics and reporting

## Getting Started

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Deployment (For Non-Technical Users)

LazyUncle can be easily deployed to the web using modern hosting services. Here are the simplest options:

### One-Click Deploy (Recommended)

- **Vercel** (https://vercel.com/import):
  1. Click the link and import your GitHub repository.
  2. Set the required environment variables (see below).
  3. Click "Deploy". Your app will be live in minutes.

- **Netlify** (https://app.netlify.com/drop):
  1. Drag and drop your project folder, or connect your GitHub repository.
  2. Set environment variables as prompted.
  3. Click "Deploy".

### Environment Variables

Before deploying, make sure to set up your `.env` file with the following (example):

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

You can find these values in your Firebase and Stripe dashboards.

### Manual Deploy (Advanced)

1. Build the app:
   ```bash
   npm run build
   ```
2. Upload the `dist/` folder to your web host (e.g., Netlify, Vercel, Firebase Hosting).

### Need Help?
If you get stuck, reach out to a developer friend or contact support for your chosen hosting provider. Most platforms have excellent guides for React/Vite apps.

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Chakra UI for components
- Firebase for backend
- Jest for testing
- Zustand for state management

## Contributing

This project is currently in private development. Contribution guidelines will be provided when the project moves to open source.
