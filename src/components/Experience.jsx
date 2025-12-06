import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const Experience = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('experience')

  if (loading || !portfolio?.experience) {
    return null
  }

  const experiences = portfolio.experience.content.experiences || []

  return (
    <section id="experience" className="experience">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          Experience
        </h2>
        <div className="timeline">
          {experiences.map((exp) => (
            <div key={exp.id} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="experience-header">
                  <h3 className="company-name">{exp.company}</h3>
                  <span className="experience-period">{exp.period}</span>
                </div>
                <div className="experience-role">
                  <span className="role-title">{exp.role}</span>
                  <span className="role-location">{exp.location}</span>
                </div>
                <p className="experience-description">{exp.description}</p>
                <ul className="achievements-list">
                  {exp.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience

