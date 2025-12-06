import { usePortfolio } from '../context/PortfolioContext'

/**
 * Hook to get the section number based on the current section order
 * Only counts visible sections for numbering
 * @param {string} sectionId - The ID of the section (e.g., 'about', 'skills')
 * @returns {string} - The formatted section number (e.g., '01.', '02.')
 */
export const useSectionNumber = (sectionId) => {
  const { sectionOrder, portfolio } = usePortfolio()
  
  if (!sectionOrder || sectionOrder.length === 0) {
    return '00.'
  }
  
  // Filter to only visible sections for numbering
  const visibleSectionOrder = sectionOrder.filter(id => {
    return portfolio?.[id]?.visible !== false
  })
  
  // Find the index of the section in the visible order array
  const index = visibleSectionOrder.indexOf(sectionId)
  
  if (index === -1) {
    return '00.'
  }
  
  // Format as two-digit number with leading zero
  // Add 1 because arrays are 0-indexed but we want 1-based numbering
  const number = (index + 1).toString().padStart(2, '0')
  return `${number}.`
}

