# 🚀 Smart Form Builder - Frontend

A modern React-based frontend for building dynamic forms connected to Airtable. This project allows users to create, preview, and manage forms that automatically sync with their Airtable databases.

## ✨ Features

- **Dynamic Form Creation**: Build forms using real fields from your Airtable base
- **Live Preview**: See your form in action before publishing
- **Real-time Sync**: Form submissions automatically save to Airtable
- **Response Management**: View and manage form responses
- **Modern UI**: Clean, responsive design built with React

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast development and build tool
- **CSS3** - Custom styling for responsive design
- **Airtable API** - Direct integration with Airtable databases

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- An Airtable account with a base setup

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file and add your backend URL:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── FormBuilder.jsx     # Create and configure forms
│   ├── FormViewer.jsx      # Display and fill forms
│   └── ResponsesViewer.jsx # View form responses
├── App.jsx                 # Main application component
├── App.css                 # Global styles
└── main.jsx               # Application entry point
```

## 🎯 Component Overview

### FormBuilder
- Connects to your Airtable base
- Displays available fields from your table
- Allows selection of fields for your form
- Handles form configuration and saving

### FormViewer
- Renders the form for users to fill out
- Supports various field types (text, email, select, etc.)
- Handles form submission to Airtable
- Shows success/error messages

### ResponsesViewer
- Displays all form submissions
- Shows response data and timestamps
- Provides refresh functionality

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |

## 🎨 Customization

The application uses inline styles for simplicity. To customize:

1. **Colors**: Update color values in component styles
2. **Layout**: Modify padding, margins, and spacing
3. **Typography**: Change font sizes and weights

## 📦 Building for Production

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **The build files will be in the `dist` folder**

3. **Deploy to your preferred hosting service:**
   - Vercel (recommended)
   - Netlify
   - AWS S3
   - Any static hosting service

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Check your `VITE_API_URL` environment variable
   - Ensure backend server is running
   - Verify CORS settings

2. **Airtable connection issues**
   - Verify your Airtable Personal Access Token
   - Check base and table IDs
   - Ensure proper API permissions

3. **Build errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Related

- [Backend Repository](../../../backend/)
- [Airtable API Documentation](https://airtable.com/developers/web/api)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
