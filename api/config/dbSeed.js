const User = require('../models/user');

async function seedAdmin() {
    try {
        const adminExists = await User.findOne({ email: 'admin@email.com' });
        
        if (!adminExists) {
            const admin = new User({
                name: "Francisco Castro",
                username: "ciscozin",
                birthdate: new Date('2004-03-11'),
                email: "admin@email.com",
                password: "admin123",
                role: "admin"
            });

            await admin.save();
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
}

module.exports = { seedAdmin };