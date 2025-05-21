# LazyUncle Test Plan - Navbar and Sidebar

## Test Cases for Navigation Layout

### Homepage
1. **Homepage Navigation**
   - Visit the homepage ('/')
   - Verify that the HomeNavbar is visible
   - Verify that the main app Navbar is NOT visible
   - Verify that the Sidebar is NOT visible
   - Verify the HomeNavbar shows "Get Started" and "Login" buttons when not logged in
   - Verify the HomeNavbar shows "Dashboard" button when logged in
   - Scroll down the page and verify the navbar becomes solid with shadow

### Public Pages
1. **Subscription Plans Page**
   - Visit '/subscription/plans'
   - Verify that the main app Navbar IS visible
   - Verify that the Sidebar is NOT visible

2. **How It Works Page**
   - Visit '/how-it-works' 
   - Verify that the main app Navbar IS visible
   - Verify that the Sidebar is NOT visible

### Authentication Pages
1. **Login Page**
   - Visit '/login'
   - Verify that the Navbar is NOT visible
   - Verify that the Sidebar is NOT visible

2. **Register Page**
   - Visit '/register'
   - Verify that the Navbar is NOT visible 
   - Verify that the Sidebar is NOT visible

### Protected Pages
1. **Dashboard Page**
   - Log in to the app
   - Visit '/dashboard'
   - Verify that the main app Navbar IS visible
   - Verify that the Sidebar IS visible
   - Verify that clicking links in Sidebar navigates correctly

2. **Recipients Page**
   - Visit '/recipients' while logged in
   - Verify that the main app Navbar IS visible
   - Verify that the Sidebar IS visible
   - Verify correct highlighting of current page in Sidebar

3. **Settings Page**
   - Visit '/settings' while logged in
   - Verify that the main app Navbar IS visible
   - Verify that the Sidebar IS visible
   - Verify correct highlighting of current page in Sidebar

## Responsive Testing
1. **Mobile View - Homepage**
   - View homepage on mobile viewport
   - Verify HomeNavbar hamburger menu works correctly
   - Verify mobile menu contains expected links

2. **Mobile View - Dashboard**
   - View dashboard on mobile viewport
   - Verify Navbar hamburger menu works correctly
   - Verify Sidebar is not visible on mobile (it should be hidden)

## Authentication State Testing
1. **Logged Out to Logged In**
   - Start at homepage while logged out
   - Log in to the app
   - Verify UI updates correctly showing authenticated navigation options

2. **Logged In to Logged Out**
   - Start at dashboard while logged in
   - Log out of the app
   - Verify redirect to homepage
   - Verify UI updates correctly showing unauthenticated navigation options 