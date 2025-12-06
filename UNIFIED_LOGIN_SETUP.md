# RoomHy Unified Login Implementation - Complete Setup

## Overview
Implemented unified login system with auto-detection of user roles based on ID format. No manual role selection required.

## System Architecture

### Login Pages
1. **unifiedlogin.html** - Main unified portal for Super Admin and Area Manager
   - Auto-detects role by input format
   - Email (contain @) → Super Admin
   - MGR... → Area Manager
   - ROOMHY... → Redirect to separate Property Owner login
   - Links to separate tenant and owner login pages

2. **ownerlogin.html** - Separate login for Property Owners
   - ROOMHY... ID format validation
   - Redirects to `propertyowner/admin.html`

3. **tenantlogin.html** - Separate login for Tenants
   - Auto-generated Tenant ID format
   - Redirects to `tenant.html/tenantdashboard.html`

## Database Structure (localStorage)

### 1. Super Admin Database
```javascript
{
  id: 'SUPER_ADMIN',
  email: 'roomhyadmin@gmail.com',
  password: 'admin@123',           // Development password only
  name: 'Super Admin',
  phone: '',
  org: '',
  role: 'superadmin',
  createdAt: timestamp
}
```

### 2. Area Managers Database
```javascript
[]  // Empty array - Area Managers created by Super Admin
// Format when added:
[
  {
    loginId: 'MGRKO001',
    name: 'Manager Name',
    password: 'password',
    role: 'areamanager',
    areaCode: 'KO',
    areaName: 'Koramangala'
  }
]
```

### 3. Property Owners Database
```javascript
{}  // Empty object - Owners created by Super Admin
// Format when added:
{
  'ROOMHYKO001': {
    profile: {
      name: 'Owner Name',
      email: 'owner@email.com',
      phone: '9876543210',
      address: 'Property Address'
    },
    credentials: {
      password: 'password',
      firstTime: false
    },
    kyc: { status: 'pending' },
    properties: []
  }
}
```

### 4. Tenants Database
```javascript
[]  // Empty array - Tenants created by Property Owner
// Format when added:
[
  {
    tenantId: 'auto-generated-id',
    name: 'Tenant Name',
    email: 'tenant@email.com',
    phone: '9876543210',
    propertyId: 'property-reference',
    roomNumber: '101',
    password: 'password',
    firstTime: false
  }
]
```

## Seeder.js

### Initialization
`seeder.js` initializes all databases on page load:
- Creates Super Admin with pre-configured credentials
- Initializes empty databases for managers, owners, tenants, properties, and rooms
- No password setup or profile setup flows required
- All databases are localStorage-based

### Development Credentials
```
Super Admin Email: roomhyadmin@gmail.com
Super Admin Password: admin@123
```

## Session Management

### Session Keys
- `user` - Current logged-in user (all roles)
- `superadmin_user` - Super Admin specific session
- `manager_user` - Area Manager specific session

### Session Validation
Added to all dashboard pages to prevent unauthorized access:

**Super Admin Dashboard** (`superadmin/superadmin.html`)
- Validates: `user.role === 'superadmin'` AND `superadmin_user` exists
- Redirects to `unifiedlogin.html` if not authenticated

**Area Manager Dashboard** (`Areamanager/areaadmin.html`)
- Validates: `user.role === 'areamanager'` AND `manager_user` exists
- Redirects to `unifiedlogin.html` if not authenticated

**Property Owner Dashboard** (`propertyowner/admin.html`)
- Validates: `user.role === 'owner'`
- Redirects to `ownerlogin.html` if not authenticated

## Login Flow

### Super Admin Login
1. User enters email: `roomhyadmin@gmail.com`
2. System detects email format → triggers Super Admin login
3. Validates against `roomhy_superadmin_db`
4. On success:
   - Sets `user` session
   - Sets `superadmin_user` session
   - Redirects to `superadmin/superadmin.html`

### Area Manager Login
1. User enters ID starting with `MGR` (e.g., `MGRKO001`)
2. System detects `MGR` prefix → triggers Area Manager login
3. Validates against `roomhy_areamanagers_db`
4. On success:
   - Sets `user` session
   - Sets `manager_user` session
   - Redirects to `Areamanager/areaadmin.html`

### Property Owner Login
1. User navigates to `ownerlogin.html`
2. Enters ID starting with `ROOMHY` (e.g., `ROOMHYKO001`)
3. System validates against `roomhy_owners_db`
4. On success:
   - Sets `user` session
   - Redirects to `propertyowner/admin.html`

### Tenant Login
1. User navigates to `tenantlogin.html`
2. Enters Tenant ID and password
3. System validates against `roomhy_tenants` array
4. On success:
   - Sets `user` session
   - Redirects to `tenant.html/tenantdashboard.html`

## User Creation Workflow

### Super Admin
- Pre-created in seeder with email and password
- No setup flows required
- Can login immediately on first load

### Area Managers
- Created by Super Admin through admin panel
- ID format: `MGR` + area code + sequence number (e.g., `MGRKO001`)
- Password set by Super Admin
- Can login after creation

### Property Owners
- Created by Super Admin through admin panel
- ID format: `ROOMHY` + location code + sequence number (e.g., `ROOMHYKO001`)
- Password set by Super Admin
- Can login after creation
- Can create tenants through their dashboard

### Tenants
- Created by Property Owner through their dashboard
- ID format: Auto-generated
- Password set by Property Owner
- Can login after creation

## Usage Instructions

### First Setup
1. Open `index.html` in browser (loads seeder)
2. Or manually run `window.initializeSeeder()` in console

### Login
- **Super Admin**: Go to `unifiedlogin.html`, enter `roomhyadmin@gmail.com` and `admin@123`
- **Area Manager**: Go to `unifiedlogin.html`, enter manager ID (e.g., `MGRKO001`) and password
- **Property Owner**: Go to `ownerlogin.html`, enter owner ID (e.g., `ROOMHYKO001`) and password
- **Tenant**: Go to `tenantlogin.html`, enter tenant ID and password

## Files Modified/Created

### Created
- `seeder.js` - Database initialization
- `unifiedlogin.html` - Unified login with auto-detection
- `ownerlogin.html` - Property Owner separate login
- `tenantlogin.html` - Tenant separate login

### Modified
- `superadmin/superadmin.html` - Added session validation
- `Areamanager/areaadmin.html` - Added session validation
- `propertyowner/admin.html` - Added session validation

## Security Notes (Development)

⚠️ **IMPORTANT**: This is a development/demo setup using localStorage. In production:
- Use secure backend authentication (JWT, OAuth2, etc.)
- Never store passwords in localStorage
- Implement proper session management
- Use HTTPS only
- Add CSRF protection
- Implement rate limiting on login attempts
