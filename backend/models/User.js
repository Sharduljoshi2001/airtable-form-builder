const mongoose = require('mongoose');

// User schema - Yahan define karte hain ki user ka data kaise store hoga
const userSchema = new mongoose.Schema({
  // Airtable se aane wala unique user ID
  airtableUserId: {
    type: String,
    required: true,
    unique: true // Duplicate users nahi honge
  },
  
  // User ki basic info
  email: {
    type: String,
    required: true,
    lowercase: true // Email lowercase mein store karenge
  },
  
  name: {
    type: String,
    required: true
  },
  
  // OAuth tokens - Ye Airtable API access ke liye zaroori hain
  accessToken: {
    type: String,
    required: true
  },
  
  refreshToken: {
    type: String,
    required: false // Kabhi kabhi nahi milta
  },
  
  // Token ka expiry time
  tokenExpiresAt: {
    type: Date,
    required: false
  },
  
  // User ke Airtable bases - Baad mein store karenge
  airtableBases: [{
    baseId: String,
    baseName: String,
    lastSyncAt: Date
  }],
  
  // Timestamps - Automatic add ho jayenge
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update time automatically set karne ka middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// User model export karo
const User = mongoose.model('User', userSchema);

module.exports = User;
