import express from 'express'
import { normalize } from 'path'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { authenticateToken } from '../middleware/auth.js'
import { validateKnowledgeFileFromBuffer } from '../utils/jsonValidator.js'
import { generateResumePDF } from '../utils/generateResumePDF.js'
import { storage } from '../utils/storage.js'

const router = express.Router()

// File paths (relative to data directory for local, full paths for blob)
const KNOWLEDGE_DIR = 'knowledge'
const RESUME_DIR = 'resume'
const PORTFOLIO_FILE = `${KNOWLEDGE_DIR}/portfolio.json`
const RESUME_METADATA_FILE = `${RESUME_DIR}/.resume-metadata.json`
const MAX_RESUMES = 10

// Rate limiters for portfolio routes
const updateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many update requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many file upload requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

const generateResumeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many resume generation requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Helper to read resume metadata
const readResumeMetadata = async () => {
  try {
    const exists = await storage.exists(RESUME_METADATA_FILE)
    if (exists) {
      const data = await storage.readFile(RESUME_METADATA_FILE)
      return JSON.parse(data)
    }
  } catch (error) {
    if (error.message !== 'ENOENT') {
      console.error('Error reading resume metadata:', error)
    }
  }
  return { activeResume: null, resumes: [] }
}

// Helper to write resume metadata
const writeResumeMetadata = async (metadata) => {
  try {
    await storage.writeFile(RESUME_METADATA_FILE, JSON.stringify(metadata, null, 2))
    
    // Verify the write was successful
    const exists = await storage.exists(RESUME_METADATA_FILE)
    if (!exists) {
      throw new Error('Resume metadata file was not created after write operation')
    }
  } catch (error) {
    console.error('❌ Error writing resume metadata:', error)
    throw error
  }
}

// Helper to get active resume file
const getActiveResumeFile = async () => {
  try {
    const metadata = await readResumeMetadata()
    const files = await storage.listFiles(RESUME_DIR)
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') && f.name !== '.resume-metadata.json')
    
    if (pdfFiles.length === 0) {
      return null
    }
    
    // If active resume is set and exists, return it
    if (metadata.activeResume) {
      const activeFile = pdfFiles.find(f => f.name === metadata.activeResume)
      if (activeFile) {
        return {
          filename: activeFile.name,
          path: `${RESUME_DIR}/${activeFile.name}`,
          isActive: true
        }
      }
    }
    
    // Otherwise return the first PDF file found
    return {
      filename: pdfFiles[0].name,
      path: `${RESUME_DIR}/${pdfFiles[0].name}`,
      isActive: metadata.activeResume === pdfFiles[0].name
    }
  } catch (error) {
    console.error('Error getting active resume file:', error)
    return null
  }
}

// Helper to get all resume files with metadata
const getAllResumeFiles = async () => {
  try {
    const metadata = await readResumeMetadata()
    const files = await storage.listFiles(RESUME_DIR)
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf') && f.name !== '.resume-metadata.json')
    
    const resumes = pdfFiles.map(file => ({
      filename: file.name,
      size: file.size,
      modified: file.modified,
      isActive: metadata.activeResume === file.name
    }))
    
    // Sort by modified date (newest first)
    resumes.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    
    return resumes
  } catch (error) {
    console.error('Error getting all resume files:', error)
    return []
  }
}

// Helper to read portfolio
const readPortfolio = async () => {
  try {
    const exists = await storage.exists(PORTFOLIO_FILE)
    if (!exists) {
      throw new Error('ENOENT')
    }
    
    const data = await storage.readFile(PORTFOLIO_FILE)
    const portfolio = JSON.parse(data)
    
    // Validate portfolio structure
    if (!portfolio || typeof portfolio !== 'object') {
      throw new Error('Invalid portfolio data structure')
    }
    
    // Ensure required fields exist (but don't overwrite, just add missing ones)
    if (!portfolio.sections) {
      portfolio.sections = {}
    }
    if (!portfolio.sectionOrder) {
      portfolio.sectionOrder = []
    }
    
    return portfolio
  } catch (error) {
    // Only create default portfolio if file doesn't exist
    // For other errors (like SyntaxError), log but don't overwrite - return empty structure instead
    if (error.message === 'ENOENT') {
      // File doesn't exist - create default portfolio structure
      console.log('Portfolio file not found, creating default structure')
    } else if (error instanceof SyntaxError) {
      // Invalid JSON - don't overwrite, just log and return empty structure
      console.error('⚠️ Portfolio file contains invalid JSON. Preserving file. Error:', error.message)
      // Return empty structure instead of overwriting
      return {
        sections: {},
        sectionOrder: []
      }
    } else {
      // Other errors - log but don't overwrite
      console.error('Error reading portfolio file:', error)
      // Return empty structure instead of overwriting
      return {
        sections: {},
        sectionOrder: []
      }
    }
    
    // Create default portfolio structure only if file doesn't exist
    const defaultPortfolio = {
      sections: {
        hero: {
          visible: true,
          content: {
            greeting: "Hello, I'm",
            name: 'Deepak Kumar CH',
            title: 'Software Engineer',
            description: 'Building scalable solutions with Java, Go, and modern cloud technologies.\nPassionate about creating high-performance software and solving complex problems.'
          }
        },
        about: {
          visible: true,
          order: 1,
          content: {
            paragraphs: [
              'Highly motivated individual with experience in developing and implementing software solutions. Proven expertise in developing, testing and debugging high performing software components with a keen eye for detail.',
              'Excellent problem-solving and communication skills and demonstrates a passion for learning and implementing new technologies.'
            ],
            highlights: [
              { icon: '⚡', text: 'Performance Optimization' },
              { icon: '🚀', text: 'Scalable Architecture' },
              { icon: '🔧', text: 'Problem Solving' }
            ]
          }
        },
        skills: {
          visible: true,
          order: 2,
          content: {
            categories: {
              'Programming Languages': ['Java', 'Go/Golang', 'Python', 'TypeScript', 'JavaScript', 'SQL'],
              'Frameworks': ['Spring Boot', 'Spring Microservices', 'Angular', 'Flask', 'Gin', 'Apache Airflow'],
              'Cloud': ['Azure Functions', 'Azure Cosmos DB', 'Azure Key Vault', 'AWS S3', 'AWS Private CA'],
              'Tools & Others': ['Data Structures', 'Algorithms', 'Problem Solving', 'System Design', 'Git', 'Docker', 'Kubernetes', 'TDD']
            }
          }
        },
        experience: {
          visible: true,
          order: 3,
          content: {
            experiences: [
              {
                id: '1',
                company: 'DigiCert Inc.',
                role: 'Software Engineer',
                location: 'Bangalore',
                period: 'Mar 2023 - Present',
                description: 'Part of Trust Lifecycle Manager (TLM) team which is one of the modules in DcOne/DigicertOne used for the discovery, management and automation of SSL certificates.',
                achievements: [
                  'Engineered plugins to integrate with third-party certificate authorities (CAs) such as AWS Private CA and Azure Key Vault using Java Spring Boot, enabling issuance, discovery and management of certificates within a unified platform.',
                  'Utilized object-oriented design principles and various data structures and algorithms to develop high quality software components. Enhanced performance of AKV plugin to discover and list the certificates by 20% using the concepts of multi-threading.',
                  'Built several features in a scanner application (Agent) using Go to discover open IPs and ports, retrieve installed SSL certificates, and facilitate centralized certificate management.',
                  'Implemented pre/post hook, SNI hook and agent cert delivery features for Agent in Golang on request that attracted and helped onboarding 10+ customers to our product with a client satisfaction rate over 80% increasing the revenue close to $3.5 million.'
                ]
              },
              {
                id: '2',
                company: 'Infosys Limited',
                role: 'Specialist Programmer',
                location: 'Hyderabad',
                period: 'June 2022 - Mar 2023',
                description: 'Contributed to the development and maintenance of the e-Approval service, a critical tool of Apple Inc. for internal approval of expense reports and purchase requests.',
                achievements: [
                  'Increased the code coverage of the project from 0% to >85% by writing unit tests using JUnit and Mockito in Java which strengthened the code reliability and quality.',
                  'Fixed several bugs in Spring boot microservices project that unblocked several issues of the users.'
                ]
              },
              {
                id: '3',
                company: 'Infosys Limited',
                role: 'Systems Engineer',
                location: 'Hyderabad',
                period: 'Nov 2020 - June 2022',
                description: 'Worked for the client Uniper Energy to develop a platform known as Future Modelling Platform (FMP) to execute their Dockerized models and workflows on Apache Airflow deployed on an Azure Kubernetes cluster.',
                achievements: [
                  'Increased model execution throughput nearly by 75% using xlwings (library in python). Developed 4-5 workflows using Apache airflow to schedule and auto-trigger the models at regular intervals.',
                  'Assisted maintaining the platform with an availability rate over 99.9% using the auto-scaling strategies available in AKS.',
                  'Created several Azure Functions to orchestrate and monitor model execution on the platform. Leveraged Cosmos DB (NoSQL) for efficient storage of platform data. Integrated Azure Functions with an Angular UI to visualize model run statistics through interactive charts using Apex charts package.',
                  'Helped creating CI/CD pipelines using Azure DevOps for streamlined project management.'
                ]
              }
            ]
          }
        },
        education: {
          visible: true,
          order: 4,
          content: {
            items: [
              {
                id: '1',
                degree: 'Bachelors of Technology - Computer Science and Engineering',
                institution: 'National Institute of Science and Technology',
                location: 'Berhampur, India',
                period: 'Aug 2016 - July 2020'
              }
            ]
          }
        },
        achievements: {
          visible: true,
          order: 5,
          content: {
            items: [
              {
                id: '1',
                icon: '🏆',
                title: 'Leetcode Ranking',
                value: 'Peak Global rank 6784',
                description: 'Competitive programming excellence'
              },
              {
                id: '2',
                icon: '💻',
                title: 'DSA Problems Solved',
                value: '2000+',
                description: 'Across various online platforms'
              },
              {
                id: '3',
                icon: '⭐',
                title: 'Infy Insta Award',
                value: 'Twice',
                description: 'For hard work and commitment at work'
              }
            ]
          }
        },
        contact: {
          visible: true,
          order: 6,
          content: {
            description: "I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology. Feel free to reach out!",
            links: [
              {
                id: '1',
                name: 'GitHub',
                url: 'https://www.github.com/chdeepakkumar',
                icon: 'github',
                label: 'View my code repositories'
              },
              {
                id: '2',
                name: 'Leetcode',
                url: 'https://www.leetcode.com/ChDeepakKumar',
                icon: 'leetcode',
                label: 'Check my problem-solving skills'
              }
            ]
          }
        }
      },
      sectionOrder: ['about', 'skills', 'experience', 'education', 'achievements', 'contact']
    }
    try {
      // Only write if file doesn't exist (ENOENT case)
      if (error.message === 'ENOENT') {
        await storage.writeFile(PORTFOLIO_FILE, JSON.stringify(defaultPortfolio, null, 2))
        console.log('✅ Default portfolio file created')
      }
    } catch (writeError) {
      console.error('Error creating default portfolio file:', writeError)
      // Return default portfolio even if write fails
    }
    return defaultPortfolio
  }
}

// Helper to write portfolio
const writePortfolio = async (portfolio) => {
  try {
    // Write portfolio to file with proper formatting
    await storage.writeFile(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2))
    
    // Verify the write was successful by checking if file exists
    const exists = await storage.exists(PORTFOLIO_FILE)
    if (!exists) {
      throw new Error('Portfolio file was not created after write operation')
    }
  } catch (error) {
    console.error('❌ Error writing portfolio file:', error)
    throw error // Re-throw to let caller handle the error
  }
}

// Get portfolio (public - returns only visible sections)
router.get('/', async (req, res) => {
  try {
    const portfolio = await readPortfolio()
    
    // Ensure portfolio has required structure
    if (!portfolio) {
      return res.status(500).json({ error: 'Portfolio data not available' })
    }
    
    if (!portfolio.sections) {
      portfolio.sections = {}
    }
    
    if (!portfolio.sectionOrder) {
      portfolio.sectionOrder = []
    }
    
    // Filter out invisible sections
    const visibleSections = {}
    const visibleSectionOrder = []
    
    // Always include hero section if it exists (hero is not in sectionOrder)
    if (portfolio.sections.hero) {
      visibleSections.hero = portfolio.sections.hero
    }
    
    // Process sectionOrder only if it's an array
    if (Array.isArray(portfolio.sectionOrder)) {
      portfolio.sectionOrder.forEach(sectionId => {
        if (portfolio.sections[sectionId]?.visible) {
          visibleSections[sectionId] = portfolio.sections[sectionId]
          visibleSectionOrder.push(sectionId)
        }
      })
    }
    
    res.json({ sections: visibleSections, sectionOrder: visibleSectionOrder })
  } catch (error) {
    console.error('Get portfolio error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Get portfolio for admin (returns all sections including invisible ones)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const portfolio = await readPortfolio()
    // Return all sections for admin
    res.json({ sections: portfolio.sections, sectionOrder: portfolio.sectionOrder })
  } catch (error) {
    console.error('Get admin portfolio error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Deep merge helper function
// Arrays are replaced (not merged) since editors send complete arrays
// Primitive values (including booleans) are replaced
const deepMerge = (target, source) => {
  // If source is null or undefined, return target
  if (source == null) {
    return target
  }
  
  // If target is not an object or source is not an object, return source
  if (!isObject(target) || !isObject(source)) {
    return source
  }
  
  const output = { ...target }
  
  // Process all keys in source
  Object.keys(source).forEach(key => {
    const sourceValue = source[key]
    const targetValue = target[key]
    
    // Arrays are replaced entirely
    if (Array.isArray(sourceValue)) {
      output[key] = sourceValue
    } 
    // Null values are replaced (to allow clearing)
    else if (sourceValue === null) {
      output[key] = null
    }
    // Objects are recursively merged
    else if (isObject(sourceValue)) {
      if (!(key in target) || !isObject(targetValue)) {
        output[key] = sourceValue
      } else {
        output[key] = deepMerge(targetValue, sourceValue)
      }
    } 
    // Primitive values (strings, numbers, booleans, undefined) are replaced
    else {
      output[key] = sourceValue
    }
  })
  
  return output
}

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// Update portfolio (protected)
router.put('/', authenticateToken, updateRateLimiter, async (req, res) => {
  try {
    // Input validation
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' })
    }
    
    // Prevent extremely large payloads
    const bodyString = JSON.stringify(req.body)
    if (bodyString.length > 1000000) { // 1MB limit
      return res.status(400).json({ error: 'Request payload too large' })
    }
    
    const portfolio = await readPortfolio()
    const updates = req.body

    // Update sections with deep merge
    if (updates.sections) {
      Object.keys(updates.sections).forEach(sectionId => {
        if (portfolio.sections[sectionId]) {
          const beforeUpdate = JSON.stringify(portfolio.sections[sectionId])
          // Deep merge existing section
          portfolio.sections[sectionId] = deepMerge(
            portfolio.sections[sectionId],
            updates.sections[sectionId]
          )
          const afterUpdate = JSON.stringify(portfolio.sections[sectionId])
          console.log(`Updated section ${sectionId}:`, {
            before: JSON.parse(beforeUpdate),
            update: updates.sections[sectionId],
            after: JSON.parse(afterUpdate)
          })
        } else {
          // Create new section if it doesn't exist (e.g., hero)
          portfolio.sections[sectionId] = updates.sections[sectionId]
          console.log(`Created new section ${sectionId}:`, updates.sections[sectionId])
        }
      })
    }

    // Update section order
    if (updates.sectionOrder) {
      portfolio.sectionOrder = updates.sectionOrder
    }

    // Write updated portfolio to file
    await writePortfolio(portfolio)
    
    // Verify the write by reading back the portfolio
    const verifyPortfolio = await readPortfolio()
    console.log('Portfolio after write - verifying updates:', {
      updatedSections: Object.keys(updates.sections || {}),
      achievementsVisible: verifyPortfolio.sections?.achievements?.visible,
      allSectionVisibilities: Object.keys(verifyPortfolio.sections || {}).reduce((acc, key) => {
        acc[key] = verifyPortfolio.sections[key]?.visible
        return acc
      }, {})
    })
    
    res.json({ message: 'Portfolio updated successfully', portfolio: verifyPortfolio })
  } catch (error) {
    console.error('❌ Update portfolio error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    
    // Provide more specific error messages
    if (error.message?.includes('BLOB') || error.message?.includes('blob') || error.message?.includes('storage')) {
      return res.status(500).json({ 
        error: `Storage error: ${error.message}. Please check blob storage configuration.` 
      })
    }
    if (error.message?.includes('ENOENT')) {
      return res.status(500).json({ 
        error: 'Portfolio file not found. Please contact administrator.' 
      })
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get section order (public)
router.get('/sections', async (req, res) => {
  try {
    const portfolio = await readPortfolio()
    res.json({ sectionOrder: portfolio.sectionOrder })
  } catch (error) {
    console.error('Get sections error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update section order (protected)
router.put('/sections', authenticateToken, updateRateLimiter, async (req, res) => {
  try {
    const { sectionOrder } = req.body

    if (!Array.isArray(sectionOrder)) {
      return res.status(400).json({ error: 'sectionOrder must be an array' })
    }

    // Validate that all section IDs in order exist in portfolio
    const portfolio = await readPortfolio()
    const validSections = Object.keys(portfolio.sections)
    const invalidSections = sectionOrder.filter(id => !validSections.includes(id) && id !== 'hero')
    
    if (invalidSections.length > 0) {
      return res.status(400).json({ 
        error: `Invalid section IDs in order: ${invalidSections.join(', ')}` 
      })
    }

    portfolio.sectionOrder = sectionOrder
    await writePortfolio(portfolio)

    res.json({ message: 'Section order updated successfully', sectionOrder })
  } catch (error) {
    console.error('❌ Update section order error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Directory functions no longer needed - storage abstraction handles this

// Configure multer for file uploads (memory storage for JSON files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true)
    } else {
      cb(new Error('Only JSON files are allowed'), false)
    }
  }
})

// Configure multer for PDF resume uploads (memory storage - we'll write to blob/file system)
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit for PDF
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

// Get all knowledge files (public - for chatbot)
router.get('/knowledge-files', async (req, res) => {
  try {
    const files = await storage.listFiles(KNOWLEDGE_DIR)
    const jsonFiles = files.filter(f => f.name.endsWith('.json'))
    
    const fileList = jsonFiles.map(file => ({
      filename: file.name,
      size: file.size,
      modified: file.modified
    }))
    
    res.json({ files: fileList })
  } catch (error) {
    console.error('Get knowledge files error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific knowledge file content (public - for chatbot)
router.get('/knowledge-files/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    // Security: prevent path traversal and validate filename
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    // Sanitize filename - only allow alphanumeric, dots, hyphens, underscores
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' })
    }
    
    const filePath = `${KNOWLEDGE_DIR}/${filename}`
    
    // Handle README.md specially
    if (filename === 'README.md') {
      const content = await storage.readFile(filePath)
      res.setHeader('Content-Type', 'text/markdown')
      return res.send(content)
    }
    
    // For JSON files
    if (!filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    const content = await storage.readFile(filePath)
    const data = JSON.parse(content)
    
    res.json({ filename, data })
  } catch (error) {
    if (error.message === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' })
    }
    console.error('Get knowledge file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload knowledge file (protected)
router.post('/knowledge-files', authenticateToken, uploadRateLimiter, upload.single('file'), async (req, res) => {
  try {
    // Input validation
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    // Validate file size (already limited by multer, but double-check)
    if (req.file.size > 1024 * 1024) { // 1MB
      return res.status(400).json({ error: 'File size exceeds 1MB limit' })
    }
    
    // Check maximum file limit (20 files)
    const existingFiles = await storage.listFiles(KNOWLEDGE_DIR)
    const jsonFiles = existingFiles.filter(f => f.name.endsWith('.json'))
    const MAX_FILES = 20
    
    if (jsonFiles.length >= MAX_FILES) {
      return res.status(400).json({ 
        error: `Maximum file limit reached (${MAX_FILES} files). Please delete some files before uploading new ones.` 
      })
    }
    
    let fileBuffer = null
    let filename = null
    
    // Check if file was uploaded via multer
    if (req.file) {
      fileBuffer = req.file.buffer
      
      // Check file size (additional check, multer should catch this but just in case)
      if (fileBuffer.length > 1 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File size exceeds 1MB limit' 
        })
      }
      
      // Use original filename or generate one
      const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
      if (originalName.endsWith('.json')) {
        filename = originalName
      } else {
        filename = `${originalName}.json`
      }
    } else if (req.body && Object.keys(req.body).length > 0) {
      // Accept JSON content in request body as fallback
      const jsonString = JSON.stringify(req.body)
      fileBuffer = Buffer.from(jsonString, 'utf8')
      
      // Check size for body content
      if (fileBuffer.length > 1 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File size exceeds 1MB limit' 
        })
      }
    } else {
      return res.status(400).json({ error: 'No file or JSON content provided' })
    }
    
    // Validate JSON
    const validation = validateKnowledgeFileFromBuffer(fileBuffer)
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid JSON format',
        details: validation.error
      })
    }
    
    // Generate filename if not provided
    if (!filename) {
      const timestamp = Date.now()
      filename = `knowledge-${timestamp}.json`
    } else {
      // Ensure unique filename
      const timestamp = Date.now()
      const nameWithoutExt = filename.replace('.json', '')
      filename = `${nameWithoutExt}-${timestamp}.json`
    }
    
    const filePath = `${KNOWLEDGE_DIR}/${filename}`
    
    // Write file with proper error handling
    try {
      await storage.writeFile(filePath, JSON.stringify(validation.data, null, 2))
      
      // Verify the write was successful
      const exists = await storage.exists(filePath)
      if (!exists) {
        throw new Error('File was not created after write operation')
      }
    } catch (writeError) {
      console.error('❌ Error writing knowledge file:', writeError)
      throw new Error('Failed to save knowledge file')
    }
    
    const stats = await storage.getStats(filePath)
    
    res.json({ 
      message: 'File uploaded successfully',
      filename,
      size: stats.size,
      modified: stats.mtime
    })
  } catch (error) {
    console.error('Upload knowledge file error:', error)
    if (error.message === 'Only JSON files are allowed') {
      return res.status(400).json({ error: error.message })
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 1MB limit' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete knowledge file (protected)
router.delete('/knowledge-files/:filename', authenticateToken, updateRateLimiter, async (req, res) => {
  try {
    const { filename } = req.params
    
    // Security: prevent path traversal
    if (filename.includes('..') || !filename.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    // Prevent deleting portfolio.json (main portfolio file)
    if (filename === 'portfolio.json') {
      return res.status(400).json({ error: 'Cannot delete the main portfolio file' })
    }
    
    const filePath = `${KNOWLEDGE_DIR}/${filename}`
    
    try {
      await storage.deleteFile(filePath)
      res.json({ message: 'File deleted successfully', filename })
    } catch (error) {
      if (error.message === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' })
      }
      throw error
    }
  } catch (error) {
    console.error('Delete knowledge file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Generate and download resume PDF from portfolio data (protected - admin only)
// IMPORTANT: This route must be defined BEFORE /resume.pdf to avoid route conflicts
router.get('/generate-resume.pdf', authenticateToken, generateResumeRateLimiter, async (req, res) => {
  try {
    const portfolio = await readPortfolio()
    
    // Get visible sections in order (include hero)
    const visibleSections = {}
    const visibleSectionOrder = []
    
    // Always include hero if it exists
    if (portfolio.sections.hero) {
      visibleSections.hero = portfolio.sections.hero
    }
    
    // Add visible sections in order
    portfolio.sectionOrder.forEach(sectionId => {
      if (portfolio.sections[sectionId]?.visible) {
        visibleSections[sectionId] = portfolio.sections[sectionId]
        visibleSectionOrder.push(sectionId)
      }
    })
    
    // Get hero data for filename
    const hero = portfolio.sections.hero?.content || {}
    const name = hero.name || 'DeepakKumarCH'
    // Format name for filename: "Deepak Kumar CH" -> "DeepakKumarCH"
    const filename = name.replace(/\s+/g, '') + 'Resume.pdf'
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // Generate PDF (this will call end() internally to finalize)
    const pdfDoc = generateResumePDF(visibleSections, visibleSectionOrder)
    
    // Handle errors
    pdfDoc.on('error', (error) => {
      console.error('PDF generation error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF' })
      }
    })
    
    // Handle response errors
    res.on('error', (error) => {
      console.error('Response stream error:', error)
      if (!pdfDoc.destroyed) {
        pdfDoc.destroy()
      }
    })
    
    // Pipe PDF to response - end() is already called in generateResumePDF
    pdfDoc.pipe(res)
  } catch (error) {
    console.error('Generate resume PDF error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate resume PDF' })
    }
  }
})

// List all resumes (protected - admin only)
// IMPORTANT: This route must be defined BEFORE /resume/:filename to avoid route conflicts
router.get('/resumes', authenticateToken, async (req, res) => {
  try {
    const resumes = await getAllResumeFiles()
    res.json({ resumes })
  } catch (error) {
    console.error('List resumes error:', error)
    res.status(500).json({ error: 'Failed to list resumes' })
  }
})

// Set active resume (protected - admin only)
// IMPORTANT: This route must be defined BEFORE /resume/:filename to avoid route conflicts
router.put('/resume/active', authenticateToken, updateRateLimiter, async (req, res) => {
  try {
    const { filename } = req.body
    
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename required' })
    }
    
    // Validate filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    // Verify file exists
    const filePath = `${RESUME_DIR}/${filename}`
    const exists = await storage.exists(filePath)
    if (!exists) {
      return res.status(404).json({ error: 'Resume file not found' })
    }
    
    // Update metadata
    const metadata = await readResumeMetadata()
    metadata.activeResume = filename
    await writeResumeMetadata(metadata)
    
    res.json({ 
      message: 'Active resume updated successfully',
      activeResume: filename
    })
  } catch (error) {
    console.error('Set active resume error:', error)
    res.status(500).json({ error: 'Failed to set active resume' })
  }
})

// Upload resume PDF (protected - admin only)
router.post('/resume', authenticateToken, uploadRateLimiter, resumeUpload.single('resume'), async (req, res) => {
  try {
    // Input validation
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    // Validate file size (already limited by multer, but double-check)
    if (req.file.size > 1 * 1024 * 1024) { // 1MB
      return res.status(400).json({ error: 'File size exceeds 1MB limit' })
    }
    
    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' })
    }
    
    // Check if we've reached the maximum number of resumes
    const resumes = await getAllResumeFiles()
    if (resumes.length >= MAX_RESUMES) {
      return res.status(400).json({ 
        error: `Maximum number of resumes (${MAX_RESUMES}) reached. Please delete a resume before uploading a new one.` 
      })
    }
    
    // Generate filename
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    let filename = originalName.toLowerCase().endsWith('.pdf') 
      ? originalName 
      : `${originalName}.pdf`
    
    // Check if file with same name exists, add timestamp
    const filePath = `${RESUME_DIR}/${filename}`
    const exists = await storage.exists(filePath)
    if (exists) {
      const timestamp = Date.now()
      const nameWithoutExt = filename.replace('.pdf', '')
      filename = `${nameWithoutExt}_${timestamp}.pdf`
    }
    
    const finalFilePath = `${RESUME_DIR}/${filename}`
    
    // Write file to storage (blob or file system)
    await storage.writeFileBuffer(finalFilePath, req.file.buffer)
    
    // Verify file was written
    const fileExists = await storage.exists(finalFilePath)
    if (!fileExists) {
      console.error('❌ Resume file was not found after upload:', finalFilePath)
      return res.status(500).json({ error: 'Failed to save resume file' })
    }
    
    // Update metadata - set as active if it's the first resume
    const metadata = await readResumeMetadata()
    
    // If this is the first resume, set it as active
    if (resumes.length === 0 && !metadata.activeResume) {
      metadata.activeResume = filename
      await writeResumeMetadata(metadata)
    }
    
    res.json({ 
      message: 'Resume uploaded successfully',
      filename: filename,
      size: req.file.size,
      isActive: metadata.activeResume === filename
    })
  } catch (error) {
    console.error('❌ Upload resume error:', error)
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message })
    }
    if (error.message && error.message.includes('Maximum number of resumes')) {
      return res.status(400).json({ error: error.message })
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to upload resume' })
    }
  }
})

// Download specific resume PDF by filename (public - for admin download)
// IMPORTANT: This route must be defined AFTER all specific /resume/* routes to avoid conflicts
router.get('/resume/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    // Validate filename (prevent path traversal)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    // Prevent accessing metadata file
    if (filename === '.resume-metadata.json') {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    const filePath = `${RESUME_DIR}/${filename}`
    
    // Verify file exists
    const exists = await storage.exists(filePath)
    if (!exists) {
      return res.status(404).json({ error: 'Resume file not found' })
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`)
    
    // Read and send the file
    const fileBuffer = await storage.readFileBuffer(filePath)
    res.send(fileBuffer)
  } catch (error) {
    console.error('Download resume error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download resume' })
    }
  }
})

// Download active resume PDF (public)
// IMPORTANT: This route must be defined AFTER /generate-resume.pdf and /resume/:filename to avoid conflicts
router.get('/resume.pdf', async (req, res) => {
  try {
    // Get active resume file
    const resumeFile = await getActiveResumeFile()
    if (!resumeFile) {
      console.error('Active resume file not found in directory:', RESUME_DIR)
      return res.status(404).json({ error: 'Resume file not found' })
    }
    
    // Verify file exists
    const exists = await storage.exists(resumeFile.path)
    if (!exists) {
      console.error('Resume file path does not exist:', resumeFile.path)
      return res.status(404).json({ error: 'Resume file not found' })
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    // Use both quoted and unquoted filename for better browser compatibility
    res.setHeader('Content-Disposition', `attachment; filename="${resumeFile.filename}"; filename*=UTF-8''${encodeURIComponent(resumeFile.filename)}`)
    
    // Read and send the file
    const fileBuffer = await storage.readFileBuffer(resumeFile.path)
    res.send(fileBuffer)
  } catch (error) {
    console.error('Download resume error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download resume' })
    }
  }
})

// Delete resume (protected - admin only)
router.delete('/resume/:filename', authenticateToken, updateRateLimiter, async (req, res) => {
  try {
    const { filename } = req.params
    
    // Validate filename (prevent path traversal)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    // Prevent deleting metadata file
    if (filename === '.resume-metadata.json') {
      return res.status(400).json({ error: 'Cannot delete metadata file' })
    }
    
    const filePath = `${RESUME_DIR}/${filename}`
    
    // Verify file exists
    const exists = await storage.exists(filePath)
    if (!exists) {
      return res.status(404).json({ error: 'Resume file not found' })
    }
    
    // Check if this is the active resume
    const metadata = await readResumeMetadata()
    const isActive = metadata.activeResume === filename
    
    // Delete the file
    await storage.deleteFile(filePath)
    
    // If it was active, set another resume as active (or clear if none left)
    if (isActive) {
      const remainingResumes = await getAllResumeFiles()
      if (remainingResumes.length > 0) {
        metadata.activeResume = remainingResumes[0].filename
      } else {
        metadata.activeResume = null
      }
      await writeResumeMetadata(metadata)
    }
    
    res.json({ 
      message: 'Resume deleted successfully',
      newActiveResume: metadata.activeResume
    })
  } catch (error) {
    console.error('Delete resume error:', error)
    res.status(500).json({ error: 'Failed to delete resume' })
  }
})


export default router

