import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null
let model = null

/**
 * Initialize Gemini AI client
 * API key is loaded from environment variable VITE_GEMINI_API_KEY
 * Set this in your .env file (see .env.example)
 * 
 * Note: In production, consider using a backend proxy to protect your API key
 */
export function initializeGemini() {
  // Get API key from environment variable only - no hardcoded values
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  
  // Debug logging
  
  if (!apiKey) {
    console.warn('❌ Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file')
    console.warn('💡 Make sure:')
    console.warn('   1. The .env file is in the portfolio root directory')
    console.warn('   2. The variable name is exactly VITE_GEMINI_API_KEY')
    console.warn('   3. You have restarted the dev server after adding the key')
    return null
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey)
    
    // Use gemini-2.5-flash (free tier model)
    // If this doesn't work, the API key might not have access or needs different model
    const modelName = 'gemini-2.5-flash'
    model = genAI.getGenerativeModel({ model: modelName })
    return model
  } catch (error) {
    console.error('❌ Error initializing Gemini:', error)
    console.error('💡 This might mean:')
    console.error('   1. Your API key doesn\'t have access to this model')
    console.error('   2. The model name has changed')
    console.error('   3. Check available models at https://aistudio.google.com/app/apikey')
    
    // Try fallback to gemini-pro if available
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      return model
    } catch (fallbackError) {
      console.error('❌ Fallback model also failed:', fallbackError.message)
      return null
    }
  }
}

/**
 * Get the Gemini model instance
 */
export function getGeminiModel() {
  if (!model) {
    return initializeGemini()
  }
  return model
}

/**
 * Check if Gemini is available
 * Returns true only if API key is set in environment variable
 */
export function isGeminiAvailable() {
  // Check environment variable only - no hardcoded fallback
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  const hasKey = !!apiKey
  const hasModel = !!getGeminiModel()
  
  
  return hasKey && hasModel
}

/**
 * Generate answer using Gemini AI
 */
export async function generateAnswerWithGemini(resumeText, query) {
  const geminiModel = getGeminiModel()
  
  if (!geminiModel) {
    throw new Error('Gemini AI is not available. Please configure your API key.')
  }
  
  const prompt = `You are Deepak's AI assistant. Answer questions about Deepak Kumar CH based ONLY on the knowledge base provided below.

IMPORTANT INSTRUCTIONS:
1. Answer questions using ONLY the information from the resume sections below
2. Be concise and direct - stick to the answer without unnecessary details or explanations
3. If asked about a company or role, provide only the relevant information from that role
4. If the information is not in the provided sections, simply say "I don't have that specific information available."
5. **CRITICAL: Keep responses brief and to the point. Aim for 50-150 words unless the question specifically requires more detail.**
6. Avoid verbose introductions, conclusions, or explanations - just answer the question directly
7. Use markdown formatting sparingly:
   - Use **bold** only for key points
   - Use bullet points (-) for lists when needed
   - Use \`code\` formatting for technology names or tools
   - Avoid unnecessary headings or sections

RELEVANT RESUME SECTIONS:
${resumeText}

USER QUESTION: ${query}

Provide a concise, direct answer based on the resume sections above. Stick to the facts and avoid unnecessary details.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    return text
  } catch (error) {
    console.error('❌ Error generating answer with Gemini:', error)
    console.error('Error details:', {
      message: error.message,
      name: error.name
    })
    
    // If it's a model not found error, try to reinitialize with a different model
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      // Reset the model to try a different one
      model = null
      genAI = null
      const newModel = initializeGemini()
      if (newModel) {
        // Retry once
        try {
          const result = await newModel.generateContent(prompt)
          const response = await result.response
          return response.text()
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError.message)
        }
      }
    }
    
    // Provide more helpful error messages
    if (error.message?.includes('API_KEY') || error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Invalid or unauthorized API key. Please check your VITE_GEMINI_API_KEY in .env file.')
    } else if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
      throw new Error('API quota exceeded. Please check your Google Cloud Console.')
    } else if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error('Model not found. Please check that your API key has access to Gemini models. Visit https://aistudio.google.com/app/apikey to verify.')
    } else {
      throw new Error(`Failed to generate answer: ${error.message || 'Unknown error'}`)
    }
  }
}

