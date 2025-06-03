# LazyUncle-Simplified Deployment Checklist

> **Goal**: Get your app deployed and accessible to users ASAP

## 🚀 **Quick Deploy (30 minutes)**

### **Option A: Netlify Deploy (Recommended for beginners)**

1. **Build the app locally**:
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://app.netlify.com) and sign up
   - Click "Sites" → "Add new site" → "Deploy manually"
   - Drag the `dist` folder to the upload area
   - Wait for deployment to complete

3. **Set environment variables**:
   - Go to "Site settings" → "Environment variables"
   - Add: `VITE_DEMO_MODE=true` (for now)
   - Click "Trigger deploy" → "Deploy site"

4. **Access your site**:
   - Netlify gives you a URL like `https://amazing-name-123.netlify.app`
   - Test the login with: `demo@example.com` / `password`

### **Option B: Vercel Deploy**

1. **Push to GitHub**:
   - Create a GitHub repository
   - Push your code to GitHub

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign up with GitHub
   - Click "New Project" and select your repository
   - Set environment variable: `VITE_DEMO_MODE=true`
   - Click "Deploy"

---

## 🔧 **Production Setup (1-2 hours)**

### **1. Firebase Setup** (for real users, not demo)

1. **Create Firebase project**:
   - Go to [firebase.google.com](https://firebase.google.com)
   - Click "Get started" → "Create a project"
   - Enable Authentication and Firestore

2. **Get Firebase credentials**:
   - Project Settings → General → Your apps
   - Click "Web app" and copy the config

3. **Update environment variables**:
   ```bash
   VITE_DEMO_MODE=false
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### **2. OpenAI Setup** (for real gift recommendations)

1. **Get OpenAI API key**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up and get an API key

2. **Add to Netlify Functions**:
   - In Netlify: Site settings → Environment variables
   - Add: `OPENAI_API_KEY=your-openai-key`
   - Scope it to "Functions" only (not builds)

### **3. Custom Domain** (optional)

1. **Buy a domain** (Namecheap, GoDaddy, etc.)
2. **Add to Netlify**:
   - Domain settings → Add custom domain
   - Update DNS records as instructed

---

## ✅ **Testing Checklist**

### **Demo Mode Testing**
- [ ] Homepage loads correctly
- [ ] Can register with `demo@example.com` / `password`
- [ ] Can add a recipient
- [ ] Can add an occasion for the recipient  
- [ ] Gift recommendations appear
- [ ] Settings page works
- [ ] Can log out and back in

### **Production Mode Testing** (after Firebase setup)
- [ ] Can register with real email
- [ ] Email verification works
- [ ] Can log in/out with real account
- [ ] Data persists between sessions
- [ ] Gift recommendations use OpenAI (not demo data)

---

## 🆘 **Troubleshooting**

### **Common Issues**

**1. Blank page after deployment**
- Check browser console (F12) for errors
- Verify environment variables are set correctly
- Try setting `VITE_DEMO_MODE=true` temporarily

**2. "Network Error" on login**
- Check if Firebase credentials are correct
- Ensure `VITE_DEMO_MODE=false` if using real Firebase
- Check Firebase console for authentication errors

**3. Gift recommendations don't work**
- Check if OpenAI API key is set correctly
- Verify Netlify function is deployed
- Check Netlify function logs for errors

**4. Images not loading**
- Ensure the `public` folder is included in deployment
- Check if image URLs are accessible

### **Get Help**
- Check browser console (F12) for specific error messages
- Look at Netlify function logs if gift recommendations fail
- Verify all environment variables are set in hosting dashboard

---

## 🎯 **What's Next**

After deployment:

1. **Share with beta users** - Get feedback on the core workflow
2. **Monitor usage** - Check Netlify analytics for user behavior
3. **Iterate quickly** - Fix issues and deploy updates
4. **Add payment** - Integrate Stripe for real subscriptions
5. **Scale features** - Add more gift categories and integrations

Your app is now live and ready for users! 🎉 