const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  questionKey: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    enum: ['equals', 'notEquals', 'contains'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

const conditionalRulesSchema = new mongoose.Schema({
  logic: {
    type: String,
    enum: ['AND', 'OR'],
    required: true
  },
  conditions: [conditionSchema]
});

const questionSchema = new mongoose.Schema({
  questionKey: {
    type: String,
    required: true
  },
  airtableFieldId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelect', 'multipleAttachments'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String
  }],
  conditionalRules: {
    type: conditionalRulesSchema,
    default: null
  }
});

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  airtableBaseId: {
    type: String,
    required: true
  },
  airtableTableId: {
    type: String,
    required: true
  },
  airtableTableName: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  isPublished: {
    type: Boolean,
    default: true
  },
  responseCount: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('FormNew', formSchema);
