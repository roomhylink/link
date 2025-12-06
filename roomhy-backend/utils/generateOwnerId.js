const User = require('../models/user');

/**
 * Generate a unique owner loginId based on locationCode prefix.
 * Format: <LOC><NN> e.g., KO01, CH05
 */
async function generateOwnerId(locationCode) {
    if (!locationCode) throw new Error('locationCode required');

    // Find existing users whose loginId starts with the locationCode
    const regex = new RegExp(`^${locationCode}(\\d{2,})$`, 'i');
    const last = await User.find({ loginId: { $regex: `^${locationCode}` } })
        .sort({ loginId: -1 })
        .limit(1)
        .lean();

    let nextNum = 1;
    if (last && last.length > 0 && last[0].loginId) {
        const match = last[0].loginId.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const suffix = String(nextNum).padStart(2, '0');
    return `${locationCode}${suffix}`.toUpperCase();
}

module.exports = generateOwnerId;
