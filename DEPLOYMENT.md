# LazyUncle Deployment Guide for Non-Technical Users

This guide provides step-by-step instructions for deploying the LazyUncle application, even if you don't have technical experience.

## Prerequisites

You'll need:
- A GitHub account (free)
- A Vercel or Netlify account (free tier is sufficient)
- Your Firebase credentials (if not using demo mode)

## Production Mode Configuration

For production deployments, it's crucial to disable demo mode and connect to the real Firebase and OpenAI API services:

1. **Disable Demo Mode**
   - Set the environment variable `VITE_DEMO_MODE=false` in your hosting platform
   - Ensure all Firebase credentials are correctly configured (see below)

2. **Firebase Configuration**
   - Add these environment variables with your real Firebase values:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```
   
3. **OpenAI API Configuration**
   - Create the required Netlify function (see `/netlify/functions/gift-recommendations`)
   - Add your OpenAI API key as an environment variable:
     ```
     OPENAI_API_KEY=your-openai-api-key
     ```
   - Make sure the Netlify function endpoint is accessible at `/.netlify/functions/gift-recommendations`

4. **Verifying Production Setup**
   - After deployment, check the browser console
   - You should see the message "Running in demo mode: false"
   - Test the gift recommendation feature to ensure it connects to the real API

## Option 1: Deploy to Netlify (Easiest)

1. **Create a Netlify account**
   - Go to [Netlify](https://app.netlify.com) and sign up (can use GitHub to sign in)

2. **Deploy from the dist folder**
   - Download this repository as a ZIP file or clone it
   - Run `npm install` and `npm run build` to create the `dist` folder
   - From the Netlify dashboard, click "Sites" then "Add new site" → "Deploy manually"
   - Drag and drop the `dist` folder from your computer to the upload area

3. **Set environment variables**
   - Once deployed, go to "Site settings" → "Environment variables"
   - Add the following variables:
     ```
     VITE_DEMO_MODE=true
     ```
   - If using Firebase, add all your Firebase credentials (see README.md)
   - NOTE: For production deployments, set VITE_DEMO_MODE=false and follow the "Production Mode Configuration" section above

4. **Trigger a redeployment**
   - Go to "Deploys" and click "Trigger deploy" → "Deploy site"

5. **Access your site**
   - Netlify will provide a URL like `https://your-site-name.netlify.app`
   - You can set up a custom domain in the "Domain settings" section

## Option 2: Deploy to Vercel

1. **Create a Vercel account**
   - Go to [Vercel](https://vercel.com) and sign up (can use GitHub to sign in)

2. **Import your GitHub repository**
   - Fork this repository to your GitHub account
   - In Vercel, click "New Project" and select your repository
   - Follow the setup wizard (use default settings)

3. **Configure environment variables**
   - During setup (or later in Project Settings), add environment variables:
     ```
     VITE_DEMO_MODE=true
     ```
   - If using Firebase, add all Firebase credentials
   - NOTE: For production deployments, set VITE_DEMO_MODE=false and follow the "Production Mode Configuration" section above

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Vercel will provide a URL to access your site

## Option 3: Firebase Hosting (If using Firebase)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set "dist" as your public directory
   - Configure as a single-page app: Yes
   - Set up automatic builds and deploys: No

4. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

5. **Access your site**
   - Firebase will provide a URL like `https://your-project.web.app`

## Troubleshooting

### Blank page after deployment
- Check if you've set the environment variables correctly
- Make sure you're using the correct Firebase credentials
- Try enabling demo mode: `VITE_DEMO_MODE=true`

### Images not loading
- Make sure the Logos folder is included in your deployment
- If using Netlify, check if files are properly uploaded

### Application errors
- Open browser developer tools (F12) to check for console errors
- Verify that all environment variables are correctly set

### API Connection Issues
- If gift recommendations don't work in production mode, check:
  - Netlify function deployment status
  - OpenAI API key configuration
  - Network requests in browser developer tools
  - Try setting `VITE_DEMO_MODE=true` temporarily to verify other functionality

### Firebase Connection Issues
- If login/authentication doesn't work:
  - Verify Firebase credentials are correctly set
  - Check Firebase console to ensure Authentication service is enabled
  - Confirm that your Firebase security rules allow the operations
  - Check browser console for specific Firebase error messages

## Need More Help?

If you encounter issues:
1. Check the README.md for common solutions
2. Contact the developer who provided the code
3. Raise an issue on the GitHub repository 