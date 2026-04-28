const mongoose = require('mongoose');
require('dotenv').config();

const testDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB. Attempting write...');
        const User = require('./models/User');
        await User.create({ name: 'Test', email: 'test@test.com', phone: '12345', password: 'password' });
        console.log('Write successful');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

testDb();
