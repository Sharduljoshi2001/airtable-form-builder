import {useState, useEffect} from 'react'

const API_BASE_URL = 'http://localhost:3001';

// Conditional logic utility function (client-side)
function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }
  
  const { logic, conditions } = rules;
  const conditionResults = [];
  
  for (const condition of conditions) {
    const { questionKey, operator, value } = condition;
    const userAnswer = answersSoFar[questionKey];
    
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
          conditionMet = userAnswer.includes(value);
        } else if (typeof userAnswer === 'string') {
          conditionMet = userAnswer.toLowerCase().includes(value.toLowerCase());
        } else {
          conditionMet = false;
        }
        break;
      default:
        conditionMet = false;
    }
    
    conditionResults.push(conditionMet);
  }
  
  if (logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (logic === 'OR') {
    return conditionResults.some(result => result === true);
  }
  
  return false;
}

export default function FormViewer({formConfig}){
    // State variables - component ki memory
    const [answers, setAnswers]= useState({}) // user ke responses store karte hain
    const [isSubmitting, setIsSubmitting] = useState(false) // submit ho raha hai ya nahi
    const [submitted, setSubmitted] = useState(false) // submit ho gaya ya nahi
    const [submitError, setSubmitError] = useState(null) // submit error
    const [visibleQuestions, setVisibleQuestions] = useState([]) // conditionally visible questions

    // Update visible questions when answers change
    useEffect(() => {
      if (formConfig && formConfig.questions) {
        const visible = formConfig.questions.filter(question => {
          return shouldShowQuestion(question.conditionalRules, answers);
        });
        setVisibleQuestions(visible);
      }
    }, [answers, formConfig]);

    // User ka input handle karne ka function
    function handleAnswerChange(questionKey, value) {
        // Purane answers ko copy karo aur naya answer add karo
        const newAnswers = {
            ...answers,
            [questionKey]: value
        }
        setAnswers(newAnswers)
        
        // Clear any previous error
        setSubmitError(null)
    }

    // Form submit karne ka function  
    async function handleSubmit(event) {
        event.preventDefault() // Page reload nahi karne denge
        setIsSubmitting(true) // Loading state start karo
        setSubmitError(null) // Clear previous errors
        
        try {
            console.log('📝 Submitting form to database and Airtable...');
            
            // Convert answers to question key format for backend
            const formattedAnswers = {};
            visibleQuestions.forEach((question, index) => {
                const questionKey = `q_${index + 1}`;
                const fieldValue = answers[question.id];
                if (fieldValue !== undefined && fieldValue !== '') {
                    formattedAnswers[questionKey] = fieldValue;
                }
            });
            
            console.log('Formatted answers for submission:', formattedAnswers);
            
            // Submit to our new backend API
            const formId = formConfig._id || 'temp-form-id';
            const response = await fetch(`${API_BASE_URL}/forms/${formId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: formattedAnswers
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Form submitted successfully:', result);
                setIsSubmitting(false);
                setSubmitted(true);
                
                // 3 seconds baad form reset kar do
                setTimeout(() => {
                    setSubmitted(false);
                    setAnswers({});
                }, 3000);
            } else {
                throw new Error(result.error || 'Form submission failed');
            }
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            setIsSubmitting(false);
            setSubmitError(error.message);
        }
    }

    // Har field type ke liye alag input banane ka function
    function renderFormField(question) {
        // Current field ka value nikalo
        const currentValue = answers[question.id] || ''
        
        // Check if field type is unsupported
        const unsupportedTypes = ['singleCollaborator', 'multipleCollaborators', 'multipleAttachments', 'aiText'];
        if (unsupportedTypes.includes(question.type)) {
            return (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    color: '#6c757d'
                }}>
                    <em>This field type ({question.type}) is not supported in forms</em>
                </div>
            );
        }
        
        // Field type ke basis pe different input return karo
        if (question.type === 'singleLineText') {
            // Simple text input
            return (
                <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={`Enter ${question.label || question.name}`}
                    required={question.required}
                    style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                />
            )
        } else if (question.type === 'multilineText') {
            // Textarea for multiline text
            return (
                <textarea
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={`Enter ${question.label || question.name}`}
                    required={question.required}
                    rows={3}
                    style={{ width: '100%', padding: '8px', fontSize: '16px', resize: 'vertical' }}
                />
            )
        } else if (question.type === 'email') {
            // Email input
            return (
                <input
                    type="email"
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="example@email.com"
                    required={question.required}
                    style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                />
            )
        } else if (question.type === 'singleSelect') {
            // Dropdown select
            return (
                <select
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                >
                    <option value="">Select an option...</option>
                    {question.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            )
        } else if (question.type === 'url') {
            // URL input
            return (
                <input
                    type="url"
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="https://example.com"
                    required={question.required}
                    style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                />
            )
        } else {
            // Default case - simple text input
            return (
                <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={`Enter ${question.label || question.name}`}
                    style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                />
            )
        }
    }

    // Form submit ho gaya toh success message show karo
    if (submitted) {
        return (
            <div className="form-viewer" style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ color: 'green' }}>✅ Success!</h2>
                <p>🎉 Form successfully submitted to Airtable!</p>
                <div style={{ 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    margin: '20px 0',
                    border: '1px solid #c3e6cb'
                }}>
                    Your response has been saved to table: <strong>{formConfig.tableInfo?.name}</strong>
                </div>
                <p style={{ fontSize: '14px', color: '#666' }}>
                    3 seconds mein form reset ho jayega...
                </p>
            </div>
        )
    }

    return(
        <div className='form-viewer' style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {/* Form title */}
            <h2 style={{ marginBottom: '20px' }}>📋 {formConfig.title}</h2>
            
            {/* Connection info */}
            <div style={{ 
                backgroundColor: '#d1ecf1', 
                color: '#0c5460', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '20px',
                border: '1px solid #bee5eb',
                fontSize: '14px'
            }}>
                🔗 Connected to Airtable Table: <strong>{formConfig.tableInfo?.name}</strong>
                <br />
                Your responses will be saved directly to Airtable!
            </div>
            
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Please fill out all the required fields below:
            </p>

            {/* Show error if submission failed */}
            {submitError && (
                <div style={{ 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    ❌ Submission Error: {submitError}
                    <br />
                    <small>Please check your data and try again.</small>
                </div>
            )}

            {/* Form start karo */}
            <form onSubmit={handleSubmit}>
                {/* Only show visible questions based on conditional logic */}
                {visibleQuestions.map((question, index) => {
                    const questionKey = `q_${index + 1}`;
                    
                    return (
                        <div key={question.id} style={{ marginBottom: '20px' }}>
                            {/* Field label */}
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {question.label || question.name}
                                {question.required && <span style={{ color: 'red' }}> *</span>}
                                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                                    {' '}(saves to: {question.name})
                                </span>
                            </label>

                            {/* Dynamic field render karo */}
                            {renderFormField(question)}
                            
                            {/* Show conditional info if rules exist */}
                            {question.conditionalRules && (
                                <div style={{ fontSize: '11px', color: '#007bff', fontStyle: 'italic', marginTop: '4px' }}>
                                    ℹ️ Conditional field: Shows based on other answers
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Submit button */}
                <div style={{ marginTop: '30px' }}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '15px',
                            fontSize: '18px',
                            backgroundColor: isSubmitting ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? '⏳ Submitting to Airtable...' : '🚀 Submit to Airtable'}
                    </button>
                </div>
            </form>

            {/* Debug section - development ke liye helpful */}
            <div style={{ 
                marginTop: '30px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <strong>Debug Info (Current Answers):</strong>
                <pre style={{ marginTop: '10px', fontSize: '11px' }}>
                    {JSON.stringify(answers, null, 2)}
                </pre>
            </div>
        </div>
    )
}