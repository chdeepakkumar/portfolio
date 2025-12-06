/**
 * PDF to JSON Conversion Utility
 * Converts PDF resume to JSON format following the nested sections structure
 */

import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as pdfjsLib from 'pdfjs-dist'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Note: In Node.js, pdfjs-dist doesn't require worker setup
// The GlobalWorkerOptions is only needed in browser environments
// Text extraction works fine in Node.js without worker configuration

/**
 * Extract text from PDF file
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const pdfBuffer = await readFile(pdfPath)
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`)
  }
}

/**
 * Parse resume text into structured sections
 * @param {string} text - Raw resume text
 * @returns {Object} - Structured JSON object with sections
 */
function parseResumeText(text) {
  const sections = {
    summary: null,
    skills: null,
    experience: null,
    education: null,
    achievements: null,
    contact: null
  }

  // Extract Professional Summary
  const summaryMatch = text.match(/PROFESSIONAL SUMMARY[\s\S]*?(?=SKILLS|EXPERIENCE|EDUCATION|$)/i)
  if (summaryMatch) {
    sections.summary = summaryMatch[0]
      .replace(/PROFESSIONAL SUMMARY\s*/i, '')
      .trim()
  }

  // Extract Skills
  const skillsMatch = text.match(/SKILLS[\s\S]*?(?=EXPERIENCE|EDUCATION|ACHIEVEMENTS|$)/i)
  if (skillsMatch) {
    const skillsText = skillsMatch[0]
      .replace(/SKILLS\s*/i, '')
      .trim()
    
    // Try to parse as structured data (categories, lists, etc.)
    // For now, keep as text but could be enhanced
    sections.skills = skillsText
  }

  // Extract Experience
  const experienceMatch = text.match(/EXPERIENCE[\s\S]*?(?=EDUCATION|ACHIEVEMENTS|PORTFOLIO|$)/i)
  if (experienceMatch) {
    sections.experience = experienceMatch[0]
      .replace(/EXPERIENCE\s*/i, '')
      .trim()
  }

  // Extract Education
  const educationMatch = text.match(/EDUCATION[\s\S]*?(?=ACHIEVEMENTS|PORTFOLIO|$)/i)
  if (educationMatch) {
    sections.education = educationMatch[0]
      .replace(/EDUCATION\s*/i, '')
      .trim()
  }

  // Extract Achievements
  const achievementsMatch = text.match(/ACHIEVEMENTS?[\s\S]*?(?=PORTFOLIO|$)/i)
  if (achievementsMatch) {
    sections.achievements = achievementsMatch[0]
      .replace(/ACHIEVEMENTS?\s*/i, '')
      .trim()
  }

  // Extract Contact/Portfolio
  const contactMatch = text.match(/PORTFOLIO[\s\S]*?$/i)
  if (contactMatch) {
    sections.contact = contactMatch[0]
      .replace(/PORTFOLIO\s*/i, '')
      .trim()
  }

  // Remove null sections
  Object.keys(sections).forEach(key => {
    if (sections[key] === null) {
      delete sections[key]
    }
  })

  return sections
}

/**
 * Convert PDF resume to JSON format
 * @param {string} pdfPath - Path to PDF file (relative to project root or absolute)
 * @returns {Promise<Object>} - JSON object with nested sections
 */
export async function convertPdfToJson(pdfPath) {
  try {
    // Resolve PDF path
    const resolvedPath = pdfPath.startsWith('/')
      ? pdfPath
      : join(__dirname, '../../', pdfPath)
    
    
    // Extract text from PDF
    const text = await extractTextFromPDF(resolvedPath)
    
    if (!text || text.length < 100) {
      throw new Error('Failed to extract meaningful content from PDF')
    }
    
    // Parse text into structured sections
    const jsonData = parseResumeText(text)
    
    // Ensure we have at least some content
    if (Object.keys(jsonData).length === 0) {
      throw new Error('No sections found in PDF. Please check the PDF format.')
    }
    
    
    return jsonData
  } catch (error) {
    console.error('Error converting PDF to JSON:', error)
    throw error
  }
}

