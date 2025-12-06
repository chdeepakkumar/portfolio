import PDFDocument from 'pdfkit'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Generate PDF resume from portfolio data
 * @param {Object} sections - Portfolio sections object
 * @param {Array} sectionOrder - Ordered list of visible section IDs
 * @returns {PDFDocument} - PDF document stream
 */
export function generateResumePDF(sections, sectionOrder) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
  
  // Get hero data for header
  const hero = sections.hero?.content || {}
  const name = hero.name || 'Deepak Kumar CH'
  
  // Get contact information
  const contact = sections.contact?.content || {}
  const contactLinks = contact.links || []
  
  // Extract contact details
  let email = ''
  let phone = ''
  let linkedin = ''
  let github = ''
  let leetcode = ''
  
  contactLinks.forEach(link => {
    const url = link.url || ''
    const name = (link.name || '').toLowerCase()
    if (url.includes('@') || name === 'email') {
      email = url.replace(/^mailto:/i, '')
    } else if (name === 'phone' || name === 'mobile') {
      phone = url.replace(/^tel:/i, '')
    } else if (url.includes('linkedin.com') || name === 'linkedin') {
      linkedin = url
    } else if (url.includes('github.com') || name === 'github') {
      github = url
    } else if (url.includes('leetcode.com') || name === 'leetcode') {
      leetcode = url
    }
  })
  
  // Helper function to add section title
  const addSectionTitle = (title) => {
    doc.moveDown(0.4)
    doc.fontSize(12)
    doc.font('Helvetica-Bold')
    doc.text(title.toUpperCase())
    doc.moveDown(0.2)
    doc.fontSize(10)
    doc.font('Helvetica')
  }
  
  // Helper function to add text with proper formatting
  const addText = (text, options = {}) => {
    const { fontSize = 10, bold = false, indent = 0, align = 'left' } = options
    doc.fontSize(fontSize)
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
    if (indent > 0) {
      doc.text(text, { indent, align })
    } else {
      doc.text(text, { align })
    }
  }
  
  // Helper function to add bullet points
  const addBullet = (text, indent = 20) => {
    doc.fontSize(10)
    doc.font('Helvetica')
    doc.text('•', { indent: indent - 10, continued: true })
    doc.text(text, { indent })
    doc.moveDown(0.15)
  }
  
  // Header: Name (centered, bold, larger)
  doc.fontSize(18)
  doc.font('Helvetica-Bold')
  doc.text(name.toUpperCase(), { align: 'center' })
  doc.moveDown(0.3)
  
  // Contact Information (centered, smaller)
  doc.fontSize(9)
  doc.font('Helvetica')
  const contactInfo = []
  if (email) contactInfo.push(email)
  if (phone) contactInfo.push(phone)
  if (linkedin) contactInfo.push(linkedin)
  if (github) contactInfo.push(github)
  if (leetcode) contactInfo.push(leetcode)
  
  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' | '), { align: 'center' })
    doc.moveDown(0.4)
  }
  
  // Professional Summary (from About section)
  const about = sections.about
  if (about?.content) {
    addSectionTitle('PROFESSIONAL SUMMARY')
    about.content.paragraphs?.forEach(paragraph => {
      addText(paragraph)
      doc.moveDown(0.15)
    })
  }
  
  // Process sections in order
  sectionOrder.forEach(sectionId => {
    const section = sections[sectionId]
    if (!section?.content) return
    
    switch (sectionId) {
      case 'skills':
        addSectionTitle('SKILLS')
        const categories = section.content.categories || {}
        Object.entries(categories).forEach(([category, skills]) => {
          doc.fontSize(10)
          doc.font('Helvetica-Bold')
          doc.text(`${category}: `, { continued: true })
          doc.font('Helvetica')
          doc.text(skills.join(', '))
          doc.moveDown(0.15)
        })
        break
        
      case 'experience':
        addSectionTitle('EXPERIENCE')
        const experiences = section.content.experiences || []
        experiences.forEach((exp, index) => {
          if (index > 0) doc.moveDown(0.25)
          
          // Company name (bold, larger)
          doc.fontSize(11)
          doc.font('Helvetica-Bold')
          doc.text(exp.company)
          
          // Role, period, and location
          doc.fontSize(10)
          doc.font('Helvetica')
          if (exp.period) {
            doc.text(exp.period)
          }
          if (exp.role) {
            doc.text(exp.role)
          }
          if (exp.location) {
            doc.text(exp.location)
          }
          doc.moveDown(0.15)
          
          // Description
          if (exp.description) {
            doc.fontSize(10)
            doc.text(exp.description)
            doc.moveDown(0.15)
          }
          
          // Achievements
          if (exp.achievements && exp.achievements.length > 0) {
            exp.achievements.forEach(achievement => {
              addBullet(achievement, 20)
            })
          }
        })
        break
        
      case 'education':
        addSectionTitle('EDUCATION')
        const educationItems = section.content.items || []
        educationItems.forEach(edu => {
          doc.fontSize(11)
          doc.font('Helvetica-Bold')
          doc.text(edu.institution)
          doc.font('Helvetica')
          doc.fontSize(10)
          if (edu.period) {
            doc.text(edu.period)
          }
          if (edu.degree) {
            doc.text(edu.degree)
          }
          if (edu.location) {
            doc.text(edu.location)
          }
          doc.moveDown(0.25)
        })
        break
        
      case 'achievements':
        addSectionTitle('ACHIEVEMENTS')
        const achievements = section.content.items || []
        achievements.forEach(achievement => {
          let achievementText = achievement.title
          if (achievement.value) {
            achievementText += `: ${achievement.value}`
          }
          if (achievement.description) {
            achievementText += ` - ${achievement.description}`
          }
          addBullet(achievementText, 20)
        })
        break
        
      case 'contact':
        // Only show portfolio links if not already shown in header
        const portfolioLinks = section.content.links || []
        const remainingLinks = portfolioLinks.filter(link => {
          const url = link.url || ''
          const name = (link.name || '').toLowerCase()
          return !url.includes('linkedin.com') && 
                 !url.includes('github.com') && 
                 !url.includes('leetcode.com') &&
                 name !== 'email' && 
                 name !== 'phone' && 
                 name !== 'mobile'
        })
        
        if (remainingLinks.length > 0) {
          addSectionTitle('PORTFOLIO AND PROFILE')
          remainingLinks.forEach(link => {
            addText(`${link.name}: ${link.url}`)
            doc.moveDown(0.1)
          })
        }
        break
    }
  })
  
  // Finalize the PDF - must call end() to complete the PDF generation
  doc.end()
  
  return doc
}

