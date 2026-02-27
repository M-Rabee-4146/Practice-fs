const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user'],
        default: 'user'
    },
    is_verified: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active'
    },
    reset_token: {
        type: String,
        default: null
    },
    reset_expiration: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});


const User = mongoose.model('User', userSchema);

module.exports = User;
