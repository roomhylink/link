# 🏗️ Unified Login - System Architecture

## Authentication & Role Detection System

```
┌─────────────────────────────────────────────────────────────┐
│                    ROOMHY PORTAL ENTRY                      │
│                  (unifiedlogin.html)                        │
├─────────────────────────────────────────────────────────────┤
│                   Role Auto-Detection                       │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │ Email @      │  MGR...      │  ROOMHY... / Other   │   │
│  │ Super Admin  │ Area Manager │  Shows separate      │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓              ↓                  ↓
    ┌────────┐   ┌──────────┐      ┌──────────────┐
    │  Admin │   │  Manager │      │    Owner     │
    │ Login  │   │  Login   │      │    Login     │
    │        │   │          │      │              │
    └───────┬┘   └────┬─────┘      └────────┬─────┘
            │         │                     │
            └─────────┼─────────────────────┘
                      ↓
            ┌─────────────────────────┐
            │   Session Validation    │
            │  (Check user role &     │
            │   session keys)         │
            └─────────┬───────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │  Admin  │  │ Manager  │  │  Owner   │
   │ Panel   │  │  Panel   │  │  Panel   │
   └─────────┘  └──────────┘  └──────────┘
```

---

## Database Structure (localStorage)

```
LOCAL STORAGE DATABASES
├── roomhy_superadmin_db
│   {
│     id: 'SUPER_ADMIN',
│     email: 'roomhyadmin@gmail.com',
│     password: 'admin@123',
│     name: 'Super Admin',
│     phone: '',
│     org: '',
│     role: 'superadmin'
│   }
│
├── roomhy_areamanagers_db (Array - Empty Initially)
│   [
│     {
│       loginId: 'MGRKO001',
│       name: 'Manager Name',
│       password: 'set_by_admin',
│       role: 'areamanager',
│       areaCode: 'KO',
│       areaName: 'Koramangala'
│     }
│   ]
│
├── roomhy_owners_db (Object - Empty Initially)
│   {
│     'ROOMHYKO001': {
│       profile: {
│         name: 'Owner Name',
│         email: 'owner@email.com',
│         phone: '9876543210',
│         address: 'Property Address'
│       },
│       credentials: {
│         password: 'set_by_admin',
│         firstTime: false
│       },
│       kyc: { status: 'pending' },
│       properties: []
│     }
│   }
│
├── roomhy_tenants (Array - Empty Initially)
│   [
│     {
│       tenantId: 'auto-generated-id',
│       name: 'Tenant Name',
│       email: 'tenant@email.com',
│       phone: '9876543210',
│       propertyId: 'property-ref',
│       roomNumber: '101',
│       password: 'set_by_owner',
│       firstTime: false,
│       role: 'tenant'
│     }
│   ]
│
├── roomhy_properties (Array)
├── roomhy_rooms (Array)
│
└── SESSION KEYS (Set on Login):
    ├── user: { loginId, role, name, email, ... } (All roles)
    ├── superadmin_user: { same as user } (Super Admin only)
    └── manager_user: { same as user } (Area Manager only)
```

---

## User Creation Hierarchy

```
SUPER ADMIN (Pre-created in Seeder)
│   Email: roomhyadmin@gmail.com
│   Password: admin@123
│   Status: Ready to login immediately
│
├─→ CREATES AREA MANAGERS
│   Format: MGRKO001
│   Status: Can login after creation by admin
│   Properties: Own dashboard & features
│
├─→ CREATES PROPERTY OWNERS
│   Format: ROOMHYKO001
│   Status: Can login after creation by admin
│   Properties:
│   ├── Own dashboard
│   ├── Can create tenants
│   ├── Manage properties & rooms
│   └── Handle tenant records
│
└─→ CREATES OTHER RESOURCES
    ├── Properties
    ├── Rooms
    ├── Area configs
    └── System settings
```

---

## Login Flow Diagram

### Path 1: Super Admin
```
User visits unifiedlogin.html
    ↓
Enters: roomhyadmin@gmail.com + admin@123
    ↓
System detects: Contains '@' symbol
    ↓
Route to: loginSuperAdmin()
    ↓
Validate against: roomhy_superadmin_db
    ↓ ✓ Match found
Set localStorage:
  - user = { id, email, role, name... }
  - superadmin_user = { same object }
    ↓
Redirect to: superadmin/superadmin.html
    ↓
Dashboard calls: checkSession()
    ↓ Validates
  ✓ user exists & role === 'superadmin'
  ✓ superadmin_user exists
    ↓
Dashboard loads successfully
```

### Path 2: Area Manager
```
User visits unifiedlogin.html
    ↓
Enters: MGRKO001 + password
    ↓
System detects: Starts with 'MGR'
    ↓
Route to: loginAreaManager()
    ↓
Validate against: roomhy_areamanagers_db
    ↓ ✓ Match found
Set localStorage:
  - user = { loginId, role, name... }
  - manager_user = { same object }
    ↓
Redirect to: Areamanager/areaadmin.html
    ↓
Dashboard calls: checkSession()
    ↓ Validates
  ✓ user exists & role === 'areamanager'
  ✓ manager_user exists
    ↓
Dashboard loads successfully
```

### Path 3: Property Owner
```
User visits ownerlogin.html
    ↓
Enters: ROOMHYKO001 + password
    ↓
System validates: Format ROOMHY...
    ↓
Search in: roomhy_owners_db[ownerId]
    ↓ ✓ Found
Validate password: Match credentials.password
    ↓ ✓ Match
Set localStorage:
  - user = { loginId, role, name... }
    ↓
Redirect to: propertyowner/admin.html
    ↓
Dashboard calls: checkSession()
    ↓ Validates
  ✓ user exists & role === 'owner'
    ↓
Dashboard loads successfully
```

### Path 4: Tenant
```
User visits tenantlogin.html
    ↓
Enters: tenantId + password
    ↓
Search in: roomhy_tenants array
    ↓ ✓ Found
Validate password: Match password
    ↓ ✓ Match
Set localStorage:
  - user = { tenantId, role, name... }
    ↓
Redirect to: tenant.html/tenantdashboard.html
    ↓
Dashboard calls: checkSession()
    ↓ Validates
  ✓ user exists & role === 'tenant'
    ↓
Dashboard loads successfully
```

---

## Session Validation Flow

```
Page Load Event
    ↓
Execute: document.addEventListener('DOMContentLoaded', checkSession)
    ↓
Inside checkSession():
    ├─ Read: localStorage['user']
    ├─ Read: localStorage['superadmin_user'] OR 'manager_user' (role-specific)
    ├─ Check: user exists?
    │  ├─ No → Show alert, redirect to login
    │  └─ Yes → Continue
    ├─ Check: user.role === expected role?
    │  ├─ No → Show alert, redirect to login
    │  └─ Yes → Continue
    ├─ Check: Role-specific key exists? (if applicable)
    │  ├─ Super Admin: superadmin_user must exist
    │  ├─ Area Manager: manager_user must exist
    │  ├─ Property Owner: (only user needed)
    │  ├─ Tenant: (only user needed)
    │  ├─ No → Show alert, redirect to login
    │  └─ Yes → Continue
    └─ ✓ All checks passed → Allow dashboard access
```

---

## ID Format Reference

```
┌─────────────────┬──────────────────────────┬─────────────────────┐
│ User Type       │ ID Format                │ Example             │
├─────────────────┼──────────────────────────┼─────────────────────┤
│ Super Admin     │ Email (contains @)       │ roomhyadmin@gmail.. │
│ Area Manager    │ MGR + LocationCode + Seq │ MGRKO001            │
│ Property Owner  │ ROOMHY + Location + Seq  │ ROOMHYKO001         │
│ Tenant          │ Auto-Generated           │ TNT-KO-001 (varies) │
└─────────────────┴──────────────────────────┴─────────────────────┘
```

---

## File Structure

```
hostel/
├── LOGIN PAGES
│   ├── unifiedlogin.html ← Main (Super Admin + Area Manager)
│   ├── ownerlogin.html ← Separate (Property Owner)
│   └── tenantlogin.html ← Separate (Tenant)
│
├── SEEDER
│   └── seeder.js ← Initializes databases
│
├── DASHBOARDS (with checkSession)
│   ├── superadmin/superadmin.html ← Super Admin dashboard
│   ├── Areamanager/areaadmin.html ← Area Manager dashboard
│   ├── propertyowner/admin.html ← Property Owner dashboard
│   └── tenant.html/tenantdashboard.html ← Tenant dashboard
│
└── DOCUMENTATION
    ├── UNIFIED_LOGIN_SETUP.md
    ├── LOGIN_TEST_GUIDE.md
    ├── UNIFIED_LOGIN_COMPLETE.md
    └── LOGIN_ARCHITECTURE.md (this file)
```

---

## Session Lifecycle

```
BEFORE LOGIN
├── user = null
├── superadmin_user = null
├── manager_user = null
└── Dashboard redirects to login

LOGIN PROCESS
├── Validate credentials
├── Set localStorage['user'] = userObject
├── Set role-specific key if needed
└── Redirect to dashboard

AFTER LOGIN
├── user = { loginId, role, name, ... }
├── superadmin_user OR manager_user = { same }
└── Dashboard loads successfully

ON PAGE REFRESH
├── checkSession() runs automatically
├── Validates session keys exist
├── Validates role matches
└── Dashboard reloads if valid

MANUAL LOGOUT (if implemented)
├── Clear localStorage['user']
├── Clear role-specific keys
├── Redirect to login page

ON BROWSER CLOSE
├── localStorage PERSISTS (doesn't clear)
├── On reopen, session still valid
├── Need manual logout to clear session
```

---

## Error Handling

```
LOGIN ERROR
├── If: Credentials don't match
│   └── Show: "Invalid ID/Password"
│
├── If: User doesn't exist
│   └── Show: "User not found"
│
└── If: Database not initialized
    └── Show: "System not initialized"

SESSION ERROR
├── If: No session found
│   └── Redirect to login
│
├── If: Role doesn't match
│   └── Show alert & redirect
│
└── If: Trying to access wrong dashboard
    └── Redirect to appropriate login
```

---

## Security Considerations (Development)

⚠️ **DEVELOPMENT MODE - NOT FOR PRODUCTION**

```
Current Implementation:
├── Passwords stored in plain text
├── Uses browser localStorage (not secure)
├── No encryption
├── No HTTPS required
├── No rate limiting
└── Session persists indefinitely

For Production, Add:
├── Backend authentication (JWT/OAuth2)
├── Secure password hashing (bcrypt)
├── HTTPS only
├── Secure session tokens
├── Rate limiting on login
├── Session timeout
├── CSRF protection
├── SQL injection prevention
└── Proper database (not localStorage)
```

---

## Testing Checklist

```
✓ Super Admin login with email works
✓ Area Manager login with MGR... works
✓ Property Owner login with ROOMHY... works
✓ Tenant login with auto-generated ID works
✓ Auto-detection routes correctly
✓ Session validation on all dashboards
✓ Unauthorized access redirects to login
✓ Browser refresh maintains session
✓ Role-specific data displays correctly
✓ Cannot access wrong role's dashboard
✓ Logout clears session
✓ Error messages display properly
```

---

**Status**: ✅ Complete and Documented
