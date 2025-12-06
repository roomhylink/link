# Quick Start: Tenant Assignment Feature

## 1. Verify Files Are In Place

Check these files exist:
```
✅ roomhy-backend/models/Tenant.js
✅ roomhy-backend/controllers/tenantController.js
✅ roomhy-backend/routes/tenantRoutes.js
✅ roomhy-backend/utils/generateTenantId.js
✅ propertyowner/tenantlogin.html
✅ propertyowner/tenantprofile.html
✅ propertyowner/tenantkyc.html
✅ propertyowner/tenantagreement.html
✅ propertyowner/tenantdashboard.html
✅ server.js (updated with tenant routes)
✅ roomhy-backend/routes/authRoutes.js (updated)
✅ roomhy-backend/controllers/authController.js (updated)
✅ propertyowner/rooms.html (updated with enhanced modal)
```

## 2. Start the Server

From project root:
```bash
npm start
```

Server should start on port 5000 and show:
```
MongoDB Connected
Server running on port 5000
```

## 3. Test Tenant Assignment (Owner Side)

**Step 1: Access Owner Panel**
- Go to `http://localhost:5000/propertyowner/ownerlogin.html`
- Login as owner (use existing owner credentials or create new visit first)

**Step 2: Navigate to Rooms**
- Click "Rooms" in sidebar
- Create a room if none exist (Room 101, Type: Single, Rent: 5000)
- Click "Manage Beds" → "Add" a bed (Label: A)

**Step 3: Assign Tenant**
- Click "Assign" on the vacant bed
- Fill form:
  ```
  Name: John Doe
  Email: john@example.com
  Phone: 9876543210
  Move-in Date: 2024-12-01
  Agreed Rent: 5000
  ```
- Click "Assign Tenant"
- Success modal shows credentials:
  ```
  Login ID: TNT-KO-001
  Temp Password: (8-char hex)
  ```
- Copy credentials (click "Copy Credentials")

## 4. Test Tenant Onboarding (Tenant Side)

**Step 1: Tenant Login**
- Go to `http://localhost:5000/propertyowner/tenantlogin.html`
- Enter credentials from above
- Form progresses to password setup
- Create new password: `MySecure@Pass123`
- Confirm password and click "Continue"
- Redirects to profile page

**Step 2: Complete Profile**
- Name, Email, Phone pre-filled
- Fill additional fields:
  - DOB: 1995-05-15
  - Address: 123 Main St
  - City: Bangalore
  - PIN: 560001
- Click "Save & Continue to KYC"

**Step 3: Upload KYC**
- Aadhar: `1234 5678 9012` (auto-formats)
- Upload any image for Identity Proof
- Upload any image for Address Proof
- Check agreement checkbox
- Click "Submit KYC"

**Step 4: Sign Agreement**
- Scroll through agreement (displays all terms)
- Check "I have read and understand..."
- Check "I agree to all terms..."
- Click "Sign Agreement"
- Success modal appears
- Click "Go to Dashboard"

**Step 5: View Dashboard**
- Shows welcome message with tenant name
- Displays all rental details
- Shows active status
- Quick action buttons available

## 5. Verify Data Storage

### Check localStorage (Demo Mode)
Open browser console (F12 → Console) and run:
```javascript
// View all tenants
JSON.parse(localStorage.getItem('roomhy_tenants'))

// View tenant profile
JSON.parse(localStorage.getItem('roomhy_tenant_profiles'))

// View KYC documents
JSON.parse(localStorage.getItem('roomhy_tenant_kyc'))

// View current user
JSON.parse(localStorage.getItem('user'))
```

### Check MongoDB (Backend Mode)
If backend is connected to MongoDB:
```javascript
// In MongoDB Compass or mongosh
db.tenants.find({})
db.users.find({ role: 'tenant' })
```

## 6. Test Multiple Tenants

Repeat the "Assign Tenant" process with different details:
- Tenant 2: Jane Smith, 9876543211, etc.
- Tenant 3: Bob Wilson, 9876543212, etc.

Verify each gets unique login ID:
- TNT-KO-001, TNT-KO-002, TNT-KO-003

Login as each tenant separately to verify data isolation.

## 7. Troubleshooting

### Issue: "Backend API failed" on assignment
**Solution:** Check server is running
- If running: Uses localStorage fallback (still works)
- Verify credentials still display in modal

### Issue: Form validation errors
**Solution:** Check field requirements:
- Name: Required
- Phone: 10 digits exactly
- Email: Valid format
- Move-in Date: Required
- Rent: Required

### Issue: Password setup fails
**Solution:** Check password requirements:
- Must be at least 8 characters
- Confirm password must match exactly

### Issue: KYC upload shows no file
**Solution:** 
- Click on drop zone to open file picker
- Select any valid image file (.jpg, .png, .pdf)
- File name should display below

### Issue: Files not appearing in localStorage
**Solution:**
```javascript
// Force refresh
localStorage.clear() // WARNING: Clears all data
location.reload()
```

### Issue: Can't login as tenant
**Solution:**
- Copy exact Login ID from credentials modal
- Copy exact temporary password (watch for case)
- Check for extra spaces (trim them)
- Use localStorage fallback if API error shows

## 8. Key Test Scenarios

✅ **Happy Path:**
1. Owner assigns tenant ✓
2. Credentials display ✓
3. Tenant logs in ✓
4. Password change forced ✓
5. Profile completed ✓
6. KYC submitted ✓
7. Agreement signed ✓
8. Dashboard shows active ✓

✅ **Validation:**
1. Missing fields show errors ✓
2. Invalid phone rejected ✓
3. Password mismatch shows error ✓
4. Files upload successfully ✓
5. Agreement checkboxes required ✓

✅ **Data Persistence:**
1. Refresh page → data persists ✓
2. Multiple tenants tracked ✓
3. Each tenant sees only own data ✓
4. localStorage saves all steps ✓

✅ **Error Handling:**
1. Server down → Uses localStorage ✓
2. Invalid credentials → Error modal ✓
3. Network error → User feedback ✓
4. File too large → Validation error ✓

## 9. Performance Tips

**Browser Console (F12):**
```javascript
// Monitor localStorage size
Math.round(JSON.stringify(localStorage).length / 1024) + ' KB'

// Clear if needed
localStorage.clear()

// Check all keys
Object.keys(localStorage)
```

**Network Tab:**
- Monitor API calls to /api/tenants/assign
- Check response times
- Verify proper error codes

## 10. Next Steps

After successful testing:
1. ✅ Test Step 1 (Assignment) - COMPLETE
2. → Ready for Step 2 (Onboarding pages) - READY
3. → Ready for Step 3 (Admin verification UI) - READY

For full documentation:
- See `TESTING_GUIDE.md` for detailed test flows
- See `IMPLEMENTATION_SUMMARY.md` for architecture
- See `TENANT_ASSIGNMENT_STEP1_IMPLEMENTATION.md` for technical details

## 11. Quick Commands

```bash
# Start server
npm start

# Check Node syntax
node -c roomhy-backend/controllers/tenantController.js

# View MongoDB
mongosh <connection_string>

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Del
```

## 12. Expected Results

After completing all steps, you should have:
- ✅ Tenant record in database
- ✅ User record with role='tenant'
- ✅ Stored profile information
- ✅ Stored KYC documents (as Data URLs)
- ✅ Signed rental agreement
- ✅ Active tenant status
- ✅ Accessible tenant dashboard

All data visible in:
- Browser localStorage (inspect with console)
- MongoDB collections (if backend connected)
- Dashboard page displays

---

## Estimated Time: 15-20 minutes to complete full flow

**Ready to test?** Start with Step 1: Owner Assigns Tenant!
