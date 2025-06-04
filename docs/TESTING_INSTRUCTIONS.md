# Testing Instructions for Bug Fixes

## 🧪 **Critical Bug Testing Protocol**

### **Test 1: Delivery Address Bug**

**Steps to Test:**
1. Open browser console (F12 → Console tab)
2. Log in with demo credentials: `demo@example.com` / `password`
3. Navigate to "Add Recipient"
4. Fill in basic info: Name, Relationship
5. **IMPORTANT**: Fill in delivery address completely:
   - Street Address: `123 Main St`
   - City: `Springfield`
   - State: `IL`
   - ZIP: `62701`
6. Click "Save Recipient"
7. Check console for debug messages showing address data

**Expected Console Output:**
```
AddRecipientPage - deliveryAddress changed: {line1: "123 Main St", city: "Springfield", state: "IL", postalCode: "62701", country: "US"}
AddRecipientPage - About to submit recipient with delivery address: {line1: "123 Main St", city: "Springfield", state: "IL", postalCode: "62701", country: "US"}
```

**Success Criteria:**
- ✅ Recipient is created successfully
- ✅ Address data appears in console logs
- ✅ Can proceed to add occasions without errors

---

### **Test 2: Refresh Authentication Bug**

**Steps to Test:**
1. Open browser console (F12 → Console tab)
2. Log in with demo credentials: `demo@example.com` / `password`
3. Navigate around the app (recipients, dashboard)
4. **CRITICAL**: Refresh the browser (F5 or Cmd+R)
5. Check console for auth debugging messages

**Expected Console Output:**
```
App.tsx - Initializing auth...
=== AUTH INITIALIZATION ===
Demo mode detected: true
Stored demo user: {id: "demo-user-...", email: "demo@lazyuncle.com", ...}
Demo user restored successfully
App.tsx - Firebase auth state changed: User logged out
App.tsx - Current store state: {demoMode: true, user: true}
App.tsx - Skipping Firebase auth state change - in demo mode
```

**Success Criteria:**
- ✅ User stays logged in after refresh
- ✅ No redirect to login page
- ✅ Demo mode is preserved
- ✅ All data remains available

---

### **Test 3: Occasion Persistence Bug**

**Steps to Test:**
1. Create a recipient with delivery address (Test 1)
2. Go to recipient detail page
3. Add a gift occasion (any occasion)
4. Verify occasion appears in the list
5. **Sign out** of the app
6. **Sign back in** with demo credentials
7. Navigate to recipients list
8. Check that occasion is still visible

**Success Criteria:**
- ✅ Occasion persists after sign out/in
- ✅ Occasion appears in recipients list with badge
- ✅ Occasion data is retained in recipient detail

---

## 🔧 **Debugging Guide**

If any test fails, check the console for these specific debug messages:

### **Address Form Issues:**
- Look for `AddressForm - handleAddressChange called with:` messages
- Verify address object has all expected fields
- Check that `onChange` callback is being triggered

### **Auth Issues:**
- Look for `=== AUTH INITIALIZATION ===` messages
- Verify `Demo mode detected: true`
- Check that Firebase auth state changes are being skipped

### **Data Persistence Issues:**
- Check localStorage in DevTools (Application tab)
- Look for `lazyuncle_` prefixed keys
- Verify data is being saved and restored correctly

## 🎯 **Quick Test Summary**

Run all three tests in sequence:
1. **Address Test**: Create recipient with address ✓
2. **Refresh Test**: Refresh browser, stay logged in ✓  
3. **Persistence Test**: Sign out/in, data remains ✓

If all tests pass, the bugs are fixed and the app is ready for production use! 