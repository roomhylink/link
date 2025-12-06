const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const User = require('./models/user');

async function seedAdmin() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/roomhy';
        await mongoose.connect(mongoUri);
        console.log('Seeder: Mongo connected');

        const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@roomhy.local';
        const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';
        const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

        const existing = await User.findOne({ $or: [{ email: adminEmail }, { role: 'superadmin' }] });
        if (existing) {
            console.log('Seeder: superadmin already exists, skipping creation');
            return;
        }

        const admin = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            phone: adminPhone,
            password: adminPassword,
            role: 'superadmin'
        });
        console.log('Seeder: created superadmin:', adminEmail, 'password:', adminPassword);
    } catch (err) {
        console.error('Seeder error', err);
    }
}

if (require.main === module) {
    seedAdmin();
}

module.exports = seedAdmin;
