const Tenant = require('../models/Tenant');

/**
 * Generate a unique tenant loginId based on locationCode prefix.
 * Format: TNT-<LOC>-NNN e.g., TNT-KO-001, TNT-CH-012
 */
async function generateTenantId(locationCode) {
    if (!locationCode) throw new Error('locationCode required');

    // Find existing tenants whose loginId starts with TNT-<LOC>
    const prefix = `TNT-${locationCode.toUpperCase()}-`;
    const last = await Tenant.find({ loginId: { $regex: `^${prefix}` } })
        .sort({ loginId: -1 })
        .limit(1)
        .lean();

    let nextNum = 1;
    if (last && last.length > 0 && last[0].loginId) {
        const match = last[0].loginId.match(/(\d{3,})$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const suffix = String(nextNum).padStart(3, '0');
    return `${prefix}${suffix}`.toUpperCase();
}

module.exports = generateTenantId;
