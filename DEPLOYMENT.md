# LazyUncle Deployment Guide

This guide will walk you through setting up Firebase and deploying your LazyUncle application.

## Prerequisites

- Node.js and npm installed on your computer
- Git installed on your computer
- A Google account for Firebase
- Basic familiarity with the command line

## Step 1: Set Up Firebase

1. **Create a Firebase Project**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter "LazyUncle" as the project name
   - Follow the prompts to complete project setup

2. **Enable Authentication**
   - In your Firebase project, go to "Authentication" in the left sidebar
   - Click "Get started"
   - Enable the "Email/Password" sign-in method
   - Click Save

3. **Create a Firestore Database**
   - In your Firebase project, go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in production mode" (recommended)
   - Select a location closest to you or your users
   - Click "Enable"

4. **Set up Firebase Hosting**
   - In your Firebase project, go to "Hosting" in the left sidebar
   - Click "Get started"
   - Follow the setup instructions (you'll execute the commands later)

5. **Get Your Firebase Configuration**
   - In the Firebase console, click on the gear icon next to "Project Overview" and select "Project settings"
   - Scroll down to the "Your apps" section
   - If you don't have an app registered, click on the web icon (</>) to register a new web app
   - Register the app with the name "LazyUncle Web"
   - Copy the configuration object (it looks like `const firebaseConfig = { ... }`)

## Step 2: Configure Your Local Environment

1. **Create a .env file**
   - In your project's root directory, create a file named `.env`
   - Add the following content, replacing the values with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_DEMO_MODE=false
```

2. **Install Firebase Tools**
   - Run this command to install Firebase CLI:
```bash
npm install -g firebase-tools
```

3. **Log in to Firebase**
```bash
firebase login
```

4. **Initialize Firebase**
```bash
firebase init
```
   - Select the following Firebase features:
     - Firestore
     - Hosting
     - Storage
   - Select your Firebase project
   - Accept default Firestore rules file
   - Choose `dist` as your public directory
   - Configure as a single-page app (SPA): Yes
   - Set up automatic builds and deploys: No

## Step 3: Build and Deploy

1. **Build the project**
```bash
npm run build
```

2. **Deploy to Firebase**
```bash
firebase deploy
```

3. **Access your deployed app**
   - After deployment is complete, Firebase will provide a URL where your app is hosted
   - The app will be available at `https://<your-project-id>.web.app`

## Step 4: Set Up Continuous Deployment (Optional)

For a more advanced setup, you can configure GitHub Actions to automatically deploy your app when changes are pushed to your repository. This requires:

1. Setting up a GitHub repository for your project
2. Creating a Firebase token for CI/CD
3. Adding GitHub Actions workflow files

Detailed instructions for this are available in the Firebase documentation.

## Troubleshooting

- **Firebase initialization errors**: Make sure you're in the root directory of your project when running `firebase init`
- **Build errors**: Check that all required environment variables are properly set in your `.env` file
- **Deployment errors**: Ensure you've built the project before deploying with `npm run build`
- **Authentication issues**: Verify that Email/Password authentication is enabled in Firebase console

If you encounter any issues, refer to the [Firebase documentation](https://firebase.google.com/docs) or seek help from the Firebase community. 