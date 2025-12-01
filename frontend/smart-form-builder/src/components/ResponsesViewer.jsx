import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://airtable-form-builder-80kh.onrender.com';

export default function ResponsesViewer({ formId, formTitle }) {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (formId) {
            fetchResponses();
        }
    }, [formId]);
    
    async function fetchResponses() {
        setLoading(true);
        setError(null);
        
        try {
            console.log('📊 Fetching responses for form:', formId);
            
            const response = await fetch(`${API_BASE_URL}/forms/${formId}/responses`);
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Responses loaded:', data.responses.length);
                setResponses(data.responses);
            } else {
                throw new Error(data.error || 'Failed to fetch responses');
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch responses:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }
    
    function formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }
    
    function getAnswersPreview(answers) {
        if (!answers || typeof answers !== 'object') return 'No data';
        
        const entries = Object.entries(answers).slice(0, 3);
        return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
    }
    
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <h3>📊 Form Responses</h3>
                <p>🔄 Loading responses...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <h3>📊 Form Responses</h3>
                <div style={{ color: 'red', marginBottom: '20px' }}>
                    ❌ Error: {error}
                </div>
                <button onClick={fetchResponses} style={{ padding: '8px 16px' }}>
                    🔄 Retry
                </button>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2>📊 Form Responses</h2>
                <p style={{ color: '#666' }}>
                    Responses for: <strong>{formTitle}</strong>
                </p>
                <p style={{ color: '#666' }}>
                    Total responses: <strong>{responses.length}</strong>
                </p>
            </div>
            
            {responses.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                }}>
                    <p>📝 No responses yet</p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Responses will appear here once people submit the form.
                    </p>
                </div>
            ) : (
                <div>
                    {responses.map((response, index) => (
                        <div key={response._id} style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            padding: '15px',
                            marginBottom: '15px',
                            backgroundColor: response.deletedInAirtable ? '#fff5f5' : 'white'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <strong>Response #{responses.length - index}</strong>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {formatDate(response.createdAt)}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '10px' }}>
                                <strong>Answers:</strong>
                                <div style={{ 
                                    fontSize: '14px', 
                                    color: '#666', 
                                    marginTop: '5px',
                                    padding: '8px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '3px',
                                    fontFamily: 'monospace'
                                }}>
                                    {getAnswersPreview(response.answers)}
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '15px', 
                                fontSize: '12px',
                                color: '#666'
                            }}>
                                <span>
                                    <strong>Status:</strong> 
                                    <span style={{ 
                                        color: response.status === 'synced' ? '#28a745' : 
                                              response.status === 'error' ? '#dc3545' : '#6c757d'
                                    }}>
                                        {response.status}
                                    </span>
                                </span>
                                <span>
                                    <strong>Airtable ID:</strong> {response.airtableRecordId}
                                </span>
                                {response.deletedInAirtable && (
                                    <span style={{ color: '#dc3545' }}>
                                        <strong>⚠️ Deleted in Airtable</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button 
                    onClick={fetchResponses}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Refresh Responses
                </button>
            </div>
        </div>
    );
}
