import { generateAnswerWithGemini, isGeminiAvailable, initializeGemini } from './geminiClient.js'
import { portfolioAPI } from './auth.js'

let knowledgeBase = null
let knowledgeText = null
let isProcessing = false

// Initialize Gemini on module load
initializeGemini()

/**
 * Merge multiple JSON objects into one
 * Handles conflicts by combining arrays and merging objects
 */
function mergeKnowledgeFiles(files) {
  const merged = {}
  
  files.forEach(({ data }) => {
    Object.keys(data).forEach(section => {
      if (merged[section]) {
        // If both are arrays, combine them
        if (Array.isArray(merged[section]) && Array.isArray(data[section])) {
          merged[section] = [...merged[section], ...data[section]]
        }
        // If both are objects, merge them
        else if (typeof merged[section] === 'object' && typeof data[section] === 'object' && 
                 !Array.isArray(merged[section]) && !Array.isArray(data[section])) {
          merged[section] = { ...merged[section], ...data[section] }
        }
        // Otherwise, replace with new value
        else {
          merged[section] = data[section]
        }
      } else {
        merged[section] = data[section]
      }
    })
  })
  
  return merged
}

/**
 * Convert JSON knowledge base to text format for Gemini
 */
function convertKnowledgeToText(knowledgeBase) {
  let text = ''
  
  Object.keys(knowledgeBase).forEach(section => {
    const content = knowledgeBase[section]
    text += `${section.toUpperCase()}\n`
    
    if (typeof content === 'string') {
      text += content + '\n\n'
    } else if (Array.isArray(content)) {
      content.forEach((item, index) => {
        if (typeof item === 'string') {
          text += `- ${item}\n`
        } else if (typeof item === 'object') {
          text += JSON.stringify(item, null, 2) + '\n'
        }
      })
      text += '\n'
    } else if (typeof content === 'object') {
      text += JSON.stringify(content, null, 2) + '\n\n'
    }
  })
  
  return text
}

/**
 * Load all knowledge files from the server
 */
async function loadAllKnowledgeFiles() {
  try {
    const response = await portfolioAPI.getKnowledgeFiles()
    const files = response.files || []
    
    if (files.length === 0) {
      console.warn('⚠️ No knowledge files found. Chatbot will work with limited information.')
      console.warn('💡 Upload JSON knowledge files through the admin panel for better responses.')
      // Return empty knowledge base instead of throwing error
      return { merged: {}, text: '' }
    }
    
    // Load all file contents
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const fileData = await portfolioAPI.getKnowledgeFile(file.filename)
        return fileData
      })
    )
    
    // Merge all files
    const merged = mergeKnowledgeFiles(fileContents)
    
    // Convert to text
    const text = convertKnowledgeToText(merged)
    
    return { merged, text }
  } catch (error) {
    console.error('Error loading knowledge files:', error)
    // Return empty knowledge base instead of throwing error
    // This allows the chatbot to still work, just with limited information
    return { merged: {}, text: '' }
  }
}

/**
 * Initialize chatbot by loading all knowledge files
 */
export async function initializeChatbot() {
  if (isProcessing) return
  if (knowledgeBase) return knowledgeBase
  
  isProcessing = true
  try {
    const { merged, text } = await loadAllKnowledgeFiles()
    knowledgeBase = merged
    knowledgeText = text
    isProcessing = false
    return knowledgeBase
  } catch (error) {
    isProcessing = false
    console.error('Error initializing chatbot:', error)
    throw error
  }
}

/**
 * Reload knowledge data (useful when files are updated)
 */
export async function reloadResume() {
  knowledgeBase = null
  knowledgeText = null
  return await initializeChatbot()
}

/**
 * Extract relevant sections from knowledge base based on query
 * Enhanced with better keyword matching and question variations
 */
function extractRelevantSections(query, knowledgeBase, fullText) {
  const queryLower = query.toLowerCase().trim()
  const sections = {}
  
  // Get all available sections from knowledge base
  const availableSections = Object.keys(knowledgeBase)
  
  // Always include summary or first section for context
  if (knowledgeBase.summary) {
    sections.summary = `SUMMARY\n${typeof knowledgeBase.summary === 'string' ? knowledgeBase.summary : JSON.stringify(knowledgeBase.summary, null, 2)}\n`
  } else if (availableSections.length > 0) {
    const firstSection = availableSections[0]
    sections[firstSection] = `${firstSection.toUpperCase()}\n${typeof knowledgeBase[firstSection] === 'string' ? knowledgeBase[firstSection] : JSON.stringify(knowledgeBase[firstSection], null, 2)}\n`
  }
  
  // Normalize query - remove common question words and punctuation
  const normalizedQuery = queryLower
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(what|where|when|who|how|why|tell|me|about|your|you|have|did|do|does|can|could|would|will|is|are|was|were)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2)
  
  // Comprehensive keyword sets for common section types
  const sectionKeywords = {
    skills: ['skill', 'technology', 'tech', 'language', 'framework', 'tool', 'stack', 'proficient', 'expertise', 'competent', 'know', 'familiar', 'experienced', 'programming', 'coding'],
    experience: ['experience', 'work', 'job', 'company', 'employer', 'role', 'position', 'career', 'worked', 'working', 'develop', 'developed', 'built', 'implemented', 'created', 'designed', 'engineered', 'contributed', 'project', 'projects', 'team', 'collaborate'],
    education: ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd', 'doctorate', 'study', 'studied', 'graduate', 'graduated', 'institute', 'institution', 'school', 'academic', 'qualification', 'certification', 'course'],
    achievements: ['achievement', 'award', 'recognition', 'honor', 'accomplishment', 'milestone', 'rank', 'ranking', 'ranked', 'solved', 'problem', 'competitive', 'contest', 'awarded', 'received', 'won', 'winner', 'top', 'best'],
    contact: ['contact', 'github', 'git', 'leetcode', 'profile', 'portfolio', 'link', 'social', 'connect', 'reach', 'email', 'linkedin', 'twitter', 'website', 'url']
  }
  
  // Match query against available sections
  availableSections.forEach(sectionName => {
    const sectionLower = sectionName.toLowerCase()
    
    // Check if section name matches query
    if (queryLower.includes(sectionLower) || sectionLower.includes(queryLower)) {
      const content = knowledgeBase[sectionName]
      sections[sectionName] = `${sectionName.toUpperCase()}\n${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}\n`
      return
    }
    
    // Check if query matches keywords for this section type
    Object.keys(sectionKeywords).forEach(sectionType => {
      if (sectionLower.includes(sectionType) || sectionType.includes(sectionLower)) {
        const hasMatch = queryWords.some(w => 
          sectionKeywords[sectionType].some(keyword => 
            w.includes(keyword) || keyword.includes(w) || queryLower.includes(keyword)
          )
        )
        
        if (hasMatch) {
          const content = knowledgeBase[sectionName]
          sections[sectionName] = `${sectionName.toUpperCase()}\n${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}\n`
        }
      }
    })
  })
  
  // Handle general questions
  const generalQuestionPatterns = [
    /^(tell|describe|explain|share|give).*(about|yourself|you|your)/i,
    /^(what|who|where).*(do|are|is|was)/i,
    /^(can|could|would).*(tell|share|explain)/i,
    /^introduce/i,
    /^summary/i
  ]
  
  const isGeneralQuestion = generalQuestionPatterns.some(pattern => pattern.test(queryLower))
  
  // If no specific section matched or it's a general question, include more sections
  const hasSpecificSection = Object.keys(sections).length > 1
  
  if (!hasSpecificSection || isGeneralQuestion) {
    // Include first few sections for context
    availableSections.slice(0, 3).forEach(sectionName => {
      if (!sections[sectionName]) {
        const content = knowledgeBase[sectionName]
        sections[sectionName] = `${sectionName.toUpperCase()}\n${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}\n`
      }
    })
  }
  
  // Combine relevant sections
  const relevantSections = Object.values(sections).filter(section => section !== null).join('\n\n')
  
  // Fallback to full text if we have very little content
  if (relevantSections.length < 200 && !hasSpecificSection) {
    return fullText
  }
  
  return relevantSections || fullText
}

/**
 * Generate answer based on query using Gemini AI
 */
export async function generateAnswer(query) {
  if (!knowledgeBase || knowledgeText === null) {
    try {
      await initializeChatbot()
    } catch (error) {
      return "I'm still loading my knowledge base. Please try again in a moment."
    }
  }
  
  // Log for debugging
  
  // Check if we have any knowledge base content
  const hasKnowledgeBase = knowledgeText && knowledgeText.length > 0
  
  // Extract only relevant sections if we have knowledge base
  const relevantContent = hasKnowledgeBase 
    ? extractRelevantSections(query, knowledgeBase, knowledgeText)
    : 'No knowledge files have been uploaded yet. Please upload JSON knowledge files through the admin panel for better responses.'
  
  if (hasKnowledgeBase) {
  }
  
  
  // Check if Gemini is available
  if (isGeminiAvailable()) {
    try {
      // Use Gemini AI to generate answer with only relevant sections
      const answer = await generateAnswerWithGemini(relevantContent, query)
      return answer
    } catch (error) {
      console.error('Error with Gemini AI:', error)
      // Return proper error message instead of fallback
      return getErrorMessage(error)
    }
  } else {
    // If no knowledge base and no Gemini, provide helpful message
    if (!hasKnowledgeBase) {
      return `⚠️ **Limited Information Available**

I don't have any knowledge files loaded yet. To get better answers:

1. **Upload knowledge files** through the admin panel (JSON format)
2. **Configure Gemini API** for AI-powered responses (set \`VITE_GEMINI_API_KEY\` in .env)

For now, I can only provide basic information from the portfolio data.`
    }
    // Return error message when Gemini is not configured
    return getErrorMessage(new Error('Gemini API key not configured'))
  }
}

/**
 * Get user-friendly error message based on the error
 */
function getErrorMessage(error) {
  const errorMessage = error?.message || 'Unknown error'
  
  // API key not configured
  if (errorMessage.includes('not configured') || errorMessage.includes('API key not found')) {
    return `⚠️ **Gemini AI is not configured**

I need the Gemini API key to answer questions about the resume.

**To fix this:**
1. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a \`.env\` file in the portfolio root directory
3. Add: \`VITE_GEMINI_API_KEY=your_api_key_here\`
4. Restart the dev server

See \`GEMINI_SETUP.md\` for detailed instructions.`
  }
  
  // Invalid API key
  if (errorMessage.includes('Invalid') || errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return `❌ **Invalid API Key**

The Gemini API key in your \`.env\` file is invalid or unauthorized.

**To fix this:**
1. Verify your API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Make sure the key is active and has access to Gemini models
3. Update your \`.env\` file with the correct key
4. Restart the dev server`
  }
  
  // Model not found
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return `❌ **Model Not Available**

The Gemini model is not accessible with your API key.

**To fix this:**
1. Check your API key permissions at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Make sure your API key has access to Gemini models
3. Try creating a new API key if the issue persists
4. Check the browser console for more details`
  }
  
  // Quota exceeded
  if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
    return `⚠️ **API Quota Exceeded**

You've reached the rate limit for the Gemini API.

**To fix this:**
1. Wait a few minutes and try again
2. Check your quota at [Google Cloud Console](https://console.cloud.google.com/)
3. The free tier allows 60 requests per minute and 1,500 per day`
  }
  
  // Generic error
  return `❌ **Unable to Generate Answer**

I encountered an error while trying to answer your question.

**Error:** ${errorMessage}

**Possible solutions:**
1. Check that your Gemini API key is correctly configured in \`.env\`
2. Verify your API key is active at [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Check the browser console for more detailed error information
4. Try reloading the resume data using the reload button (🔄)`
}

