# Testing Guide: Tenant Assignment Workflow

## Prerequisites
- Backend server running: `npm start` from project root
- MongoDB connection available (or use localStorage demo mode)
- Owner account logged in to rooms.html

## Test Flow: Owner Assigns Tenant

### Step 1: Navigate to Room Management
```
1. Login as owner (use generated credentials)
2. Go to "Rooms" page
3. Click "Add New Room" if no rooms exist
   - Room No: 101
   - Type: Single Room
   - Rent: 5000
   - Click "Save Room"
4. Click "Manage Beds" on the room card
5. Add a bed (Bed Label: A)
6. Click "Assign" button on the vacant bed
```

### Step 2: Assign Tenant
```
Modal: "Assign Tenant to Room"
Fill the form:
- Full Name: John Doe
- Email: john@example.com
- Phone: 9876543210
- Move-in Date: 2024-12-01
- Agreed Monthly Rent: 5000

Click "Assign Tenant"
```

### Step 3: Capture Credentials
```
Success Modal appears:
- Login ID: TNT-KO-001 (or similar)
- Temporary Password: (e.g., A1B2C3D4)

Click "Copy Credentials" to copy to clipboard
(In production, these would be emailed/SMS'd to tenant)
```

## Test Flow: Tenant Onboarding

### Step 1: Tenant Login (tenantlogin.html)
```
1. Open propertyowner/tenantlogin.html
2. Enter credentials from above:
   - Tenant ID: TNT-KO-001
   - Temporary Password: A1B2C3D4
3. Click "Verify"
4. Form transitions to "Create Your Password"
5. Enter new password (min 8 chars):
   - New Password: MySecure@Pass123
   - Confirm: MySecure@Pass123
6. Click "Continue"
→ Redirects to tenantprofile.html
```

### Step 2: Complete Profile (tenantprofile.html)
```
1. Pre-filled fields:
   - Full Name: John Doe
   - Email: john@example.com
   - Phone: 9876543210
   - Property: Property Demo
   - Room: Room 101, Bed A
   - Move-in Date: 12/1/2024
   - Agreed Rent: ₹5000

2. Fill additional fields:
   - Date of Birth: 1995-05-15
   - Full Address: 123 Main St, Apt 4B
   - City: Bangalore
   - PIN Code: 560001

3. Click "Save & Continue to KYC"
→ Redirects to tenantkyc.html
```

### Step 3: KYC Upload (tenantkyc.html)
```
1. Fill Aadhar Number: 1234 5678 9012
   (Auto-formats to spaces)

2. Upload Identity Proof:
   - Click on drop zone or drag file
   - Select any image (PAN, Passport, ID)
   - Display shows: ✓ filename.jpg

3. Upload Address Proof:
   - Click on drop zone or drag file
   - Select any image (Utility bill, Bank stmt)
   - Display shows: ✓ filename.jpg

4. Check agreement checkbox:
   ☑ "I confirm that the information..."

5. Click "Submit KYC"
→ Redirects to tenantagreement.html
```

### Step 4: Sign Rental Agreement (tenantagreement.html)
```
1. Scroll through agreement document
   - Review property details
   - Review rental terms
   - Review obligations

2. Check agreement comprehension:
   ☑ "I have read and understand..."
   
3. Check acceptance:
   ☑ "I agree to all terms..."

4. Note: "Signed by John Doe on [Current Date]"

5. Click "Sign Agreement"
   Success modal appears with congratulations message

6. Click "Go to Dashboard"
→ Redirects to tenantdashboard.html
```

### Step 5: Verify Tenant Dashboard (tenantdashboard.html)
```
Display should show:
- Welcome message: "Welcome, John Doe! 👋"
- Rental Status: Active (with sign-up date)
- Next Payment: ₹5000 (due 1st of next month)
- Rental Agreement: Signed (with date)
- Your Room: Room 101, Bed A (₹5000/month)

Quick actions available:
- Pay Rent
- My Profile
- Raise Complaint
```

## Test Scenarios

### Scenario 1: Backend API Available
```
- All requests go to backend API
- Tenant created in MongoDB
- Login credentials stored in User collection
- Data persists across sessions
- Verify in MongoDB Atlas or local DB
```

### Scenario 2: Demo Mode (API Unavailable)
```
- Frontend catches API error
- Falls back to localStorage
- All data stored in browser
- Generate mock IDs/passwords locally
- Works completely offline
```

### Scenario 3: Form Validation
```
Test missing fields:
- Submit form without Full Name → Error
- Submit form without Email → Error
- Submit Phone with letters → Error
- Submit Aadhar with <12 digits → Error
- Submit Agreement without checkboxes → Error

Test field formats:
- Phone number: Must be exactly 10 digits
- Aadhar: Auto-formats to XXXX XXXX XXXX pattern
- Date fields: Calendar picker validation
- Email: Standard email format validation
```

### Scenario 4: File Upload
```
1. Click on KYC file upload zone
2. Select a test image file
3. Verify filename displays in modal
4. Submit KYC
5. Check localStorage.roomhy_tenant_kyc for Data URL
6. Verify Data URL is valid (base64)
```

### Scenario 5: Multi-Tenant Assignment
```
1. Assign 3 different tenants to different beds
   - John Doe to Room 101, Bed A
   - Jane Smith to Room 101, Bed B
   - Bob Wilson to Room 102, Bed A

2. Verify each gets unique login ID:
   - TNT-KO-001, TNT-KO-002, TNT-KO-003

3. Login as each tenant separately
4. Verify data isolation (each sees only own data)
5. Verify rooms.html shows "Occupied" status for beds
```

## Debugging Tips

### Check localStorage
```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('roomhy_tenants')))
console.log(JSON.parse(localStorage.getItem('roomhy_tenant_profiles')))
console.log(JSON.parse(localStorage.getItem('roomhy_tenant_kyc')))
console.log(JSON.parse(localStorage.getItem('user')))
```

### Check API Calls
```javascript
// In browser Network tab:
// Look for:
// - POST /api/tenants/assign
// - POST /api/auth/tenant/verify-temp
// - POST /api/auth/tenant/set-password
```

### Clear Data
```javascript
// Reset all tenant data
localStorage.removeItem('roomhy_tenants')
localStorage.removeItem('roomhy_tenant_profiles')
localStorage.removeItem('roomhy_tenant_kyc')
localStorage.removeItem('user')
```

### Test Error Handling
```
1. Close backend server while in login form
2. Try to verify credentials
3. Should fall back to localStorage gracefully
4. Error modal should appear with helpful message
```

## Success Criteria

✅ Owner can assign tenant with all required fields
✅ System generates unique login ID for each tenant
✅ Temporary password is created and displayed
✅ Tenant can login with provided credentials
✅ Password change is enforced on first login
✅ Profile form pre-fills with assigned data
✅ KYC documents are uploaded and stored
✅ Rental agreement is displayed and signed
✅ Tenant dashboard shows all correct information
✅ Data persists in both API and localStorage
✅ Form validation prevents invalid data
✅ Error messages are user-friendly and helpful
✅ Mobile responsive design works on all screens
✅ Workflow redirects work correctly at each step

## Expected Output Files

After completing full workflow:

**localStorage (Demo Mode):**
```json
{
  "roomhy_tenants": [{...}],
  "roomhy_tenant_profiles": [{...}],
  "roomhy_tenant_kyc": [{...}],
  "user": { "loginId": "TNT-KO-001", ... }
}
```

**MongoDB (Backend Mode):**
- 1 Tenant document with full details
- 1 User document with role='tenant'
- Linked via loginId and user references
