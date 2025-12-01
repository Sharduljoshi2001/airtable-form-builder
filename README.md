# Airtable Form Builder

A full-stack MERN application that allows users to create dynamic forms using Airtable fields, with conditional logic and real-time response management.

## 🚀 Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **External API:** Airtable (OAuth + REST API)
- **Real-time Sync:** Airtable Webhooks

## 📋 Features

### Core Features
- ✅ Airtable OAuth Authentication
- ✅ Dynamic Form Builder using Airtable fields
- ✅ Conditional Logic for form questions
- ✅ Dual data storage (Airtable + MongoDB)
- ✅ Response management and viewing
- ✅ Real-time webhook synchronization
- ✅ Support for multiple field types

### Supported Field Types
- Short text (singleLineText)
- Long text (multilineText)
- Single select dropdown
- Multiple select
- File attachments

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Airtable account
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sharduljoshi2001/airtable-form-builder.git
   cd airtable-form-builder/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Required
   MONGODB_URI=mongodb://localhost:27017/airtable-form-builder
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
   AIRTABLE_BASE_ID=your_base_id_here
   SESSION_SECRET=your_secret_here
   
   # Optional (for OAuth)
   AIRTABLE_CLIENT_ID=your_client_id
   AIRTABLE_CLIENT_SECRET=your_client_secret
   AIRTABLE_REDIRECT_URI=http://localhost:3001/auth/callback
   ```

4. **Start MongoDB:**
   ```bash
   # macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # Or start mongod directly
   mongod
   ```

5. **Run the backend:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

   Backend will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ../frontend/smart-form-builder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

## 🔧 Detailed Airtable OAuth Setup Guide

### Step-by-Step OAuth Configuration

#### Method 1: OAuth Integration (Production Ready)

**Step 1: Create Airtable Integration**
1. Visit [Airtable Developer Hub](https://airtable.com/developers/web/guides/oauth-integrations)
2. Click **"Create new integration"**
3. Fill in integration details:
   ```
   Integration name: Form Builder App
   Description: Dynamic form builder with conditional logic
   Website URL: https://your-domain.com (or localhost for dev)
   ```

**Step 2: Configure OAuth Settings**
1. **Redirect URLs:** Add these URLs:
   ```
   http://localhost:3001/auth/callback
   https://your-production-domain.com/auth/callback
   ```

2. **Scopes:** Select these permissions:
   ```
   ✅ data.records:read    - Read form responses
   ✅ data.records:write   - Create new responses  
   ✅ schema.bases:read    - Access field definitions
   ✅ data.recordComments:read  (optional)
   ✅ data.recordComments:write (optional)
   ```

**Step 3: Get Credentials**
1. Copy **Client ID** from integration page
2. Copy **Client Secret** (keep this secure!)
3. Add to your `.env` file:
   ```env
   AIRTABLE_CLIENT_ID=your_client_id_here
   AIRTABLE_CLIENT_SECRET=your_client_secret_here
   AIRTABLE_REDIRECT_URI=http://localhost:3001/auth/callback
   ```

**Step 4: Test OAuth Flow**
1. Start your backend server
2. Visit: `http://localhost:3001/auth/airtable`
3. Complete Airtable authorization
4. You should be redirected back with success

#### Method 2: Personal Access Token (Development)

1. **Generate Personal Access Token:**
   - Go to https://airtable.com/create/tokens
   - Create a new token with these scopes:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
   - Add your base to the token permissions

2. **Get Base ID:**
   - Go to https://airtable.com/api
   - Select your base
   - Copy the Base ID from the URL or documentation

### Method 2: OAuth (For Production)

1. **Create Airtable Integration:**
   - Go to https://airtable.com/developers/web/guides/oauth-integrations
   - Create new integration
   - Configure these scopes:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
   - Set redirect URI: `http://localhost:3001/auth/callback`

2. **Get OAuth Credentials:**
   - Copy Client ID and Client Secret
   - Add them to your `.env` file

## 📊 Detailed Data Model Explanation

### Database Architecture

Our application uses **MongoDB** with **Mongoose** for data modeling. Here's the complete schema breakdown:

#### 1. FormNew Schema (Primary Form Definition)
```javascript
const formSchema = {
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    example: "Customer Feedback Form"
  },
  
  description: {
    type: String,
    default: '',
    example: "Collect customer feedback with conditional follow-ups"
  },
  
  // Airtable Integration
  airtableBaseId: {
    type: String,
    required: true,
    example: "appYuE7c5VAKijBI8"
  },
  
  airtableTableId: {
    type: String,
    required: true,
    example: "tblXYZ123"
  },
  
  airtableTableName: {
    type: String,
    required: true,
    example: "Customer Feedback"
  },
  
  // Form Questions with Conditional Logic
  questions: [{
    questionKey: {
      type: String,
      required: true,
      example: "q_1, q_2, q_satisfaction"
    },
    
    airtableFieldId: {
      type: String,
      required: true,
      example: "fldABC123"
    },
    
    label: {
      type: String,
      required: true,
      example: "How satisfied are you with our service?"
    },
    
    type: {
      type: String,
      enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelect'],
      example: "singleSelect"
    },
    
    required: {
      type: Boolean,
      default: false
    },
    
    options: [{
      type: String,
      example: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"]
    }],
    
    conditionalRules: {
      type: Object,
      example: {
        logic: "AND",
        conditions: [{
          questionKey: "q_satisfaction",
          operator: "equals", 
          value: "Dissatisfied"
        }]
      }
    }
  }],
  
  // Form Metadata
  isPublished: { type: Boolean, default: true },
  responseCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### 2. ResponseNew Schema (Form Submissions)
```javascript
const responseSchema = {
  // Reference to Form
  formId: {
    type: ObjectId,
    ref: 'FormNew',
    required: true,
    example: "507f1f77bcf86cd799439011"
  },
  
  // Airtable Sync Information
  airtableRecordId: {
    type: String,
    required: true,
    unique: true,
    example: "recABC123XYZ"
  },
  
  // User Responses (Raw JSON)
  answers: {
    type: Mixed,
    required: true,
    example: {
      "q_1": "John Doe",
      "q_satisfaction": "Very Satisfied", 
      "q_feedback": "Great service!"
    }
  },
  
  // Sync Status Tracking
  status: {
    type: String,
    enum: ['submitted', 'synced', 'error'],
    default: 'submitted'
  },
  
  deletedInAirtable: {
    type: Boolean,
    default: false // For webhook deletion tracking
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### 3. User Schema (OAuth Authentication)
```javascript
const userSchema = {
  airtableUserId: {
    type: String,
    required: true,
    unique: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  accessToken: {
    type: String,
    required: true // OAuth access token
  },
  
  refreshToken: {
    type: String // For token refresh
  },
  
  createdAt: { type: Date, default: Date.now }
}
```

### Data Flow Architecture

```mermaid
graph TD
    A[User Creates Form] --> B[Select Airtable Fields]
    B --> C[Configure Conditional Logic]
    C --> D[Save to MongoDB as FormNew]
    
    E[User Fills Form] --> F[Apply Conditional Logic]
    F --> G[Submit Response]
    G --> H[Save to Airtable]
    H --> I[Save to MongoDB as ResponseNew]
    
    J[Airtable Webhook] --> K[Update Local Database]
    K --> L[Sync Status Updated]
```
```javascript
{
  title: String,
  description: String,
  airtableBaseId: String,
  airtableTableId: String,
  airtableTableName: String,
  questions: [{
    questionKey: String,
    airtableFieldId: String,
    label: String,
    type: String,
    required: Boolean,
    options: [String],
    conditionalRules: {
      logic: "AND" | "OR",
      conditions: [{
        questionKey: String,
        operator: "equals" | "notEquals" | "contains",
        value: Mixed
      }]
    }
  }],
  isPublished: Boolean,
  responseCount: Number
}
```

### Response Schema
```javascript
{
  formId: ObjectId,
  airtableRecordId: String,
  answers: Mixed,
  status: "submitted" | "synced" | "error",
  deletedInAirtable: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧠 Detailed Conditional Logic Explanation

### How Conditional Logic Works

Our form builder implements **real-time conditional logic** that shows/hides questions based on user responses. This creates dynamic, intelligent forms that adapt to user input.

### Core Logic Function

```javascript
/**
 * Pure function that determines if a question should be shown
 * @param {Object|null} rules - Conditional rules configuration
 * @param {Object} answersSoFar - Current form responses
 * @returns {boolean} - Whether to show the question
 */
function shouldShowQuestion(rules, answersSoFar) {
  // No rules = always show
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }
  
  const { logic, conditions } = rules;
  const conditionResults = [];
  
  // Evaluate each condition
  for (const condition of conditions) {
    const { questionKey, operator, value } = condition;
    const userAnswer = answersSoFar[questionKey];
    
    // Handle missing answers gracefully
    if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
      conditionResults.push(false);
      continue;
    }
    
    let conditionMet = false;
    
    switch (operator) {
      case 'equals':
        conditionMet = userAnswer === value;
        break;
      
      case 'notEquals':
        conditionMet = userAnswer !== value;
        break;
      
      case 'contains':
        if (Array.isArray(userAnswer)) {
          // For multiple select fields
          conditionMet = userAnswer.includes(value);
        } else if (typeof userAnswer === 'string') {
          // For text fields
          conditionMet = userAnswer.toLowerCase().includes(value.toLowerCase());
        }
        break;
    }
    
    conditionResults.push(conditionMet);
  }
  
  // Combine results with AND/OR logic
  if (logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (logic === 'OR') {
    return conditionResults.some(result => result === true);
  }
  
  return false;
}
```

### Conditional Rules Structure

```javascript
// Example 1: Simple condition
{
  logic: "AND",
  conditions: [{
    questionKey: "role",
    operator: "equals",
    value: "Developer"
  }]
}

// Example 2: Multiple conditions with AND logic
{
  logic: "AND", 
  conditions: [
    { questionKey: "role", operator: "equals", value: "Developer" },
    { questionKey: "experience", operator: "contains", value: "React" }
  ]
}

// Example 3: Multiple conditions with OR logic
{
  logic: "OR",
  conditions: [
    { questionKey: "satisfaction", operator: "equals", value: "Dissatisfied" },
    { questionKey: "satisfaction", operator: "equals", value: "Very Dissatisfied" }
  ]
}
```

### Real-World Examples

#### Example 1: Customer Feedback Form
```javascript
// Question 1: "How satisfied are you?"
// Options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"]

// Question 2: "What went wrong?" (Conditional)
// Only show if satisfaction is "Dissatisfied"
{
  logic: "AND",
  conditions: [{
    questionKey: "q_satisfaction",
    operator: "equals", 
    value: "Dissatisfied"
  }]
}
```

#### Example 2: Job Application Form
```javascript
// Question 1: "What role are you applying for?"
// Options: ["Developer", "Designer", "Manager"]

// Question 2: "Programming languages?" (Conditional)
// Only show for Developers
{
  logic: "AND", 
  conditions: [{
    questionKey: "q_role",
    operator: "equals",
    value: "Developer"  
  }]
}

// Question 3: "Design tools?" (Conditional)
// Only show for Designers
{
  logic: "AND",
  conditions: [{
    questionKey: "q_role", 
    operator: "equals",
    value: "Designer"
  }]
}
```

#### Example 3: Complex Multi-Condition Logic
```javascript
// Show "GitHub URL" field only if:
// Role = "Developer" AND Experience includes "React" 
{
  logic: "AND",
  conditions: [
    { questionKey: "q_role", operator: "equals", value: "Developer" },
    { questionKey: "q_experience", operator: "contains", value: "React" }
  ]
}

// Show "Feedback" field if:
// Satisfaction = "Dissatisfied" OR Rating < 3
{
  logic: "OR", 
  conditions: [
    { questionKey: "q_satisfaction", operator: "equals", value: "Dissatisfied" },
    { questionKey: "q_rating", operator: "equals", value: "1" },
    { questionKey: "q_rating", operator: "equals", value: "2" }
  ]
}
```

### Supported Operators

| Operator | Description | Example Use Case |
|----------|-------------|------------------|
| `equals` | Exact match | Role selection, Yes/No questions |
| `notEquals` | Not equal to | Show field when NOT selecting option |
| `contains` | Contains value | Multi-select fields, text search |

### Implementation in Frontend

```javascript
// Real-time logic evaluation in React
function FormViewer({ form }) {
  const [answers, setAnswers] = useState({});
  
  // Get visible questions based on current answers
  const visibleQuestions = form.questions.filter(question => {
    return shouldShowQuestion(question.conditionalRules, answers);
  });
  
  return (
    <form>
      {visibleQuestions.map(question => (
        <QuestionField 
          key={question.questionKey}
          question={question}
          value={answers[question.questionKey]}
          onChange={(value) => setAnswers({...answers, [question.questionKey]: value})}
        />
      ))}
    </form>
  );
}
```

### Benefits of This Approach

1. **Pure Functions:** Testable, predictable logic
2. **Real-time Updates:** Immediate field visibility changes  
3. **Flexible Rules:** Support for complex conditions
4. **Error Handling:** Graceful handling of missing data
5. **Performance:** Efficient re-evaluation on each change

## 🎣 Detailed Webhook Configuration

### Understanding Airtable Webhooks

Webhooks allow your application to **automatically sync** with Airtable when data changes. Instead of constantly polling Airtable, webhooks push changes to your server in real-time.

### Complete Webhook Setup Process

#### Step 1: Create Webhook Endpoint (Already Implemented)

Our backend has a webhook handler at `/webhooks/airtable`:

```javascript
// backend/routes/webhooks.js
router.post('/airtable', async (req, res) => {
  try {
    const webhook = req.body;
    
    // Validate webhook payload
    if (!webhook.base || !webhook.webhook || !webhook.timestamp) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Process different webhook events
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
```

#### Step 2: Expose Local Server (Development)

For local development, use **ngrok** to make your localhost accessible to Airtable:

```bash
# Install ngrok globally
npm install -g ngrok

# Start your backend server first
cd backend
npm run dev

# In another terminal, expose your server
ngrok http 3001

# You'll get a public URL like: https://abc123.ngrok.io
```

#### Step 3: Register Webhook with Airtable

Use Airtable's API to register your webhook endpoint:

```bash
# Replace with your actual values
export AIRTABLE_TOKEN="your_personal_access_token"
export BASE_ID="your_base_id" 
export WEBHOOK_URL="https://abc123.ngrok.io/webhooks/airtable"

# Create the webhook
curl -X POST "https://api.airtable.com/v0/bases/${BASE_ID}/webhooks" \
  -H "Authorization: Bearer ${AIRTABLE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"notificationUrl\": \"${WEBHOOK_URL}\",
    \"specification\": {
      \"options\": {
        \"filters\": {
          \"dataTypes\": [\"tableData\"],
          \"recordChangeScope\": \"tblYOUR_TABLE_ID\"
        }
      }
    }
  }"
```

**Successful Response:**
```json
{
  "id": "achOOOOOOOOOOOOOO",
  "macSecretBase64": "your_webhook_secret",
  "notificationUrl": "https://abc123.ngrok.io/webhooks/airtable",
  "specification": {
    "options": {
      "filters": {
        "dataTypes": ["tableData"]
      }
    }
  }
}
```

#### Step 4: Configure Webhook Secret (Security)

Add the webhook secret to your environment:

```env
# Add to backend/.env
WEBHOOK_SECRET=your_webhook_secret_from_airtable
WEBHOOK_URL=https://abc123.ngrok.io/webhooks/airtable
```

#### Step 5: Webhook Event Handling

Our webhook processor handles these events:

```javascript
async function processWebhookPayload(payload) {
  const { changedTablesById } = payload;
  
  if (!changedTablesById) return;
  
  for (const [tableId, tableChanges] of Object.entries(changedTablesById)) {
    const { changedRecordsById, createdRecordsById, destroyedRecordIds } = tableChanges;
    
    // Handle updated records
    if (changedRecordsById) {
      for (const [recordId, recordChanges] of Object.entries(changedRecordsById)) {
        await handleRecordUpdate(recordId, recordChanges);
      }
    }
    
    // Handle deleted records  
    if (destroyedRecordIds) {
      for (const recordId of destroyedRecordIds) {
        await handleRecordDeletion(recordId);
      }
    }
  }
}

// Update local database when Airtable record changes
async function handleRecordUpdate(airtableRecordId, recordChanges) {
  const response = await Response.findOne({ airtableRecordId });
  
  if (response) {
    response.status = 'synced';
    response.updatedAt = new Date();
    await response.save();
  }
}

// Mark local record as deleted when Airtable record is deleted
async function handleRecordDeletion(airtableRecordId) {
  const response = await Response.findOne({ airtableRecordId });
  
  if (response) {
    response.deletedInAirtable = true;
    response.status = 'synced'; 
    response.updatedAt = new Date();
    await response.save();
  }
}
```

### Webhook Events We Handle

| Event Type | Description | Our Response |
|------------|-------------|--------------|
| **Record Updated** | User edits a record in Airtable | Update local record status to 'synced' |
| **Record Deleted** | User deletes a record in Airtable | Mark local record as `deletedInAirtable: true` |
| **Record Created** | External record created in Airtable | Log the event (optional handling) |

### Testing Your Webhook

1. **Start your servers:**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: ngrok
   ngrok http 3001
   ```

2. **Register webhook** using the curl command above

3. **Test webhook:**
   - Submit a form response through your app
   - Go to Airtable and manually edit that record
   - Check your server logs - you should see webhook events
   - Verify your local database updates accordingly

4. **Webhook health check:**
   ```bash
   curl https://abc123.ngrok.io/webhooks/health
   ```

### Production Webhook Setup

For production deployment:

1. **Deploy your backend** to Render/Railway/Heroku
2. **Use your production URL** instead of ngrok:
   ```bash
   export WEBHOOK_URL="https://your-backend.onrender.com/webhooks/airtable"
   ```
3. **Register webhook** with production URL
4. **Set environment variables** on your hosting platform

### Webhook Security Best Practices

1. **Validate webhook signatures** (implement HMAC validation)
2. **Use HTTPS** for webhook URLs
3. **Keep webhook secrets secure**
4. **Implement idempotency** for duplicate webhook calls
5. **Add rate limiting** to webhook endpoints

### Troubleshooting Webhooks

| Issue | Solution |
|-------|----------|
| Webhook not receiving events | Check ngrok is running and URL is correct |
| 404 errors | Verify webhook endpoint path is `/webhooks/airtable` |
| Authorization errors | Check webhook secret in environment variables |
| Timeout errors | Ensure webhook responds within 10 seconds |
| Duplicate events | Implement idempotency using webhook IDs |

## 🔄 API Endpoints

### Authentication
- `GET /auth/airtable` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user
- `GET /auth/table-fields` - Get Airtable fields

### Forms
- `GET /forms` - List all forms
- `POST /forms` - Create new form
- `GET /forms/:id` - Get specific form
- `POST /forms/:id/submit` - Submit form response
- `GET /forms/:id/responses` - Get form responses

### Webhooks
- `POST /webhooks/airtable` - Handle Airtable webhooks
- `GET /webhooks/health` - Webhook health check

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Update API base URL in production

### Backend (Render/Railway)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with auto-deployment enabled

### Environment Variables for Production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_production_token
AIRTABLE_BASE_ID=your_production_base_id
SESSION_SECRET=strong_production_secret
FRONTEND_URL=https://your-frontend-domain.com
WEBHOOK_URL=https://your-backend-domain.com/webhooks/airtable
```

## 📸 Screenshots & Demo

### Form Builder Interface
![Form Builder](./docs/screenshots/form-builder.png)
*Create dynamic forms using real Airtable fields with conditional logic*

### Form Preview with Conditional Logic
![Form Preview](./docs/screenshots/form-preview.png)
*Real-time conditional field visibility based on user inputs*

### Response Management Dashboard
![Responses](./docs/screenshots/responses.png)
*View and manage all form submissions with sync status*

### 🎥 Demo Video
**Live Demo:** [Watch Demo Video](./docs/demo-video.mp4)

**Quick Demo Steps:**
1. Connect to Airtable using Personal Access Token
2. Select Airtable fields to build a form
3. Configure conditional logic rules
4. Preview and test the form
5. Submit responses and view in dashboard
6. Verify data synced to both Airtable and MongoDB

## 🚀 How to Run the Project

### Quick Start (Development)

**Terminal 1 - Backend:**
```bash
# Navigate to backend
cd airtable-form-builder/backend

# Install dependencies
npm install

# Start MongoDB
npm run mongo:start

# Copy environment file and configure
cp .env.example .env
# Edit .env with your Airtable credentials

# Start backend server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# Navigate to frontend
cd airtable-form-builder/frontend/smart-form-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

**Terminal 3 - Database (if needed):**
```bash
# Start MongoDB manually if brew command doesn't work
mongod --dbpath /usr/local/var/mongodb
```

### 🔗 Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health

### ⚡ Production Build
```bash
# Build frontend for production
cd frontend/smart-form-builder
npm run build

# Start backend in production mode
cd ../../backend
npm start
```

### Test the Complete Flow

1. **Form Creation:**
   - Visit `http://localhost:5173`
   - Create a form using Airtable fields
   - Verify form saves to MongoDB

2. **Form Filling:**
   - Navigate to Preview Form tab
   - Fill out the form with test data
   - Test conditional logic

3. **Response Submission:**
   - Submit the form
   - Check both Airtable and MongoDB for new records

4. **Response Viewing:**
   - Go to View Responses tab
   - Verify all responses are listed

5. **Webhook Testing:**
   - Modify a record in Airtable
   - Check if local database updates

## 📁 Project Structure

```
airtable-form-builder/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── database/         # Database connection
│   ├── middleware/       # Express middleware
│   ├── server.js         # Main server file
│   └── .env.example      # Environment template
└── frontend/
    └── smart-form-builder/
        ├── src/
        │   ├── components/   # React components
        │   ├── App.jsx       # Main app component
        │   └── main.jsx      # Entry point
        └── package.json      # Frontend dependencies
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Airtable API Errors:**
   - Verify Personal Access Token has correct permissions
   - Check Base ID is correct
   - Ensure token hasn't expired

3. **CORS Errors:**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check frontend API base URL

4. **Webhook Not Working:**
   - Use ngrok for local testing
   - Verify webhook URL is publicly accessible
   - Check webhook secret matches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational/interview purposes.

---

**Demo:** [Coming Soon - Add your deployed URL here]  
**Repository:** https://github.com/Sharduljoshi2001/airtable-form-builder  
**Author:** Shardul Joshi  
**Created for:** MERN Stack Interview Assessment
