const express = require('express');
const Response = require('../models/ResponseNew');
const router = express.Router();

router.post('/airtable', async (req, res) => {
  try {
    const webhook = req.body;
    
    if (!webhook.base || !webhook.webhook || !webhook.timestamp) {
      return res.status(400).json({
        error: 'Invalid webhook payload'
      });
    }
    
    const { base, webhook: webhookData } = webhook;
    const baseId = base.id;
    
    if (webhookData.payloadFormat === 'v0' && webhookData.specification) {
      const { specification } = webhookData;
      
      for (const [tableId, tableSpec] of Object.entries(specification.options.filters.dataTypes)) {
        if (tableSpec.includes('tableData')) {
          await processTableDataChanges(baseId, tableId, req.body);
        }
      }
    }
    
    if (webhook.payloads && Array.isArray(webhook.payloads)) {
      for (const payload of webhook.payloads) {
        await processWebhookPayload(payload);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

async function processWebhookPayload(payload) {
  try {
    const { actionMetadata, changedTablesById } = payload;
    
    if (!changedTablesById) return;
    
    for (const [tableId, tableChanges] of Object.entries(changedTablesById)) {
      const { changedRecordsById, createdRecordsById, destroyedRecordIds } = tableChanges;
      
      if (changedRecordsById) {
        for (const [recordId, recordChanges] of Object.entries(changedRecordsById)) {
          await handleRecordUpdate(recordId, recordChanges);
        }
      }
      
      if (createdRecordsById) {
        for (const recordId of Object.keys(createdRecordsById)) {
          await handleRecordCreation(recordId);
        }
      }
      
      if (destroyedRecordIds) {
        for (const recordId of destroyedRecordIds) {
          await handleRecordDeletion(recordId);
        }
      }
    }
    
  } catch (error) {
    console.error('Error processing webhook payload:', error);
  }
}

async function handleRecordUpdate(airtableRecordId, recordChanges) {
  try {
    const response = await Response.findOne({ airtableRecordId });
    
    if (response) {
      response.status = 'synced';
      response.updatedAt = new Date();
      await response.save();
    }
    
  } catch (error) {
    console.error(`Error updating record ${airtableRecordId}:`, error);
  }
}

async function handleRecordCreation(airtableRecordId) {
  try {
    const existingResponse = await Response.findOne({ airtableRecordId });
    
    if (!existingResponse) {
      console.log(`New record created in Airtable: ${airtableRecordId}`);
    }
    
  } catch (error) {
    console.error(`Error handling record creation ${airtableRecordId}:`, error);
  }
}

async function handleRecordDeletion(airtableRecordId) {
  try {
    const response = await Response.findOne({ airtableRecordId });
    
    if (response) {
      response.deletedInAirtable = true;
      response.status = 'synced';
      response.updatedAt = new Date();
      await response.save();
    }
    
  } catch (error) {
    console.error(`Error handling record deletion ${airtableRecordId}:`, error);
  }
}

async function processTableDataChanges(baseId, tableId, webhookBody) {
  try {
    console.log(`Processing table data changes - Base: ${baseId}, Table: ${tableId}`);
  } catch (error) {
    console.error('Error processing table data changes:', error);
  }
}

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
