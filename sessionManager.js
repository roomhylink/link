/**
 * Session Manager - Handles user session persistence and timeout
 * Keeps users logged in for extended periods
 */

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_KEY = 'roomhy_session_timestamp';
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

/**
 * Initialize session tracking
 * Call this on dashboard page load
 */
function initializeSessionTracking() {
    // Update session timestamp on page load
    updateSessionTimestamp();
    
    // Track user activity
    document.addEventListener('mousemove', updateSessionTimestamp);
    document.addEventListener('keypress', updateSessionTimestamp);
    document.addEventListener('click', updateSessionTimestamp);
    document.addEventListener('scroll', updateSessionTimestamp);
    
    // Check session periodically
    setInterval(validateSession, 60000); // Check every 1 minute
}

/**
 * Update session timestamp on user activity
 */
function updateSessionTimestamp() {
    const now = Date.now();
    localStorage.setItem(SESSION_KEY, now.toString());
}

/**
 * Validate if session is still valid
 */
function validateSession() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        return false; // Not logged in
    }
    
    const lastActivity = parseInt(localStorage.getItem(SESSION_KEY) || '0');
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    
    // If no activity for 30 minutes, warn user
    if (timeSinceActivity > ACTIVITY_TIMEOUT) {
        console.warn('Session inactive for 30 minutes');
        // Optional: Show warning but don't logout
        // showSessionWarning();
    }
    
    return true;
}

/**
 * Check if user has valid session and redirect if not
 * Pass role as parameter: 'superadmin', 'areamanager', 'owner', 'tenant'
 */
function checkSessionWithRole(requiredRole) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        alert('Session expired. Please login again.');
        window.location.href = '../unifiedlogin.html';
        return false;
    }
    
    if (user.role !== requiredRole) {
        alert('Unauthorized access. Please login with correct role.');
        window.location.href = '../unifiedlogin.html';
        return false;
    }
    
    // Session is valid
    initializeSessionTracking();
    return true;
}

/**
 * Check if Super Admin session is valid
 */
function checkSuperAdminSession() {
    // Prefer sessionStorage (per-tab), fallback to localStorage, then check again after small delay (Render fix)
    let user = JSON.parse(
        sessionStorage.getItem('user') ||
        localStorage.getItem('user') ||
        'null'
    );
    
    // If still not found on Render, wait and check again (sometimes localStorage takes time to load)
    if (!user || user.role !== 'superadmin') {
        setTimeout(() => {
            user = JSON.parse(
                sessionStorage.getItem('user') ||
                localStorage.getItem('user') ||
                'null'
            );
            if (!user || user.role !== 'superadmin') {
                alert('Please login as Super Admin first.');
                window.location.href = '../index.html';
            }
        }, 100);
        return false;
    }
    
    initializeSessionTracking();
    return true;
}

/**
 * Check if Area Manager session is valid
 */
function checkAreaManagerSession() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const managerUser = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
    
    if (!user || !managerUser || user.role !== 'areamanager') {
        alert('Please login as Area Manager first.');
        window.location.href = '../../unifiedlogin.html';
        return false;
    }
    
    initializeSessionTracking();
    return true;
}

/**
 * Check if Owner session is valid
 */
function checkOwnerSession() {
    const owner = getCurrentOwner();
    
    if (!owner) {
        alert('Please login as Property Owner first.');
        window.location.href = '../unifiedlogin.html';
        return false;
    }
    
    initializeSessionTracking();
    return true;
}

/**
 * Get the current owner session (prefers per-tab sessionStorage)
 * Returns parsed owner object or null
 */
function getCurrentOwner() {
    try {
        const ownerSession = JSON.parse(sessionStorage.getItem('owner_session') || 'null');
        const sessionUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');
        const candidate = ownerSession || sessionUser || localUser || null;
        if (candidate && candidate.role === 'owner') return candidate;
    } catch (err) {
        console.warn('getCurrentOwner parse error', err);
    }
    return null;
}

/**
 * Check if Tenant session is valid
 */
function checkTenantSession() {
    const user = JSON.parse(localStorage.getItem('tenant_user') || 'null');
    
    if (!user || user.role !== 'tenant') {
        alert('Please login as Tenant first.');
        window.location.href = '../tenantlogin.html';
        return false;
    }
    
    initializeSessionTracking();
    return true;
}

/**
 * Logout and clear session
 */
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('superadmin_user');
    localStorage.removeItem('manager_user');
    localStorage.removeItem('tenant_user');
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '../unifiedlogin.html';
}

/**
 * Extend session (refresh timestamp)
 */
function extendSession() {
    updateSessionTimestamp();
    console.log('Session extended');
}
