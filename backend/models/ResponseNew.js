const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormNew',
    required: true
  },
  airtableRecordId: {
    type: String,
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'synced', 'error'],
    default: 'submitted'
  },
  deletedInAirtable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

responseSchema.index({ formId: 1, createdAt: -1 });
responseSchema.index({ airtableRecordId: 1 });

module.exports = mongoose.model('ResponseNew', responseSchema);
