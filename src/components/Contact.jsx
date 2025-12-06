import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const Contact = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('contact')

  if (loading || !portfolio?.contact) {
    return null
  }

  const contactData = portfolio.contact.content
  const links = contactData.links || []

  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          Get In Touch
        </h2>
        <div className="contact-content">
          <p className="contact-description">{contactData.description}</p>
          <div className="contact-links">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
                aria-label={link.label}
              >
                <span className="link-icon">
                  {link.iconEmoji || 
                   (link.icon === 'github' ? '💻' : 
                    link.icon === 'leetcode' ? '📊' : 
                    link.icon === 'linkedin' ? '💼' : 
                    link.icon === 'email' ? '📧' : 
                    link.icon === 'phone' ? '📱' : '🔗')}
                </span>
                <span className="link-name">{link.name}</span>
                <span className="link-arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact

