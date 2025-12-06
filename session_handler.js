/**
 * RoomHy Session Manager
 * Handles isolation between Staff, Owners, and Tenants using sessionStorage.
 * Include this file in all Dashboard <head> tags.
 */

(function() {
    // Determine which portal we are on based on URL
    const path = window.location.pathname;
    
    // Define Session Keys
    const KEYS = {
        STAFF: 'roomhy_staff_session',   // For SuperAdmin, AreaManager, Employee
        OWNER: 'roomhy_owner_session',   // For Property Owner
        TENANT: 'roomhy_tenant_session'  // For Tenant
    };

    let currentUser = null;
    let currentKey = null;

    // 1. Identify Portal & Check Session
    if (path.includes('superadmin') || path.includes('Areamanager')) {
        currentKey = KEYS.STAFF;
    } else if (path.includes('propertyowner')) {
        currentKey = KEYS.OWNER;
    } else if (path.includes('tenant') || path.includes('Tenant')) { // Case insensitive check
        currentKey = KEYS.TENANT;
    }

    // 2. Validate Session
    if (currentKey) {
        const sessionData = sessionStorage.getItem(currentKey);
        
        if (!sessionData) {
            console.warn("Session Expired or Invalid. Redirecting...");
            // Redirect to Login if session missing (Adjust path as needed)
            if (path.includes('tenant')) {
                window.location.href = '../tenantlogin.html';
            } else {
                window.location.href = '../index.html'; // Common login for others
            }
            return;
        }
        
        currentUser = JSON.parse(sessionData);
        
        // 3. Temporary Bridge for Legacy Scripts (Only for CURRENT TAB)
        // We override localStorage only for this tab's context to satisfy old scripts
        // without persisting it to other tabs permanently in a way that causes conflict.
        // However, true isolation requires removing localStorage checks from HTML files.
        
        // For now, we allow reading from this 'currentUser' via a helper instead of localStorage.
        window.getCurrentUser = () => currentUser;
    }

})();

/**
 * Call this function to Logout
 */
function globalLogout() {
    // Clear all session keys to be safe
    sessionStorage.removeItem('roomhy_staff_session');
    sessionStorage.removeItem('roomhy_owner_session');
    sessionStorage.removeItem('roomhy_tenant_session');
    
    // Redirect based on current path
    const path = window.location.pathname;
    if(path.includes('tenant')) {
        window.location.href = '../tenantlogin.html';
    } else {
        window.location.href = '../index.html';
    }
}

/**
 * Helper to set session during Login
 */
function setSession(user) {
    let key = '';
    if (['superadmin', 'areamanager', 'employee'].includes(user.role)) {
        key = 'roomhy_staff_session';
    } else if (user.role === 'owner') {
        key = 'roomhy_owner_session';
    } else if (user.role === 'tenant') {
        key = 'roomhy_tenant_session';
    }

    if(key) {
        sessionStorage.setItem(key, JSON.stringify(user));
    }
}