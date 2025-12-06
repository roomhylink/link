# Quick Testing Guide - Tenant Verification System

## 🚀 Quick Start Testing

### Scenario 1: Complete Tenant Onboarding (Happy Path)

**Goal:** Verify tenant can complete all 4 steps and access dashboard

**Steps:**
1. Open `propertyowner/rooms.html` (Owner Panel)
2. Click **"Assign Tenant"** button on any room
3. Fill form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+91-9876543210`
   - Room: `101`
   - Move-in Date: Today
   - Rent: `₹5000`
4. Click **"Assign Tenant"**
5. ✅ Success modal shows:
   - Login ID: `TNT-XX-001`
   - Temp Password: `A1B2C3D4` (example)
   - **NEW:** 4-step onboarding timeline info

**Expected Results:**
- ✅ Modal shows "Onboarding Process" section
- ✅ Lists 4 required steps
- ✅ Explains data privacy: "Details NOT visible until complete"

---

### Scenario 2: Tenant Login & Onboarding

**Goal:** Verify tenant can complete 4-step onboarding process

**Steps:**
1. Open `propertyowner/tenantlogin.html`
2. Enter credentials from modal:
   - Tenant ID: `TNT-XX-001`
   - Password: `A1B2C3D4`
3. Click **"Verify"**
4. ✅ Redirected to `tenantprofile.html` (4-step form)

**Step 1: Set Password**
```
1. Enter new password: Test@123
2. Confirm password: Test@123
3. Click "Continue"
✅ Step 1 marked complete, moves to Step 2
```

**Step 2: Fill Profile**
```
1. Name: John Doe (auto-filled)
2. Phone: +91-9876543210 (auto-filled)
3. Address: 123 Main St, Bangalore
4. Click "Save & Next"
✅ Step 2 marked complete, moves to Step 3
```

**Step 3: KYC**
```
1. Aadhar: 123456789012
2. Upload ID Proof: Select any file
3. Upload Address Proof: Select any file
4. Click "Upload & Continue"
✅ Step 3 marked complete, moves to Step 4
```

**Step 4: Agreement**
```
1. Scroll and read agreement
2. Check: "I have read the agreement"
3. Check: "I accept terms & conditions"
4. Click "E-Sign & Complete"
✅ Step 4 marked complete
```

**Expected Results:**
- ✅ Alert: "✅ Onboarding Complete! Proceeding to Dashboard..."
- ✅ Redirects to `tenantdashboard.html`
- ✅ Dashboard loads with welcome message
- ✅ Shows rent, agreement, KYC status cards

---

### Scenario 3: Dashboard Access Control

**Goal:** Verify dashboard is BLOCKED if onboarding incomplete

**Setup:**
1. Assign tenant (from Scenario 1)
2. Tenant logs in and completes ONLY Step 1
3. Try to access `propertyowner/tenantdashboard.html` directly

**Expected Result:**
```
❌ Alert appears:
⚠️ Complete your onboarding first!

✓ Set Password
✓ Fill Profile
✓ Submit KYC
✓ Sign Agreement

🔄 Redirects back to tenantprofile.html
```

**Verification:**
- [ ] Cannot access dashboard with incomplete onboarding
- [ ] Alert shows which steps are missing
- [ ] Redirects to tenantprofile.html to continue

---

### Scenario 4: Owner Tenant Records (Hidden Data)

**Goal:** Verify incomplete tenants are HIDDEN from owner view

**Setup:**
1. Assign tenant BUT DON'T LET THEM COMPLETE onboarding
2. Owner goes to `propertyowner/tenantrec.html`

**Expected Result:**
```
❌ Tenant NOT shown in table

Message displays:
"⏳ Assigned tenants are completing onboarding. 
 Records will appear here after verification."
```

**Verification:**
- [ ] Incomplete tenant hidden from table
- [ ] Message explains why records are empty
- [ ] No tenant details visible

**Now Complete Onboarding:**
1. Tenant completes all 4 steps
2. Owner refreshes `tenantrec.html` (F5)

**Expected Result:**
```
✅ Tenant NOW appears in table
✅ Shows full details:
   - Name, Phone, Email
   - Property / Room
   - Duration
   - Rent Status
   - KYC Status
   - Action buttons
```

---

### Scenario 5: Super Admin Management (Hidden Data)

**Goal:** Verify incomplete tenants hidden from super admin

**Setup:**
1. Assign tenant → Incomplete onboarding
2. Go to `superadmin/tenant.html`

**Expected Result:**
```
❌ Tenant NOT shown in table

Message displays:
"No verified tenants yet. Tenants must complete 
 onboarding before appearing here."
```

**Verification:**
- [ ] Incomplete tenant hidden
- [ ] Table shows placeholder message
- [ ] No tenant data visible

**Now Complete Onboarding:**
1. Tenant completes all 4 steps
2. Super admin refreshes page (F5)

**Expected Result:**
```
✅ Tenant NOW visible in management table
✅ Full tenant record available:
   - Name, Phone, Email
   - Property / Room
   - Payment Status
   - KYC Status
   - Actions (View, Edit)
```

---

## 🧪 Complete Test Checklist

### Onboarding Validation
- [ ] All 4 steps required before dashboard access
- [ ] Cannot skip steps (form validation)
- [ ] Cannot bypass by directly accessing dashboard
- [ ] All fields marked as required
- [ ] Progress indicator shows step completion

### Access Control
- [ ] Tenant dashboard blocked if incomplete
- [ ] Alert shows missing steps
- [ ] Owner records hidden if incomplete
- [ ] Super admin records hidden if incomplete
- [ ] Completed tenants visible in both views

### Data Privacy
- [ ] Profile NOT visible before completion
- [ ] KYC documents NOT visible before completion
- [ ] Agreement status NOT visible before completion
- [ ] Phone/Email NOT visible before completion
- [ ] Only completed tenants shown to owners

### User Messaging
- [ ] Owner sees 4-step timeline after assignment
- [ ] Owner sees message: "Details appear after verification"
- [ ] Tenant sees clear step-by-step onboarding
- [ ] Owner sees: "Completing onboarding..." message
- [ ] Super admin sees: "Must complete first..." message

### localStorage Updates
- [ ] Check browser DevTools → Application → Storage → localStorage
- [ ] After Step 1: `tenant.password` and `tenant.passwordSet` set
- [ ] After Step 2: `tenant.address` and `tenant.dob` set
- [ ] After Step 3: `tenant.kycStatus` = 'submitted'
- [ ] After Step 4: `tenant.agreementSigned` = true
- [ ] Final: `tenant.onboardingCompleted` = true

---

## 🔍 Browser Console Tests

### Check Onboarding Status
```javascript
// In browser console while logged in as tenant
const tenant = JSON.parse(localStorage.getItem('currentTenant'));
console.log({
    password: !!tenant?.password,
    profile: !!(tenant?.address && tenant?.dob),
    kyc: !!tenant?.kycStatus,
    agreement: !!tenant?.agreementSigned,
    onboardingCompleted: !!tenant?.onboardingCompleted
});
```

**Expected Output (when complete):**
```javascript
{
    password: true,
    profile: true,
    kyc: true,
    agreement: true,
    onboardingCompleted: true
}
```

### Force Completion (For Testing)
```javascript
// Add this to complete tenant for testing
const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
const tenant = tenants[0]; // first tenant

tenant.password = 'Test@123';
tenant.address = '123 Main St, Bangalore';
tenant.dob = '1995-05-15';
tenant.kycStatus = 'submitted';
tenant.agreementSigned = true;
tenant.onboardingCompleted = true;

localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
location.reload();
```

### Check Visibility Function
```javascript
// Paste this in console to test visibility logic
function isOnboardingComplete(tenant) {
    if (!tenant) return false;
    const hasPassword = tenant.password !== undefined && tenant.password !== null && tenant.password !== '';
    const hasProfile = tenant.address && tenant.dob;
    const hasKyc = tenant.kycStatus && (tenant.kycStatus === 'submitted' || tenant.kycStatus === 'verified');
    const hasAgreement = tenant.agreementSigned === true;
    return hasPassword && hasProfile && hasKyc && hasAgreement;
}

// Test it
const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
tenants.forEach((t, i) => {
    console.log(`Tenant ${i} (${t.name}): ${isOnboardingComplete(t) ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}`);
});
```

---

## 🐛 Troubleshooting

### Issue: Tenant can access dashboard without completing onboarding
**Fix:** Check `isOnboardingComplete()` logic in tenantdashboard.html
```javascript
// Should be checking ALL 4 conditions
- password !== null
- address && dob
- kycStatus === 'submitted' or 'verified'
- agreementSigned === true
```

### Issue: Owner sees incomplete tenant in records
**Fix:** Check tenantrec.html has verification filter
```javascript
const completedTenants = tenants.filter(t => isOnboardingComplete(t));
// Should filter AND hide incomplete records
```

### Issue: Steps showing incomplete after submission
**Fix:** Check finishOnboarding() is setting all flags
```javascript
tenant.password = newPass;
tenant.address = profileAddr;
tenant.kycStatus = 'submitted';
tenant.agreementSigned = true;
tenant.onboardingCompleted = true;  // Master flag
```

### Issue: localStorage not updating
**Fix:** Check browser console for errors
```javascript
// In DevTools, check:
1. Application > Storage > localStorage > roomhy_tenants
2. Look for 'currentTenant' entry
3. Verify all fields are set after each step
```

---

## 📱 Mobile Testing

### Test on Mobile Devices
1. Assign tenant on mobile
2. Open tenantlogin.html on another phone
3. Complete onboarding on mobile
4. Check dashboard loads correctly
5. Test sidebar navigation on mobile
6. Verify modals appear centered

---

## ✨ Demo Flow (5 minutes)

```
1. (1 min) Assign tenant → Show credentials modal with timeline
2. (1 min) Tenant login → Enters credentials
3. (1 min) Complete 4 steps → Show progress bar
4. (1 min) Dashboard access → Show welcome screen
5. (1 min) Owner records → Show tenant now visible in table
```

---

## 📊 Results Expected

| Test Case | Before Changes | After Changes |
|-----------|---|---|
| Dashboard access | ✅ Anytime | ✅ Only after 4 steps complete |
| Owner sees records | ✅ All tenants | ✅ Only verified tenants |
| Admin sees records | ✅ All tenants | ✅ Only verified tenants |
| Data privacy | ❌ Exposed early | ✅ Hidden until complete |
| Step validation | ❌ Can skip | ✅ All required |
| User clarity | ❌ Vague | ✅ Clear 4-step timeline |

---

**Last Updated:** November 27, 2025
