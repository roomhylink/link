# Login Testing Guide

## How to Test the Login System

### 1. **Clear Browser Cache** (Important!)
Before testing, clear localStorage to reset the seeder:
```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

This will trigger the seeder to reinitialize all databases.

### 2. **Test Super Admin Login**
- **Login ID:** `roomhyadmin@gmail.com`
- **Password:** `admin@123`
- **Expected:** Redirects to `superadmin/superadmin.html`
- Opens browser dev tools (F12) and check Console for debug messages

### 3. **Create Employee (via Super Admin)**
1. Login as Super Admin
2. Go to Manager panel
3. Click "Add Employee"
4. Fill in:
   - Name: "John Doe"
   - Login ID: "EMP001"
   - Password: "emp@123"
   - Area: "Koramangala"
5. Click "Save"

### 4. **Test Employee Login**
- **Login ID:** `EMP001`
- **Password:** `emp@123`
- **Expected:** Redirects to `Areamanager/areaadmin.html`

### 5. **Create Property Owner (via Super Admin)**
1. Login as Super Admin
2. Go to Manager panel or use "Create Owner" option
3. Fill in:
   - Name: "Rajesh Kumar"
   - Email: "rajesh@example.com"
   - Login ID: "ROOMHY001"
   - Password: "temp@123" (temporary password)
4. Click "Save"

### 6. **Test Property Owner Login Flow**
- **Login ID:** `ROOMHY001`
- **Password:** `temp@123` (temporary password)
- **Expected Flow:**
  1. **Step 1:** Set New Password modal appears
     - New Password: `owner@123`
     - Confirm Password: `owner@123`
     - Click "Continue"
  2. **Step 2:** Complete Profile modal
     - Phone: `+91 98765 43210`
     - Address: `123 Property Lane, Bangalore`
     - City: `Bangalore`
     - Click "Continue"
  3. **Step 3:** KYC Verification modal
     - Aadhar: `123456789012`
     - PAN: `ABCD1234E` (optional)
     - Document: Upload a file (optional)
     - Click "Complete & Continue" or "Skip for Now"
  4. **Redirects to:** `propertyowner/admin.html`

### 7. **Debugging Tips**
Open browser Dev Tools (F12) → Console tab to see debug logs:

```
Login button clicked
Login ID: ROOMHY001 Password length: 7
Property Owner Login Flow
Total owners in DB: 1
Looking for owner with ID: ROOMHY001
Owner found: Rajesh Kumar
First login detected - showing password reset
```

### 8. **Common Issues & Fixes**

| Issue | Solution |
|-------|----------|
| "No database found" | Clear localStorage and reload |
| "Invalid ID or password" | Check exact spelling (case-sensitive) |
| Button doesn't respond | Check browser console for errors |
| Data not saving | Ensure localStorage is enabled |
| Login form is empty | Page may not be loading seeder.js properly |

### 9. **Check localStorage Content**
In browser console:
```javascript
// View all stored data
localStorage.roomhy_employees  // Employee records
localStorage.roomhy_owners_db  // Owner records
localStorage.user              // Current user session
```

### 10. **Test Each Login Type**

```
┌─────────────────────────────────────────────────────────┐
│  LOGIN TYPE    │  ID FORMAT     │  REDIRECT LOCATION    │
├─────────────────────────────────────────────────────────┤
│ Super Admin    │ email address  │ superadmin/           │
│ Area Manager   │ MGR...         │ Areamanager/areaadmin │
│ Employee       │ EMP...         │ Areamanager/areaadmin │
│ Property Owner │ ROOMHY...      │ propertyowner/admin   │
│                │ (with 4-step)  │                       │
└─────────────────────────────────────────────────────────┘
```

### 11. **Developer Console Debugging**
Enable all debug logs by checking browser console while testing - look for:
- ✅ "Login button clicked"
- ✅ "Owner found: [name]"
- ✅ "First login detected - showing password reset"
- ✅ "Redirecting to..."

---

**Last Updated:** December 3, 2025
**For Issues:** Check browser console (F12) → Console tab for error messages
