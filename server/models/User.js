const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        otp: { type: String },
        sendTime: { type: Number },
        token: { type: String }
    }
}, { timestamps: true });


const User = mongoose.model('User', userSchema);
module.exports = User;
