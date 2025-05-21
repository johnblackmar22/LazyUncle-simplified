# LazyUncle - Never Forget Another Birthday

LazyUncle is a gift automation platform for busy people who want to be remembered for thoughtful gifts without all the hassle. Set it up once, and we'll remind you, recommend appropriate gifts, and ship them directly to your loved ones.

## Features

- **Automated Gift Giving**: Set it and forget it. We handle everything from reminders to delivery.
- **Smart Gift Recommendations**: Thoughtful suggestions that recipients will actually love.
- **Multiple Subscription Tiers**: Choose the plan that fits your needs and budget.
- **Simple Setup Process**: Add your recipients in just a few minutes.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file (copy example values)
echo "VITE_DEMO_MODE=true" > .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Setup

### Prerequisites
- Node.js v18 or higher
- npm v7 or higher

### Environment Configuration
Create a `.env` file in the root directory with the following variables:

```
# Enable demo mode (no Firebase account needed)
VITE_DEMO_MODE=true

# Or use Firebase configuration (for production)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running in Development Mode
The application can run in two modes:

1. **Demo Mode**: Uses local storage to simulate a backend. Great for testing the UI without Firebase.
   ```
   VITE_DEMO_MODE=true
   ```

2. **Firebase Mode**: Connects to a real Firebase backend for authentication and data storage.
   ```
   VITE_DEMO_MODE=false
   ```

## Production Deployment

### Build for Production
```bash
npm run build
```
This creates optimized files in the `dist` folder that can be deployed to any static hosting service.

### Recommended Hosting Services

1. **Firebase Hosting** (Recommended if using Firebase)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

2. **Netlify**
   - Connect your GitHub repository or drag and drop the `dist` folder
   - Set the required environment variables in Netlify dashboard

3. **Vercel**
   - Import from Git repository
   - Configure environment variables in Vercel dashboard

### Important Notes for Deployment

- **Environment Variables**: All Firebase credentials should be set as environment variables on your hosting platform.
- **Firebase Security Rules**: Review and update Firestore security rules before going live.
- **Demo Mode**: Set `VITE_DEMO_MODE=false` for production deployments.

## Troubleshooting

### Common Issues

1. **Blank Screen / Loading Issues**
   - Check browser console for errors
   - Verify Firebase credentials are correct
   - Make sure demo mode is properly configured

2. **Image Loading Failures**
   - Images use fallback SVGs when loading fails
   - Verify the Logos directory is properly deployed

3. **ES Module Errors**
   - The project uses ES modules; avoid CommonJS `require()` statements
   - Use `import` instead of `require`

## Tech Stack

- **Frontend**: React 18, TypeScript, Chakra UI
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 + Chakra UI
- **Backend**: Firebase (Auth, Firestore)
- **Testing**: Jest

## Project Structure

```
LazyUncle/
├── src/               # Source code
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages/routes
│   ├── services/      # Firebase and API services
│   ├── store/         # State management
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── public/            # Static assets
├── Logos/             # Logo assets
├── dist/              # Production build output
└── netlify/           # Netlify serverless functions
```

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is prohibited.

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

## Contributing

This project is currently in private development. Contribution guidelines will be provided when the project moves to open source.

## ⚠️ Deployment Reminder: OpenAI API Key Security

Before going live, make sure to:
- Set your `OPENAI_API_KEY` as a **secret** in Netlify environment variables.
- Scope it to **Functions** only (not Builds, Runtime, or Post processing).
- Never expose your API key to the frontend or commit it to your codebase.

If you are on a free Netlify plan and cannot set secrets/scopes, remember to update this setting after upgrading your account.

## Local Development Setup

1. Create a `.env` file in your project root (if it doesn't exist).
2. Add this line:
   ```
   OPENAI_API_KEY=sk-...yourkey...
   ```
3. Save the file. The Netlify CLI will use this value when running `netlify dev`.
