import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const Achievements = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('achievements')

  if (loading || !portfolio?.achievements) {
    return null
  }

  const achievements = portfolio.achievements.content.items || []

  return (
    <section id="achievements" className="achievements">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          Achievements
        </h2>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">{achievement.icon}</div>
              <h3 className="achievement-title">{achievement.title}</h3>
              <div className="achievement-value">{achievement.value}</div>
              <p className="achievement-description">{achievement.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Achievements

