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

function getVisibleQuestions(questions, answers) {
  return questions.filter(question => {
    return shouldShowQuestion(question.conditionalRules, answers);
  });
}

function validateCondition(condition) {
  if (!condition || typeof condition !== 'object') return false;
  
  const { questionKey, operator, value } = condition;
  
  if (!questionKey || typeof questionKey !== 'string') return false;
  if (!operator || !['equals', 'notEquals', 'contains'].includes(operator)) return false;
  if (value === undefined || value === null) return false;
  
  return true;
}

function validateConditionalRules(rules) {
  if (!rules) return true;
  
  if (typeof rules !== 'object') return false;
  
  const { logic, conditions } = rules;
  
  if (!logic || !['AND', 'OR'].includes(logic)) return false;
  
  if (!Array.isArray(conditions) || conditions.length === 0) return false;
  
  return conditions.every(validateCondition);
}

module.exports = {
  shouldShowQuestion,
  getVisibleQuestions,
  validateCondition,
  validateConditionalRules
};
