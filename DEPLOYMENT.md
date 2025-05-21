# LazyUncle Deployment Guide for Non-Technical Users

This guide provides step-by-step instructions for deploying the LazyUncle application, even if you don't have technical experience.

## Prerequisites

You'll need:
- A GitHub account (free)
- A Vercel or Netlify account (free tier is sufficient)
- Your Firebase credentials (if not using demo mode)

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

## Need More Help?

If you encounter issues:
1. Check the README.md for common solutions
2. Contact the developer who provided the code
3. Raise an issue on the GitHub repository 