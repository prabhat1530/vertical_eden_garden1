const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Update the user with phone 7033721604
        const result = await User.updateMany(
            { phone: { $in: ['7033721604', '+917033721604'] } },
            { $set: { role: 'admin' } }
        );
        
        // Also update the email pk15sk30@gmail.com just in case
        const result2 = await User.updateMany(
            { email: 'pk15sk30@gmail.com' },
            { $set: { role: 'admin' } }
        );

        console.log(`Updated ${result.modifiedCount + result2.modifiedCount} user(s) to admin!`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
