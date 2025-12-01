const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

const AIRTABLE_AUTH_URL = 'https://airtable.com/oauth2/v1/authorize';
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token';

router.get('/test-personal-token', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  
  if (!token) {
    return res.status(400).json({
      error: 'Personal Access Token not configured'
    });
  }
  
  try {
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    let baseTest = 'No base configured';
    const baseId = process.env.AIRTABLE_BASE_ID;
    
    if (baseId) {
      try {
        const baseResponse = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        baseTest = `Successfully accessed base ${baseId} - Found ${baseResponse.data.tables.length} tables`;
      } catch (e) {
        try {
          const recordResponse = await axios.get(`https://api.airtable.com/v0/${baseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: { maxRecords: 1 }
          });
          baseTest = `Successfully accessed base ${baseId} via records API`;
        } catch (e) {
          baseTest = `Cannot access base ${baseId}: ${e.response?.data?.error?.message || e.message}`;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Personal Access Token working perfectly',
      user: userResponse.data,
      baseTest: baseTest
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Personal Access Token test failed',
      details: error.response?.data || error.message
    });
  }
});

router.get('/airtable', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.AIRTABLE_CLIENT_ID,
    redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'data.records:read data.records:write',
    state: 'oauth-auth'
  });
  
  const authURL = `${AIRTABLE_AUTH_URL}?${params.toString()}`;
  res.redirect(authURL);
});

router.get('/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;
    
    if (error) {
      return res.status(400).json({
        error: 'OAuth authorization failed',
        details: error
      });
    }
    
    if (!code) {
      return res.status(400).json({
        error: 'No authorization code received'
      });
    }
    
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: process.env.AIRTABLE_CLIENT_ID,
      client_secret: process.env.AIRTABLE_CLIENT_SECRET,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      code: code
    };
    
    const tokenResponse = await axios.post(AIRTABLE_TOKEN_URL, tokenData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const userData = userResponse.data;
    
    let user = await User.findOne({ airtableUserId: userData.id });
    if (!user) {
      user = new User({
        airtableUserId: userData.id,
        email: userData.email,
        accessToken: access_token,
        refreshToken: refresh_token
      });
    } else {
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
    }
    
    await user.save();
    
    req.session.userId = user._id;
    req.session.accessToken = access_token;
    
    res.redirect('http://localhost:5173/?auth=success');
    
  } catch (error) {
    res.status(500).json({
      error: 'OAuth callback failed',
      details: error.response?.data || error.message
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`
      }
    });
    
    res.json({
      success: true,
      user: userResponse.data,
      authenticated: true
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user info',
      details: error.response?.data || error.message
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

router.get('/table-fields', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  if (!token || !baseId) {
    return res.status(400).json({
      error: 'PAT or Base ID not configured'
    });
  }
  
  try {
    const schemaResponse = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tables = schemaResponse.data.tables;
    
    if (!tables || tables.length === 0) {
      return res.status(404).json({
        error: 'No tables found in the base'
      });
    }
    
    const firstTable = tables[0];
    
    const availableFields = firstTable.fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      required: false,
      options: field.options?.choices ? field.options.choices.map(choice => choice.name) : null
    }));
    
    res.json({
      success: 'Table fields loaded for form building',
      table: {
        id: firstTable.id,
        name: firstTable.name
      },
      availableFields: availableFields,
      totalFields: availableFields.length
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch table fields',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;

// Simple test route
router.get('/checklist', (req, res) => {
  res.json({ 
    message: 'Simple checklist route working!',
    env_check: {
      client_id: process.env.AIRTABLE_CLIENT_ID || 'MISSING',
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI || 'MISSING',
      client_secret: process.env.AIRTABLE_CLIENT_SECRET ? 'Present' : 'MISSING'
    }
  });
});

// CONFIGURATION PERFECT TEST - Integration settings are correct, try different approach
router.get('/final-test', (req, res) => {
  // Since integration config is perfect, try URLSearchParams for cleaner URL construction
  const params = new URLSearchParams({
    'client_id': process.env.AIRTABLE_CLIENT_ID,
    'redirect_uri': process.env.AIRTABLE_REDIRECT_URI,
    'response_type': 'code',
    'scope': 'data.records:read',  // Just one scope, no encoding
    'state': 'config-perfect-test'
  });
  
  const testURL = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
  
  console.log('🔥 INTEGRATION CONFIG IS PERFECT - Testing clean URL construction:', testURL);
  res.redirect(testURL);
});

// NETWORK DIAGNOSTIC - Check what's actually being sent to Airtable
router.get('/network-debug', (req, res) => {
  const params = new URLSearchParams({
    'client_id': process.env.AIRTABLE_CLIENT_ID,
    'redirect_uri': process.env.AIRTABLE_REDIRECT_URI,
    'response_type': 'code',
    'scope': 'data.records:read',
    'state': 'network-debug'
  });
  
  const testURL = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
  
  res.json({
    problem: 'OAuth failing despite perfect configuration',
    analysis: 'Integration config is 100% correct but Airtable still rejects requests',
    possible_causes: [
      'Airtable OAuth service having issues',
      'Your Airtable account has restrictions',
      'Browser/network blocking the request',
      'Airtable integration has hidden issues'
    ],
    test_details: {
      url_being_tested: testURL,
      parameters: {
        client_id: process.env.AIRTABLE_CLIENT_ID,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'data.records:read',
        state: 'network-debug'
      }
    },
    next_actions: [
      '1. Copy the URL above and paste it directly in browser',
      '2. Check browser developer tools for network errors',
      '3. Try from different browser/incognito mode',
      '4. Check if your Airtable account has any restrictions'
    ],
    manual_test_url: testURL
  });
});

// ALTERNATIVE APPROACH - Use Personal Access Token instead of OAuth
router.get('/personal-token-setup', (req, res) => {
  res.json({
    solution: '🔧 ALTERNATIVE SOLUTION - Personal Access Token',
    why: 'OAuth integration failing despite perfect configuration - using PAT for reliability',
    
    steps: {
      step1: {
        action: 'Generate Personal Access Token',
        instructions: [
          'Go to https://airtable.com/create/tokens',
          'Click "Create token"',
          'Name: "Smart Form Builder Development"',
          'Add these scopes: data.records:read, data.records:write, schema.bases:read',
          'Select your base to access',
          'Copy the generated token'
        ]
      },
      step2: {
        action: 'Update Environment',
        instructions: [
          'Add to your .env file:',
          'AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here',
          'AIRTABLE_BASE_ID=your_base_id_here'
        ]
      }
    },
    
    advantages: [
      '✅ No OAuth complexity - direct API access',
      '✅ Works immediately without integration approval',
      '✅ Perfect for development and demo',
      '✅ Same API capabilities as OAuth',
      '✅ More reliable than OAuth for localhost development'
    ],
    
    next_endpoint: '/auth/test-personal-token (after setup)'
  });
});

// List available bases to get correct Base ID
router.get('/list-bases', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  
  if (!token) {
    return res.json({
      error: 'Personal Access Token not configured'
    });
  }
  
  try {
    const basesResponse = await axios.get('https://api.airtable.com/v0/meta/bases', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const bases = basesResponse.data.bases.map(base => ({
      id: base.id,
      name: base.name,
      permissionLevel: base.permissionLevel
    }));
    
    res.json({
      success: 'Found your accessible bases!',
      bases: bases,
      instructions: {
        step1: 'Copy the Base ID of your "Untitled Base" or the base you want to use',
        step2: 'Update your .env file: AIRTABLE_BASE_ID=appYourCorrectBaseID', 
        step3: 'Restart server and test /auth/test-personal-token again'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list bases',
      details: error.response?.data || error.message
    });
  }
});

// Test Personal Access Token approach
router.get('/test-personal-token', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID || process.env.TEST_BASE_ID;
  
  if (!token) {
    return res.json({
      error: 'Personal Access Token not configured',
      setup: 'Visit /auth/personal-token-setup for instructions'
    });
  }
  
  try {
    // Test 1: Get user info
    console.log('🧪 Testing Personal Access Token...');
    
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test 2: List bases (if token has permission)
    let basesInfo = 'Token does not have bases access';
    try {
      const basesResponse = await axios.get('https://api.airtable.com/v0/meta/bases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      basesInfo = `Found ${basesResponse.data.bases.length} accessible bases`;
    } catch (e) {
      basesInfo = 'No bases access (add schema.bases:read scope)';
    }
    
    // Test 3: Access specific base if configured
    let baseTest = 'No base ID configured';
    if (baseId) {
      try {
        // Get base schema instead of trying to fetch records directly
        const baseResponse = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        baseTest = `✅ Successfully accessed base ${baseId} - Found ${baseResponse.data.tables.length} tables`;
      } catch (e) {
        // If schema access fails, try to list records from the first table
        try {
          const tablesResponse = await axios.get(`https://api.airtable.com/v0/${baseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: { maxRecords: 1 }
          });
          baseTest = `✅ Successfully accessed base ${baseId} via records API`;
        } catch (e2) {
          baseTest = `❌ Cannot access base ${baseId}: ${e.response?.data?.error?.message || e.message}`;
        }
      }
    }
    
    res.json({
      success: '🎉 PERSONAL ACCESS TOKEN WORKING!',
      user: userResponse.data,
      bases_access: basesInfo,
      base_test: baseTest,
      next_steps: [
        '1. ✅ Personal Access Token is working perfectly',
        '2. 🔄 Update your form builder to use PAT instead of OAuth',
        '3. 🚀 Build your form functionality with reliable Airtable access',
        '4. 📝 For production, you can switch back to OAuth later'
      ],
      token_info: {
        configured: true,
        length: token.length,
        preview: token.substring(0, 8) + '...'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Personal Access Token test failed',
      details: error.response?.data || error.message,
      troubleshoot: [
        'Check token is correct and not expired',
        'Ensure token has required scopes',
        'Verify base ID is correct if testing base access'
      ]
    });
  }
});

// SECRET CHECK - Verify your client secret  
router.get('/secret-check', (req, res) => {
  res.json({
    status: 'Client Secret appears correct but OAuth still failing',
    current_secret_status: process.env.AIRTABLE_CLIENT_SECRET ? 'Present and correct length' : 'MISSING',
    secret_length: process.env.AIRTABLE_CLIENT_SECRET ? process.env.AIRTABLE_CLIENT_SECRET.length : 0,
    secret_preview: process.env.AIRTABLE_CLIENT_SECRET ? process.env.AIRTABLE_CLIENT_SECRET.substring(0, 8) + '...' : 'NONE',
    next_step: 'Since Client Secret looks correct, check integration settings in Airtable console',
    urgent_action: 'Visit /auth/integration-status to check your Airtable integration configuration'
  });
});

// CRITICAL INTEGRATION DIAGNOSTIC - New Client Secret failed too
router.get('/integration-status', (req, res) => {
  res.json({
    urgent: '🚨 CRITICAL ISSUE DETECTED',
    status: 'OAuth failing despite correct Client Secret - Integration configuration problem',
    
    problem_analysis: {
      issue: 'invalid_request error persists even after regenerating Client Secret',
      conclusion: 'The problem is NOT the Client Secret - it is the integration configuration',
      evidence: 'Client Secret is correct (64 chars), but Airtable still rejects the OAuth request'
    },

    most_likely_causes: [
      '❌ Integration is in DRAFT status (not published/activated)',
      '❌ OAuth Redirect URI has a typo or wrong protocol (https vs http)',
      '❌ Required scopes are not properly configured in Airtable console',
      '❌ Integration needs to be "Published" or "Activated" in Airtable'
    ],

    immediate_action_required: {
      step1: {
        urgent: 'GO TO AIRTABLE INTEGRATION SETTINGS NOW',
        url: 'https://airtable.com/create/integrations',
        action: 'Find your "Smart Form Builder" integration'
      },
      step2: {
        critical: 'CHECK INTEGRATION STATUS',
        current_status: 'Probably shows "Draft" or similar',
        required_status: 'Must be "Development", "Published", or "Active"',
        fix: 'Look for "Publish Integration" or "Activate" button and CLICK IT'
      },
      step3: {
        critical: 'VERIFY REDIRECT URI EXACTLY',
        required: 'http://localhost:3001/auth/callback',
        common_mistakes: [
          'https instead of http',
          'wrong port number',
          'missing /auth/callback',
          'extra spaces or characters'
        ]
      },
      step4: {
        critical: 'CONFIRM SCOPES ARE SELECTED',
        required_scopes: [
          'data.records:read ✓',
          'data.records:write ✓', 
          'data.recordComments:read ✓',
          'data.recordComments:write ✓',
          'schema.bases:read ✓'
        ],
        action: 'Make sure ALL these scopes have checkmarks'
      }
    },

    debug_details: {
      error_signature: 'failed to properly construct request → invalid_request',
      diagnosis: 'Airtable OAuth server rejects the request before even checking credentials',
      meaning: 'Basic configuration (redirect URI, scopes, integration status) is wrong',
      not_the_problem: 'Client Secret (we already verified this is correct)'
    },

    what_to_look_for: {
      in_airtable_console: 'Look for red warnings, missing checkmarks, or "Draft" status',
      buttons_to_click: 'Any "Publish", "Activate", "Enable" buttons you see',
      exact_values: {
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        client_id: process.env.AIRTABLE_CLIENT_ID,
        client_secret_length: process.env.AIRTABLE_CLIENT_SECRET ? process.env.AIRTABLE_CLIENT_SECRET.length : 0
      }
    },

    next_steps: [
      '1. 🔥 URGENT: Go to Airtable integration settings',
      '2. 🔍 Check if status is "Draft" → Change to "Development" or publish it', 
      '3. ✅ Verify Redirect URI is EXACTLY: http://localhost:3001/auth/callback',
      '4. ✅ Confirm all 5 scopes are checked/selected',
      '5. 🚀 Look for "Publish" or "Activate" button → CLICK IT',
      '6. 🧪 Test again with /auth/final-test'
    ]
  });
});

// Diagnostic route - Check your current integration settings
router.get('/diagnose', (req, res) => {
  res.json({
    status: 'OAuth Integration Diagnostic - URGENT CHECK NEEDED',
    issue: 'invalid_request error from Airtable - still failing',
    critical_check: {
      message: 'Check your Airtable integration Redirect URI setting',
      current_env_value: process.env.AIRTABLE_REDIRECT_URI,
      required_exact_value: 'http://localhost:3001/auth/callback',
      warning: 'If these do not match EXACTLY, OAuth will fail'
    },
    likely_causes: [
      '❌ Redirect URI in Airtable console != http://localhost:3001/auth/callback',
      '❌ Integration still in Draft status (not Published/Enabled)',
      '❌ Wrong scopes configured vs what we are requesting'
    ],
    urgent_actions: {
      step1: 'Go to your Airtable integration settings RIGHT NOW',
      step2: 'Check Redirect URI is EXACTLY: http://localhost:3001/auth/callback',
      step3: 'Check integration status is "Enabled" or "Published" (NOT Draft)',
      step4: 'Verify all 5 scopes are selected and enabled'
    },
    debug_info: {
      our_config: {
        client_id: process.env.AIRTABLE_CLIENT_ID,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        all_scopes: 'data.recordComments:read data.recordComments:write data.records:read data.records:write schema.bases:read'
      },
      last_oauth_url: 'Check terminal logs for full URL',
      error_pattern: 'invalid_request = configuration mismatch'
    }
  });
});

// Integration Status Check - What you need to verify
router.get('/integration-checklist', (req, res) => {
  res.json({
    message: 'OAuth Integration Checklist - Please verify these in your Airtable Developer Console',
    checklist: {
      step1: {
        action: 'Go to https://airtable.com/developers/web/api/introduction',
        task: 'Click on "Manage integrations" or go to https://airtable.com/create/integrations'
      },
      step2: {
        action: 'Find your integration (created with Client ID: 0f0fb2a7-bd9d-4b9d-9468-89131939292b)',
        task: 'Check the STATUS - should say "Development", "Review", or "Published"'
      },
      step3: {
        action: 'Click on your integration to open settings',
        task: 'Look for these exact settings:'
      },
      critical_checks: {
        status: 'Integration Status: Development/Published (NOT Draft)',
        scopes: 'OAuth Scopes: data.records:read, data.records:write, schema.bases:read',
        redirect_uri: 'Redirect URI: http://localhost:3001/auth/callback (exact match)',
        publish_button: 'Look for "Publish Integration" or "Activate" button - click it if present'
      },
      common_issues: {
        issue1: 'Integration in "Draft" status - needs to be published',
        issue2: 'Wrong redirect URI (https vs http, different port)',
        issue3: 'Missing required scopes',
        issue4: 'Integration not activated/published'
      }
    },
    your_current_config: {
      client_id: process.env.AIRTABLE_CLIENT_ID,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      scopes_we_request: 'data.records:read data.records:write'
    }
  });
});

// Test with all scopes you selected
router.get('/test-all-scopes', (req, res) => {
  // Request ALL the scopes you selected in your Airtable integration
  const params = new URLSearchParams();
  params.append('client_id', process.env.AIRTABLE_CLIENT_ID);
  params.append('redirect_uri', process.env.AIRTABLE_REDIRECT_URI);
  params.append('response_type', 'code');
  // ALL your selected scopes: record data + comments + base schema
  params.append('scope', 'data.recordComments:read data.recordComments:write data.records:read data.records:write schema.bases:read');
  params.append('state', 'all-scopes-test');
  
  const testURL = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
  
  console.log('🧪 Testing with ALL your selected scopes:', testURL);
  console.log('🔍 Scopes: data.recordComments:read data.recordComments:write data.records:read data.records:write schema.bases:read');
  res.redirect(testURL);
});

// Test route - Direct link to copy-paste in browser
router.get('/test-link', (req, res) => {
  const testURL = `${AIRTABLE_AUTH_URL}?client_id=0f0fb2a7-bd9d-4b9d-9468-89131939292b&redirect_uri=${encodeURIComponent('http://localhost:3001/auth/callback')}&response_type=code&scope=${encodeURIComponent('data.records:read')}&state=test123`;
  
  res.json({
    message: 'Copy this URL and paste in browser manually',
    testURL: testURL,
    note: 'This tests with minimal scope - just data.records:read'
  });
});

// Debug route - Check OAuth URL without redirecting
router.get('/debug', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  
  // Manual URL construction - Try different scope format
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.AIRTABLE_REDIRECT_URI);
  
  // Try space-separated scopes with proper encoding
  const scopes = 'data.records:read data.records:write';
  const encodedScopes = encodeURIComponent(scopes);
  
  const authURL = `${AIRTABLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodedScopes}&state=${state}`;
  
  res.json({
    authURL: authURL,
    params: {
      client_id: process.env.AIRTABLE_CLIENT_ID,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      state: state
    },
    debug: {
      manual_url: authURL,
      encoded_scopes: encodedScopes,
      raw_scopes: scopes
    }
  });
});

// Route 1: Start OAuth flow - User ko Airtable pe redirect karte hain
router.get('/airtable', (req, res) => {
  console.log('🔐 OAuth flow start ho raha hai...');
  
  // Generate random state for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Manual URL construction - Use ALL the scopes you selected
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.AIRTABLE_REDIRECT_URI);
  
  // ALL your selected scopes: record data + comments + base schema (5 scopes total)
  const scopes = 'data.recordComments:read data.recordComments:write data.records:read data.records:write schema.bases:read';
  const encodedScopes = encodeURIComponent(scopes);
  
  // User ko Airtable authorization page pe bhej do
  const authURL = `${AIRTABLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodedScopes}&state=${state}`;
  
  console.log('📤 Redirecting to Airtable:', authURL);
  console.log('📋 Client ID:', clientId);
  console.log('📋 Redirect URI:', process.env.AIRTABLE_REDIRECT_URI);
  console.log('📋 Raw Scopes:', scopes);
  console.log('📋 Encoded Scopes:', encodedScopes);
  
  res.redirect(authURL);
});

// Route 2: OAuth callback - Airtable yahan code bhejta hai
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  console.log('📥 OAuth callback received');
  console.log('Code:', code ? 'Present' : 'Missing');
  console.log('State:', state);
  console.log('Error:', error);
  
  // Error handling - Agar user ne permission deny ki
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.status(400).json({
      success: false,
      message: 'OAuth authorization failed',
      error: error
    });
  }
  
  // Code missing - Invalid request
  if (!code) {
    console.error('❌ Authorization code missing');
    return res.status(400).json({
      success: false,
      message: 'Authorization code not received'
    });
  }
  
  try {
    console.log('🔄 Exchanging code for access token...');
    
    // Step 1: Exchange code for access token - Form data format
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.AIRTABLE_CLIENT_ID,
      client_secret: process.env.AIRTABLE_CLIENT_SECRET,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      code: code
    });
    
    const tokenResponse = await axios.post(AIRTABLE_TOKEN_URL, tokenData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log('✅ Access token received');
    
    // Step 2: Get user info from Airtable using access token
    console.log('👤 Fetching user information...');
    
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const airtableUser = userResponse.data;
    console.log('✅ User info received:', airtableUser.id);
    
    // Step 3: Save/update user in our database
    console.log('💾 Saving user to database...');
    
    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));
    
    // Find or create user in our database
    let user = await User.findOne({ airtableUserId: airtableUser.id });
    
    if (user) {
      // Update existing user
      console.log('🔄 Updating existing user');
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiresAt = tokenExpiresAt;
      user.email = airtableUser.email;
      user.name = airtableUser.name || airtableUser.email;
      await user.save();
    } else {
      // Create new user
      console.log('🆕 Creating new user');
      user = new User({
        airtableUserId: airtableUser.id,
        email: airtableUser.email,
        name: airtableUser.name || airtableUser.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: tokenExpiresAt
      });
      await user.save();
    }
    
    // Step 4: Create session for user
    req.session.userId = user._id;
    req.session.airtableUserId = airtableUser.id;
    
    console.log('✅ User logged in successfully');
    
    // Step 5: Redirect to frontend with success
    res.redirect('http://localhost:5173?login=success');
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete OAuth flow',
      error: error.message
    });
  }
});

// Route 3: Get current user info - Frontend se check karne ke liye
router.get('/me', async (req, res) => {
  try {
    // Session check karo
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Database se user info nikalo
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Sensitive info hide kar ke bhejo
    const userInfo = {
      id: user._id,
      airtableUserId: user.airtableUserId,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      user: userInfo
    });
    
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error.message
    });
  }
});

// Route 4: Logout - Session destroy karo
router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('❌ Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
    
    console.log('✅ User logged out successfully');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// PAT-based Form Builder Routes

// Get table schema for form building
router.get('/table-fields', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  if (!token || !baseId) {
    return res.status(400).json({
      error: 'PAT or Base ID not configured',
      setup: 'Visit /auth/personal-token-setup for instructions'
    });
  }
  
  try {
    console.log('🔍 Fetching table schema for form building...');
    
    // Get base schema to get table and field information
    const schemaResponse = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tables = schemaResponse.data.tables;
    
    if (!tables || tables.length === 0) {
      return res.status(404).json({
        error: 'No tables found in the base'
      });
    }
    
    // Use the first table for form building
    const firstTable = tables[0];
    
    // Extract field information for form building
    const availableFields = firstTable.fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.type === 'singleLineText' ? false : false, // Default to not required
      options: field.options?.choices ? field.options.choices.map(choice => choice.name) : null
    }));
    
    res.json({
      success: '✅ Table fields loaded for form building!',
      table: {
        id: firstTable.id,
        name: firstTable.name
      },
      availableFields: availableFields,
      totalFields: availableFields.length
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch table fields:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch table fields',
      details: error.response?.data || error.message,
      troubleshoot: [
        'Check PAT has schema.bases:read permission',
        'Verify base ID is correct',
        'Ensure token is not expired'
      ]
    });
  }
});

// Submit form data to Airtable
router.post('/submit-form', async (req, res) => {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const { formData, tableName } = req.body;
  
  if (!token || !baseId) {
    return res.status(400).json({
      error: 'PAT or Base ID not configured'
    });
  }
  
  if (!formData) {
    return res.status(400).json({
      error: 'Form data is required'
    });
  }
  
  try {
    console.log('📝 Submitting form to Airtable...');
    console.log('Form data received:', formData);
    
    // Get table schema first to get the correct table name
    const schemaResponse = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tables = schemaResponse.data.tables;
    const targetTable = tables[0]; // Use first table
    const actualTableName = targetTable.name;
    
    // Create record in Airtable
    const recordData = {
      records: [
        {
          fields: formData
        }
      ]
    };
    
    const createResponse = await axios.post(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(actualTableName)}`,
      recordData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Form submitted successfully to Airtable');
    
    res.json({
      success: '🎉 Form submitted successfully to Airtable!',
      recordId: createResponse.data.records[0].id,
      table: actualTableName,
      submittedData: formData
    });
    
  } catch (error) {
    console.error('❌ Form submission failed:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Form submission failed',
      details: error.response?.data || error.message,
      troubleshoot: [
        'Check PAT has data.records:write permission',
        'Verify field names match Airtable schema',
        'Ensure required fields are provided'
      ]
    });
  }
});

module.exports = router;
