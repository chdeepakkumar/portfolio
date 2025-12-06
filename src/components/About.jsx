import { usePortfolio } from '../context/PortfolioContext'
import { useSectionNumber } from '../hooks/useSectionNumber'

const About = () => {
  const { portfolio, loading } = usePortfolio()
  const sectionNumber = useSectionNumber('about')

  if (loading || !portfolio?.about) {
    return null
  }

  const aboutData = portfolio.about.content

  return (
    <section id="about" className="about">
      <div className="container">
        <h2 className="section-title">
          <span className="title-number">{sectionNumber}</span>
          About Me
        </h2>
        <div className="about-content">
          <div className="about-text">
            {aboutData.paragraphs?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <div className="about-highlights">
              {aboutData.highlights?.map((highlight, index) => (
                <div key={index} className="highlight-item">
                  <span className="highlight-icon">{highlight.icon}</span>
                  <span>{highlight.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

