const express = require('express');
const axios = require('axios');
const Form = require('../models/FormNew');
const Response = require('../models/ResponseNew');
const { validateConditionalRules } = require('../utils/conditionalLogic');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const forms = await Form.find()
      .select('title description createdAt updatedAt responseCount isPublished')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      forms: forms
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch forms',
      details: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, airtableBaseId, airtableTableId, airtableTableName, questions } = req.body;
    
    if (!title || !airtableBaseId || !airtableTableId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: 'Missing required fields: title, airtableBaseId, airtableTableId, questions'
      });
    }
    
    for (const question of questions) {
      if (!question.questionKey || !question.airtableFieldId || !question.label || !question.type) {
        return res.status(400).json({
          error: 'Invalid question format. Each question must have: questionKey, airtableFieldId, label, type'
        });
      }
      
      if (question.conditionalRules && !validateConditionalRules(question.conditionalRules)) {
        return res.status(400).json({
          error: `Invalid conditional rules for question: ${question.questionKey}`
        });
      }
    }
    
    const newForm = new Form({
      title,
      description: description || '',
      airtableBaseId,
      airtableTableId,
      airtableTableName: airtableTableName || 'Table',
      questions
    });
    
    const savedForm = await newForm.save();
    
    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      form: savedForm
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create form',
      details: error.message
    });
  }
});

router.get('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await Form.findById(formId);
    
    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }
    
    res.json({
      success: true,
      form: form
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch form',
      details: error.message
    });
  }
});

router.post('/:formId/submit', async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        error: 'Answers object is required'
      });
    }
    
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }
    
    const airtableData = {};
    const supportedTypes = ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelect'];
    
    form.questions.forEach(question => {
      const answer = answers[question.questionKey];
      if (answer !== undefined && answer !== '' && supportedTypes.includes(question.type)) {
        airtableData[question.label] = answer;
      }
    });
    
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const recordData = {
      records: [{
        fields: airtableData
      }]
    };
    
    const airtableResponse = await axios.post(
      `https://api.airtable.com/v0/${form.airtableBaseId}/${encodeURIComponent(form.airtableTableName)}`,
      recordData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const airtableRecordId = airtableResponse.data.records[0].id;
    
    const response = new Response({
      formId: formId,
      airtableRecordId: airtableRecordId,
      answers: answers,
      status: 'synced'
    });
    
    const savedResponse = await response.save();
    
    await Form.findByIdAndUpdate(formId, { $inc: { responseCount: 1 } });
    
    res.json({
      success: true,
      message: 'Form submitted successfully',
      responseId: savedResponse._id,
      airtableRecordId: airtableRecordId
    });
    
  } catch (error) {
    try {
      if (req.params.formId && req.body.answers) {
        const errorResponse = new Response({
          formId: req.params.formId,
          airtableRecordId: 'ERROR_' + Date.now(),
          answers: req.body.answers,
          status: 'error'
        });
        await errorResponse.save();
      }
    } catch (dbError) {
      console.error('Failed to save error response:', dbError);
    }
    
    res.status(500).json({
      error: 'Form submission failed',
      details: error.response?.data || error.message
    });
  }
});

router.get('/:formId/responses', async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }
    
    const responses = await Response.find({ formId: formId })
      .sort({ createdAt: -1 })
      .select('airtableRecordId answers status deletedInAirtable createdAt updatedAt');
    
    res.json({
      success: true,
      form: {
        title: form.title,
        responseCount: form.responseCount
      },
      responses: responses
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch responses',
      details: error.message
    });
  }
});

module.exports = router;
