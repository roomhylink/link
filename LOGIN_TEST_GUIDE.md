# RoomHy Unified Login - Quick Test Guide

## 🚀 Getting Started

### Step 1: Initialize Database
1. Open `index.html` in your browser (if it exists and loads seeder)
2. Or navigate to `unifiedlogin.html` directly (seeder.js is loaded there)
3. Check browser console for initialization messages

### Step 2: Test Super Admin Login
**Login Credentials:**
- Email: `roomhyadmin@gmail.com`
- Password: `admin@123`

**Steps:**
1. Open `unifiedlogin.html`
2. Enter email in "Login ID / Email" field
3. Enter password
4. Click "Login"
5. **Expected Result**: Redirects to `superadmin/superadmin.html`

---

## 👨‍💼 Testing Area Manager Login

### First: Create Area Manager (as Super Admin)
1. Login as Super Admin (see above)
2. Navigate to Area Manager creation section
3. Create a new Area Manager with:
   - Login ID: `MGRKO001` (or similar MGR format)
   - Password: `manager123`
   - Name: Test Manager
   - Area Code: KO

### Then: Login as Area Manager
1. Open `unifiedlogin.html`
2. Enter Login ID: `MGRKO001`
3. Enter password: `manager123`
4. Click "Login"
5. **Expected Result**: Redirects to `Areamanager/areaadmin.html`

---

## 🏠 Testing Property Owner Login

### First: Create Property Owner (as Super Admin)
1. Login as Super Admin
2. Navigate to Property Owner creation section
3. Create a new Property Owner with:
   - Login ID: `ROOMHYKO001` (or similar ROOMHY format)
   - Password: `owner123`
   - Name: Test Owner
   - Email: owner@test.com
   - Phone: 9876543210
   - Address: Test Address

### Then: Login as Property Owner
1. Open `ownerlogin.html`
2. Enter Owner ID: `ROOMHYKO001`
3. Enter password: `owner123`
4. Click "Login"
5. **Expected Result**: Redirects to `propertyowner/admin.html`

---

## 👥 Testing Tenant Login

### First: Create Tenant (as Property Owner)
1. Login as Property Owner (see above)
2. Navigate to Tenant creation section
3. Create a new Tenant with:
   - Name: Test Tenant
   - Email: tenant@test.com
   - Phone: 9876543210
   - Room Number: 101
   - Password: tenant123

### Then: Login as Tenant
1. Open `tenantlogin.html`
2. Enter Tenant ID: (the ID generated during creation)
3. Enter password: `tenant123`
4. Click "Login"
5. **Expected Result**: Redirects to `tenant.html/tenantdashboard.html`

---

## 🔍 Troubleshooting

### Issue: "Not logged in" error on dashboard
- **Cause**: Session expired or not set
- **Solution**: Login again from appropriate login page

### Issue: "Super Admin not initialized"
- **Cause**: Seeder not run or localStorage cleared
- **Solution**: Refresh page with `unifiedlogin.html` loaded, or run `window.initializeSeeder()` in console

### Issue: "Invalid ID or password"
- **Cause**: Credentials don't match database
- **Solution**: 
  - For Super Admin: Use `roomhyadmin@gmail.com` and `admin@123`
  - For others: Verify you created the account first

### Issue: Redirect loop
- **Cause**: Wrong role trying to access wrong dashboard
- **Solution**: Use correct login page for your role

---

## 📱 Testing Role Auto-Detection

### Email Format (Super Admin)
1. Enter: `roomhyadmin@gmail.com`
2. System recognizes `@` symbol
3. Routes to Super Admin login

### MGR Format (Area Manager)
1. Enter: `MGRKO001`
2. System recognizes `MGR` prefix
3. Routes to Area Manager login

### ROOMHY Format (Property Owner)
1. Enter: `ROOMHYKO001`
2. System recognizes `ROOMHY` prefix
3. Shows message to use ownerlogin.html

---

## 💾 Browser Storage Check

### View Stored Data
1. Open browser Developer Tools (F12)
2. Go to "Application" → "Local Storage"
3. Look for URLs with your domain
4. Check these keys:
   - `roomhy_superadmin_db` - Super Admin data
   - `roomhy_areamanagers_db` - Area Managers list
   - `roomhy_owners_db` - Property Owners data
   - `roomhy_tenants` - Tenants list
   - `user` - Current session user
   - `superadmin_user` - Super Admin session
   - `manager_user` - Area Manager session

### Clear All Data
1. Developer Tools → Application → Local Storage
2. Right-click → Delete All or manually delete each key
3. Refresh page to re-initialize

---

## ✅ Test Checklist

- [ ] Super Admin login works
- [ ] Area Manager login works
- [ ] Property Owner login works
- [ ] Tenant login works
- [ ] Dashboard session validation works
- [ ] Email format auto-routes to Super Admin login
- [ ] MGR format auto-routes to Area Manager login
- [ ] ROOMHY format shows owner login redirect
- [ ] Logout clears session
- [ ] Browser back button doesn't bypass login
- [ ] Unauthorized access redirects to login

---

## 🔐 Session Security Notes

- Sessions are stored in browser `localStorage`
- Closing browser does NOT clear session (persistent)
- To logout: Clear localStorage keys or implement logout button
- For production: Use secure backend authentication

---

## 📞 Need Help?

Check these documentation files:
- `UNIFIED_LOGIN_SETUP.md` - Complete technical setup
- `USER_CREATION_WORKFLOW.md` - User creation hierarchy
- `QUICK_START_GUIDE.md` - General quick start
