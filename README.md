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
   git clone <your-repo-url>
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

## 🔧 Airtable Setup Guide

### Method 1: Personal Access Token (Recommended for Development)

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

## 📊 Data Models

### Form Schema
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

## 🧠 Conditional Logic

The app supports dynamic form logic using a pure function:

```javascript
function shouldShowQuestion(rules, answersSoFar) {
  // Returns boolean based on conditional rules
  // Supports AND/OR logic with multiple conditions
  // Handles missing values gracefully
}
```

**Example Rules:**
```javascript
{
  logic: "AND",
  conditions: [
    { questionKey: "role", operator: "equals", value: "Developer" },
    { questionKey: "experience", operator: "contains", value: "React" }
  ]
}
```

## 🎣 Webhook Configuration

### Setup Airtable Webhook

1. **Create Webhook:**
   ```bash
   curl -X POST https://api.airtable.com/v0/bases/YOUR_BASE_ID/webhooks \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "notificationUrl": "YOUR_WEBHOOK_URL/webhooks/airtable",
       "specification": {
         "options": {
           "filters": {
             "dataTypes": ["tableData"]
           }
         }
       }
     }'
   ```

2. **For Local Development:**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3001
   
   # Use the ngrok URL for webhook
   # Example: https://abc123.ngrok.io/webhooks/airtable
   ```

### Webhook Events Handled
- **Record Updated:** Updates local database record
- **Record Deleted:** Marks record as `deletedInAirtable: true`
- **Record Created:** Logs new external records

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

## 🧪 Testing

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

**Demo:** [Your deployed app URL]  
**Repository:** [Your GitHub repo URL]
