const mongoose = require('mongoose');


const donorSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: true
    },
    bloodGroup: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    authorize: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

module.exports = mongoose.model('Donor', donorSchema);
