const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const connectDatabase = require('./database/connection');
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const webhookRoutes = require('./routes/webhooks');

const app = express();

connectDatabase();

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    'https://airtable-form-builder-r9n8v8hn8-sharduljoshi2001s-projects.vercel.app',
    /vercel\.app$/,
    /\.vercel\.app$/
  ],
  credentials: true
})); 
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/forms', formRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    message: 'Server running',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /',
      'GET /health',
      'GET /auth/airtable',
      'GET /auth/callback', 
      'GET /auth/me',
      'POST /auth/logout',
      'GET /api/fields',
      'POST /api/form', 
      'POST /api/submit'
    ]
  });
});

const fakeAirtableFields = [
  { 
    id: 'fld1', 
    name: 'Name', 
    type: 'singleLineText',
    required: true 
  },
  { 
    id: 'fld2', 
    name: 'Email', 
    type: 'email',
    required: true 
  },
  { 
    id: 'fld3', 
    name: 'Role', 
    type: 'singleSelect',
    options: ['Developer', 'Designer', 'Manager'],
    required: true
  },
  { 
    id: 'fld4', 
    name: 'GitHub URL', 
    type: 'url',
    required: false 
  }
];

app.get('/api/fields', (req, res) => {
  res.json(fakeAirtableFields);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'Server working',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001
  });
});

app.post('/api/form', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Form saved',
    formId: 'demo-form-123'
  });
});

app.post('/api/submit', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Response saved' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

