import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const Education = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('education')

  if (loading || !portfolio?.education) {
    return null
  }

  const educationItems = portfolio.education.content.items || []

  return (
    <section id="education" className="education">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          Education
        </h2>
        <div className="education-content">
          {educationItems.map((item) => (
            <div key={item.id} className="education-item">
              <div className="education-header">
                <h3 className="degree">{item.degree}</h3>
                <span className="education-period">{item.period}</span>
              </div>
              <div className="institution">{item.institution}</div>
              <div className="location">{item.location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Education

