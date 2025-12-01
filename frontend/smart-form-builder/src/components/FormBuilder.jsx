import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://airtable-form-builder-80kh.onrender.com';

export default function FormBuilder({ onSave }) {
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [formTitle, setFormTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  useEffect(() => {
    fetchAirtableFields();
  }, []);

  async function fetchAirtableFields() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching Airtable fields...');
      
      const response = await fetch(`${API_BASE_URL}/auth/table-fields`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Fields loaded successfully:', data);
        setAvailableFields(data.availableFields || []);
        setTableInfo(data.table);
        setLoading(false);
      } else {
        throw new Error(data.error || 'Failed to load fields');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch fields:', error);
      setError(error.message);
      setLoading(false);
      
      setAvailableFields([
        { id: "fld1", name: "Name", type: "singleLineText", required: true },
        { id: "fld2", name: "Email", type: "email", required: true },
        { id: "fld3", name: "Role", type: "singleSelect", options: ["Developer", "Designer"], required: true },
        { id: "fld4", name: "GitHub URL", type: "url", required: false },
      ]);
    }
  }

  function handleFieldSelect(field) {
    const isAlreadySelected = selectedFields.find(f => f.id === field.id);
    
    if (isAlreadySelected) {
      const newSelectedFields = selectedFields.filter(f => f.id !== field.id);
      setSelectedFields(newSelectedFields);
    } else {
      const newSelectedFields = [...selectedFields, field];
      setSelectedFields(newSelectedFields);
    }
  }

  async function handleSaveForm() {
    try {
      console.log('💾 Saving form to database...');
      
      // Validate form data before sending
      if (!formTitle.trim()) {
        alert('Please enter a form title');
        return;
      }
      
      if (selectedFields.length === 0) {
        alert('Please select at least one field');
        return;
      }
      
      const formData = {
        title: formTitle,
        airtableBaseId: 'appYuE7c5VAKijBI8',
        airtableTableId: tableInfo?.id || 'tblDefault',
        airtableTableName: tableInfo?.name || 'Table 1',
        questions: selectedFields.map((field, index) => ({
          questionKey: `q_${index + 1}`,
          airtableFieldId: field.id,
          label: field.name,
          type: field.type,
          required: field.required || false,
          options: field.options || [],
          conditionalRules: null
        }))
      };
      
      console.log('Form data being saved:', formData);
      console.log('API endpoint:', `${API_BASE_URL}/forms`);
      
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (response.ok) {
        console.log('✅ Form saved successfully:', result.form._id);
        
        const formConfig = {
          _id: result.form._id,
          title: formTitle,
          questions: selectedFields,
          tableInfo: tableInfo,
          savedToDatabase: true
        };
        
        onSave(formConfig);
        alert("🎉 Form saved to database successfully! You can now preview and share it.");
      } else {
        throw new Error(result.error || 'Failed to save form');
      }
      
    } catch (error) {
      console.error('❌ Failed to save form:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      alert(`Failed to save form: ${error.message}`);
    }
  }

  function canSaveForm() {
    return formTitle.trim() !== '' && selectedFields.length > 0;
  }

  if (loading) {
    return (
      <div className="form-builder" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📝 Create Your Form</h2>
        <p>🔄 Loading Airtable fields...</p>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Fetching real fields from your Airtable base...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-builder" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📝 Create Your Form</h2>
        <div style={{ color: 'red', marginBottom: '20px' }}>
          ❌ Error loading fields: {error}
        </div>
        <button onClick={fetchAirtableFields} style={{ padding: '8px 16px' }}>
          🔄 Retry
        </button>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Using fallback demo fields for now...
        </div>
      </div>
    );
  }

  return (
    <div className="form-builder">
      <h2>📝 Create Your Form</h2>
      
      <div style={{ 
        backgroundColor: '#d4edda', 
        color: '#155724', 
        padding: '10px', 
        borderRadius: '4px', 
        marginBottom: '20px',
        border: '1px solid #c3e6cb'
      }}>
        ✅ Connected to Airtable Table: <strong>{tableInfo?.name}</strong>
        <br />
        <small>Found {availableFields.length} available fields</small>
      </div>
      
      <div>
        <label>Form Title:</label>
        <input
          type="text"
          placeholder="Enter form title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          style={{ width: '300px', padding: '8px', margin: '10px' }}
        />
      </div>

      <div>
        <h3>📋 Available Airtable Fields:</h3>
        <p>Select the fields you want to include in your form (real fields from your Airtable base):</p>
        
        {availableFields.map(field => {
          const isSelected = selectedFields.find(f => f.id === field.id);
          
          const unsupportedTypes = ['singleCollaborator', 'multipleCollaborators', 'multipleAttachments', 'aiText'];
          const isUnsupported = unsupportedTypes.includes(field.type);
          
          return (
            <div key={field.id} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              border: '1px solid #ddd',
              backgroundColor: isUnsupported ? '#f8f8f8' : 'white',
              opacity: isUnsupported ? 0.6 : 1
            }}>
              <label>
                <input
                  type="checkbox"
                  checked={isSelected ? true : false}
                  onChange={() => handleFieldSelect(field)}
                  disabled={isUnsupported}
                />
                <strong> {field.name}</strong> ({field.type})
                {field.required && <span style={{ color: 'red' }}> *</span>}
                {isUnsupported && <span style={{ color: '#ff6600', fontSize: '12px' }}> (Not supported in forms)</span>}
              </label>
              
              {field.options && (
                <div style={{ fontSize: '12px', color: '#666', marginLeft: '20px' }}>
                  Options: {field.options.join(', ')}
                </div>
              )}
              
              {isUnsupported && (
                <div style={{ fontSize: '11px', color: '#666', marginLeft: '20px', fontStyle: 'italic' }}>
                  {field.type === 'singleCollaborator' && 'Collaborator fields require user IDs, not text'}
                  {field.type === 'multipleAttachments' && 'File uploads not supported in this demo'}
                  {field.type === 'aiText' && 'AI-generated fields are read-only'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>✅ Selected Fields ({selectedFields.length}):</h3>
        {selectedFields.length === 0 ? (
          <p style={{ color: '#666' }}>No fields selected yet</p>
        ) : (
          <ul>
            {selectedFields.map(field => (
              <li key={field.id}>{field.name} ({field.type})</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>📝 Form Preview:</h3>
        <p><strong>Title:</strong> {formTitle || 'No title entered'}</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={handleSaveForm}
          disabled={!canSaveForm()}
          style={{
            padding: '12px 24px',
            backgroundColor: canSaveForm() ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canSaveForm() ? 'pointer' : 'not-allowed'
          }}
        >
          💾 Save Form Configuration
        </button>
        
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          {!canSaveForm() && (
            <span>
              {!formTitle.trim() && 'Please enter a form title | '}
              {selectedFields.length === 0 && 'Please select at least one field'}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#f8f9fa', fontSize: '12px' }}>
        <strong>Debug Info:</strong>
        <br />
        Form Title: {formTitle}
        <br />
        Selected Fields: {selectedFields.length}
        <br />
        Can Save: {canSaveForm() ? 'Yes' : 'No'}
      </div>
    </div>
  );
}
