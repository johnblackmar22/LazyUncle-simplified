# Local Development Guide

## Running in Demo Mode

For local development and testing, you can run the application in "demo mode," which uses localStorage instead of Firebase. This allows you to test the app's functionality without needing to set up a Firebase project or Authentication.

### Steps to Enable Demo Mode

1. Copy the provided `local.env.temp` file to `.env` in the project root:
   ```bash
   cp local.env.temp .env
   ```

2. Ensure `VITE_DEMO_MODE=true` is set in the `.env` file.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application should now run in demo mode, using localStorage to store data instead of Firebase.

## Important Notes About Demo Mode

- Demo mode is **for local development only**
- The `.env` file should NOT be committed to version control
- For production deployment, make sure to:
  1. Turn off demo mode by setting `VITE_DEMO_MODE=false` 
  2. Configure proper Firebase credentials in your deployment environment
  3. Follow the deployment instructions in `DEPLOYMENT.md`

## Switching Between Demo Mode and Firebase Mode

To switch back to using Firebase:

1. Edit your `.env` file:
   ```
   VITE_DEMO_MODE=false
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. Restart the development server.

## Troubleshooting

- If you encounter "Failed to create recipient" errors, make sure demo mode is properly enabled.
- Check the browser console for any Firebase-related errors.
- If using Firebase mode, ensure you're logged in and have the correct permissions. 