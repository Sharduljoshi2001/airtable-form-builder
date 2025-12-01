import { useState } from 'react'
import './App.css'
import FormBuilder from './components/FormBuilder'
import FormViewer from './components/FormViewer'
import ResponsesViewer from './components/ResponsesViewer'
const API_BASE_URL = 'http://localhost:3001'

function App() {
  const [currentView, setCurrentView] = useState('builder')
  const [formConfig, setFormConfig] = useState(null)

  function goToBuilder() {
    setCurrentView('builder')
  }

  function goToViewer() {
    setCurrentView('viewer')
  }

  function goToResponses() {
    setCurrentView('responses')
  }

  // function saveDemoForm() {
  //   const demoForm = {
  //     title: "Demo Form",
  //     questions: [
  //       { id: 'fld1', name: 'Name', type: 'text', required: true, label: 'Full Name' },
  //       { id: 'fld2', name: 'Email', type: 'email', required: true, label: 'Email Address' },
  //       { id: 'fld3', name: 'Role', type: 'select', required: true, label: 'Position', options: ['Developer', 'Designer'] }
  //     ]
  //   }
  //   setFormConfig(demoForm)
  //   alert("Demo form saved! Now you can switch to Preview tab.")
  // }

  function renderFormBuilder(){
    return<FormBuilder onSave={setFormConfig}/>
  }

  // function renderFormPreview() {
  //   if (formConfig === null) {
  //     return (
  //       <div className="no-form-message">
  //         <h3>📋 No Form Created Yet</h3>
  //         <p>Please create a form first using the Build Form tab.</p>
  //         <button onClick={goToBuilder} className="switch-button">
  //           ← Go to Form Builder
  //         </button>
  //       </div>
  //     )
  //   } else {
  //     return (
  //       <div>
  //         <h2>👀 Form Preview</h2>
  //         <p>Preview your dynamic form: <strong>{formConfig.title}</strong></p>
          
  //         <div className="placeholder-content">
  //           <div className="demo-card">
  //             <h3>Form Preview Coming Soon!</h3>
  //             <p>This is where the form preview will be.</p>
  //             <p>Form has fields: {formConfig.questions.map(q => q.label).join(", ")}</p>
  //           </div>
  //         </div>
  //       </div>
  //     )
  //   }
  // }
  function renderFormPreview(){
    if(formConfig===null){
      return <div>No form created yet</div>
    }else{
      return <FormViewer formConfig={formConfig} />
    }  
  }

  function renderResponses(){
    if(formConfig===null || !formConfig._id){
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>📊 Form Responses</h3>
          <p>Please create and save a form first to view responses.</p>
          <button onClick={goToBuilder} style={{ padding: '8px 16px' }}>
            ← Go to Form Builder
          </button>
        </div>
      )
    } else {
      return <ResponsesViewer formId={formConfig._id} formTitle={formConfig.title} />
    }
  }

  function renderCurrentView() {
    switch(currentView) {
      case 'builder':
        return renderFormBuilder()
      case 'viewer':
        return renderFormPreview()
      case 'responses':
        return renderResponses()
      default:
        return renderFormBuilder()
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🚀 Smart Form Builder</h1>
          
          <nav className="tab-navigation">
            <button 
              className={currentView === 'builder' ? 'tab-button active' : 'tab-button'}
              onClick={goToBuilder}
            >
              📝 Build Form
            </button>
            <button 
              className={currentView === 'viewer' ? 'tab-button active' : 'tab-button'}
              onClick={goToViewer}
              disabled={formConfig === null}
            >
              👀 Preview Form
            </button>
            <button 
              className={currentView === 'responses' ? 'tab-button active' : 'tab-button'}
              onClick={goToResponses}
              disabled={formConfig === null || !formConfig._id}
            >
              📊 View Responses
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="viewer-container">
          {renderCurrentView()}
        </div>
      </main>

      <footer className="app-footer">
        <small>
          Current View: <strong>{currentView}</strong> | 
          Form Saved: <strong>{formConfig ? 'Yes' : 'No'}</strong> |
          Database ID: <strong>{formConfig?._id ? formConfig._id : 'Not saved'}</strong>
        </small>
      </footer>
    </div>
  )
}

export default App
