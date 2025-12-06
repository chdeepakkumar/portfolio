import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const Skills = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('skills')

  if (loading || !portfolio?.skills) {
    return null
  }

  const skillCategories = portfolio.skills.content.categories || {}

  return (
    <section id="skills" className="skills">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          Skills & Technologies
        </h2>
        <div className="skills-grid">
          {Object.entries(skillCategories).map(([category, items]) => (
            <div key={category} className="skill-category">
              <h3 className="category-title">{category}</h3>
              <div className="skill-tags">
                {items.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills

