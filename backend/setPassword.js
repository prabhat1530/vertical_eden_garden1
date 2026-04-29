const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const setPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'pk15sk30@gmail.com' });
        
        if (user) {
            user.password = 'pra123456'; // Setting a direct password
            await user.save();
            console.log('Success! Password for pk15sk30@gmail.com has been set to: pra123456');
        } else {
            console.log('Could not find user with that email.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

setPassword();
