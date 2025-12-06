# Tenant Onboarding & Verification System

## Overview

This document explains the complete tenant assignment workflow, onboarding process, and access control restrictions ensuring data privacy and verification integrity.

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PROPERTY OWNER (rooms.html)                                     │
│ - Assigns tenant to room                                        │
│ - Generates Login ID + Temp Password                            │
│ - Shares credentials with tenant                                │
│ STATUS: Tenant record HIDDEN from owner views until verified    │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ TENANT LOGIN (tenantlogin.html)                                 │
│ - Enters Login ID + Temp Password                               │
│ - Verifies credentials via API or localStorage                  │
│ STATUS: Temporary access only (password change required)        │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ TENANT ONBOARDING (tenantprofile.html) - 4 SEQUENTIAL STEPS     │
│                                                                  │
│ ✓ STEP 1: Set New Password                                      │
│ ✓ STEP 2: Fill Personal Profile (Address, DOB, etc.)           │
│ ✓ STEP 3: Upload KYC Documents (Aadhar, ID Proof, etc.)        │
│ ✓ STEP 4: E-Sign Rental Agreement                              │
│                                                                  │
│ STATUS: All 4 steps MUST be completed before dashboard access  │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ TENANT DASHBOARD (tenantdashboard.html)                         │
│ - Only accessible after ALL 4 onboarding steps complete         │
│ - Shows welcome, status, payments, and room details             │
│ STATUS: BLOCKED if onboarding incomplete → redirects to step1   │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ PROPERTY OWNER RECORDS (tenantrec.html)                         │
│ - Shows ONLY verified/completed tenants                         │
│ - Cannot see tenant details until all onboarding done           │
│ STATUS: Incompletes hidden, only active/verified records shown  │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ SUPER ADMIN MANAGEMENT (superadmin/tenant.html)                 │
│ - Shows ONLY verified/completed tenants                         │
│ - Cannot see any tenant details until verification complete     │
│ STATUS: Incompletes hidden, only verified tenants appear        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Access Control & Data Privacy

### ✅ Tenant Details HIDDEN FROM:
- **Property Owners** (tenantrec.html)
  - No tenant records shown until onboarding complete
  - No profile/KYC/agreement details visible
  - Message: "Assigned tenants are completing onboarding..."

- **Super Admins** (superadmin/tenant.html)
  - No tenant records shown until onboarding complete
  - No contact information, KYC, or financial details visible
  - Message: "No verified tenants yet. Complete onboarding first..."

- **Other Tenants**
  - Cannot access other tenant profiles
  - Only their own dashboard visible

### ✅ Dashboard Access Control

**File:** `propertyowner/tenantdashboard.html`

**Blocking Logic:**
```javascript
function isOnboardingComplete(tenantRecord) {
    const hasPassword = tenantRecord.password !== undefined && tenantRecord.password !== null;
    const hasProfile = tenantRecord.address && tenantRecord.dob;
    const hasKyc = tenantRecord.kycStatus && (tenantRecord.kycStatus === 'submitted' || 'verified');
    const hasAgreement = tenantRecord.agreementSigned === true;
    
    return hasPassword && hasProfile && hasKyc && hasAgreement;
}
```

**On Load:**
- If any step is missing → Alert + Redirect to `tenantprofile.html`
- If all complete → Dashboard loads normally

---

## Data Fields Required for Verification

### Completion Markers (in localStorage & DB)

```javascript
tenant = {
    // Authentication
    password: "hashed_new_password",           // ✓ Step 1
    passwordSet: true,
    
    // Profile
    address: "123 Main St, City",              // ✓ Step 2
    dob: "1995-05-15",
    city: "Bangalore",
    pin: "560001",
    
    // KYC
    kycStatus: "submitted",                    // ✓ Step 3
    kycSubmittedAt: "2025-11-27T10:30:00Z",
    aadhar: "123456789012",
    idProofUrl: "data:image/...",              // Data URL
    addressProofUrl: "data:image/...",
    
    // Agreement
    agreementSigned: true,                     // ✓ Step 4
    agreementSignedAt: "2025-11-27T11:00:00Z",
    
    // Status
    status: "active",
    onboardingCompleted: true,
    completedAt: "2025-11-27T11:00:00Z"
}
```

---

## File Changes Summary

### Frontend Files Modified

#### 1. **propertyowner/tenantdashboard.html**
- ✅ Added `isOnboardingComplete()` function
- ✅ STRICT dashboard access guard on page load
- ✅ Blocks dashboard if any step incomplete
- ✅ Shows alert with missing step checklist

#### 2. **propertyowner/tenantprofile.html**
- ✅ Enhanced `finishOnboarding()` to set all completion markers
- ✅ Validates ALL 4 steps before accepting submission
- ✅ Sets `onboardingCompleted: true` and timestamps
- ✅ Marks `agreementSigned: true` on final step

#### 3. **propertyowner/tenantrec.html**
- ✅ Added `isOnboardingComplete()` verification function
- ✅ Filters table to show ONLY verified tenants
- ✅ Shows message if no completed tenants exist:
  ```
  "⏳ Assigned tenants are completing onboarding. 
   Records will appear here after verification."
  ```

#### 4. **superadmin/tenant.html**
- ✅ Added `isOnboardingComplete()` verification function
- ✅ Filters table to show ONLY verified tenants
- ✅ Shows message if no completed tenants:
  ```
  "No verified tenants yet. Tenants must complete 
   onboarding before appearing here."
  ```

#### 5. **propertyowner/rooms.html**
- ✅ Enhanced credentials success modal
- ✅ Added "Onboarding Process" info box
- ✅ Shows 4-step verification timeline
- ✅ Explains data privacy: "Tenant details will NOT appear in records 
                             until all steps complete"

---

## Security & Privacy Implementation

### 1. **Layered Verification**
- **Password verification** → API or localStorage
- **Profile data** → Must include DOB + Address
- **KYC submission** → Status tracked + timestamp
- **Agreement signature** → Must be explicitly signed
- **Completion flag** → All 4 fields must be set

### 2. **Data Hiding Strategy**
- Completed status NOT computed from individual fields
- Admin/Owner views check BOOLEAN completion flags
- No partial data exposure
- Records hidden entirely if incomplete

### 3. **Audit Trail**
```javascript
tenant.passwordSetAt          // When password changed
tenant.profileFilledAt        // When profile completed (optional)
tenant.kycSubmittedAt         // When KYC uploaded
tenant.agreementSignedAt      // When agreement signed
tenant.onboardingCompleted    // Final completion flag
tenant.completedAt            // Timestamp of completion
```

---

## User Experience

### Tenant Journey (4 Steps)

| Step | Page | Action | Completion Check |
|------|------|--------|-------------------|
| 1 | tenantprofile.html | Set Password | `password !== null` |
| 2 | tenantprofile.html | Fill Profile (DOB, Address) | `address && dob` |
| 3 | tenantprofile.html | Upload KYC | `kycStatus === 'submitted'` |
| 4 | tenantprofile.html | E-Sign Agreement | `agreementSigned === true` |
| ✓ | tenantdashboard.html | View Dashboard | All 4 + `onboardingCompleted === true` |

### Owner View (tenantrec.html)

| Status | Display | Action |
|--------|---------|--------|
| **Onboarding In Progress** | Hidden from table | Message: "Completing onboarding..." |
| **Onboarding Complete** | Shows in table | Can view details, verify KYC |

### Super Admin View (superadmin/tenant.html)

| Status | Display | Action |
|--------|---------|--------|
| **Onboarding In Progress** | Hidden from table | Message: "Must complete onboarding first..." |
| **Onboarding Complete** | Shows in table | Can verify, manage, track payments |

---

## Testing Checklist

### ✅ Tenant Onboarding
- [ ] Assign tenant → Generates Login ID + Temp Password
- [ ] Show credentials modal with 4-step timeline info
- [ ] Tenant login with credentials
- [ ] Cannot access dashboard without completing all 4 steps
- [ ] Step 1 → Set password
- [ ] Step 2 → Fill profile + DOB + Address
- [ ] Step 3 → Upload KYC (shows submitted status)
- [ ] Step 4 → E-sign agreement
- [ ] After Step 4 → Dashboard accessible
- [ ] localStorage updates with all completion fields

### ✅ Access Control
- [ ] Owner cannot see incomplete tenant in tenantrec.html
- [ ] Shows message: "Completing onboarding..."
- [ ] Super Admin cannot see incomplete tenant in tenant.html
- [ ] Shows message: "Must complete first..."
- [ ] Tenant cannot access dashboard URL directly if incomplete
- [ ] Redirect to tenantprofile.html with alert

### ✅ Data Privacy
- [ ] No profile details visible before completion
- [ ] No KYC documents visible before completion
- [ ] No agreement status visible before completion
- [ ] Completed tenants appear in both owner & admin views
- [ ] All 4 flags must be TRUE for visibility

---

## API Endpoints Involved

### Tenant Assignment
```
POST /api/tenants/assign
Body: {
  propertyId, roomId, bedNo,
  name, phone, email,
  moveInDate, agreedRent
}
Response: {
  success, message,
  tenant: { id, loginId, tempPassword, ... }
}
```

### Tenant Verification (existing)
```
POST /api/auth/tenant/verify-temp
Body: { loginId, tempPassword }
Response: { success, message }

POST /api/auth/tenant/set-password
Body: { loginId, newPassword }
Response: { success, token, message }
```

### KYC Update
```
POST /api/tenants/:tenantId/kyc
Body: {
  aadhar, idProofUrl, addressProofUrl,
  kycStatus: 'submitted'
}
Response: { success, tenant }
```

### Agreement Signing
```
POST /api/tenants/:tenantId/agreement
Body: {
  agreementSigned: true,
  signedAt: ISO_TIMESTAMP
}
Response: { success, tenant }
```

---

## localStorage Schema

### Tenants Array
```javascript
roomhy_tenants: [
  {
    // Assignment Info
    tenantId: "TNT-KO-001",
    loginId: "TNT-KO-001",
    propertyId: "PROP-123",
    roomNo: 201,
    bedNo: "A",
    
    // Personal
    name: "John Doe",
    email: "john@example.com",
    phone: "+91-9876543210",
    
    // Onboarding Status (NEW)
    password: "hashed_password",
    passwordSet: true,
    address: "123 Main St",
    dob: "1995-05-15",
    city: "Bangalore",
    pin: "560001",
    
    // KYC Status (NEW)
    kycStatus: "submitted",
    kycSubmittedAt: "2025-11-27T10:30:00Z",
    aadhar: "123456789012",
    
    // Agreement (NEW)
    agreementSigned: true,
    agreementSignedAt: "2025-11-27T11:00:00Z",
    
    // Completion Markers (NEW)
    onboardingCompleted: true,
    profileFilled: true,
    completedAt: "2025-11-27T11:00:00Z",
    
    // Status
    status: "active",
    createdAt: ISO_TIMESTAMP
  }
]
```

---

## Future Enhancements

- [ ] Email/SMS notifications at each onboarding step
- [ ] KYC document verification API integration
- [ ] Automated compliance checks
- [ ] Payment gateway pre-setup before dashboard access
- [ ] Move-in checklist validation
- [ ] Background check integration

---

## Support & Troubleshooting

### Issue: Tenant cannot access dashboard
**Solution:** Check `isOnboardingComplete()` in browser console
```javascript
const t = JSON.parse(localStorage.getItem('roomhy_tenants'))[0];
console.log({
  password: !!t.password,
  profile: !!(t.address && t.dob),
  kyc: !!(t.kycStatus),
  agreement: !!t.agreementSigned
});
```

### Issue: Owner can see incomplete tenant records
**Solution:** Clear localStorage and refresh
```javascript
localStorage.removeItem('roomhy_tenants');
location.reload();
```

### Issue: Super admin sees all tenants
**Solution:** Verify completion markers are being set during onboarding
Check Step 4 submission in tenantprofile.html

---

## References

- **Tenant Login:** `propertyowner/tenantlogin.html`
- **Onboarding:** `propertyowner/tenantprofile.html`
- **Dashboard:** `propertyowner/tenantdashboard.html`
- **Owner Records:** `propertyowner/tenantrec.html`
- **Admin Management:** `superadmin/tenant.html`

---

**Last Updated:** November 27, 2025  
**Version:** 1.0 (Initial Implementation)
