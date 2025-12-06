/**
 * JSON Validator Utility
 * Validates JSON files to ensure they follow the required structure
 */

/**
 * Validate JSON structure
 * @param {string} jsonString - The JSON string to validate
 * @returns {Object} - { valid: boolean, error: string|null, data: Object|null }
 */
export function validateKnowledgeFile(jsonString) {
  try {
    // Parse JSON to check syntax
    const data = JSON.parse(jsonString)

    // Check if it's an object (not array or primitive)
    if (typeof data !== 'object' || data === null) {
      return {
        valid: false,
        error: 'JSON must be an object (not an array or primitive value)',
        data: null
      }
    }

    // Check if it's an array (which is also an object in JS)
    if (Array.isArray(data)) {
      return {
        valid: false,
        error: 'JSON must be an object with sections, not an array',
        data: null
      }
    }

    // Check if object is empty
    if (Object.keys(data).length === 0) {
      return {
        valid: false,
        error: 'JSON object cannot be empty. It must contain at least one section.',
        data: null
      }
    }

    // Structure is valid - nested sections format
    return {
      valid: true,
      error: null,
      data: data
    }
  } catch (error) {
    // JSON parsing error
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        error: `Invalid JSON syntax: ${error.message}`,
        data: null
      }
    }
    
    // Other errors
    return {
      valid: false,
      error: `Error validating JSON: ${error.message}`,
      data: null
    }
  }
}

/**
 * Validate JSON file from buffer or string
 * @param {Buffer|string} fileContent - File content to validate
 * @returns {Object} - { valid: boolean, error: string|null, data: Object|null }
 */
export function validateKnowledgeFileFromBuffer(fileContent) {
  try {
    const jsonString = typeof fileContent === 'string' 
      ? fileContent 
      : fileContent.toString('utf8')
    
    return validateKnowledgeFile(jsonString)
  } catch (error) {
    return {
      valid: false,
      error: `Error reading file: ${error.message}`,
      data: null
    }
  }
}

