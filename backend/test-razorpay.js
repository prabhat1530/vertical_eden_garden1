const Razorpay = require('razorpay');
require('dotenv').config();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

instance.orders.create({
  amount: 50000,
  currency: "INR",
  receipt: "receipt#1",
  notes: {
    key1: "value3",
    key2: "value2"
  }
}).then(console.log).catch(console.error);
