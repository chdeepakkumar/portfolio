import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { initializeChatbot, generateAnswer, reloadResume } from '../utils/chatbot.js'
import { isGeminiAvailable } from '../utils/geminiClient.js'
import '../styles/Chatbot.css'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [geminiAvailable, setGeminiAvailable] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Check if Gemini is available
    const geminiStatus = isGeminiAvailable()
    setGeminiAvailable(geminiStatus)
    
    if (!geminiStatus) {
      console.warn('⚠️ Gemini API key not configured. Chatbot will use basic search mode.')
      console.warn('💡 To enable AI-powered responses, set VITE_GEMINI_API_KEY in your .env file')
    }
    
    // Initialize chatbot on mount
    initializeChatbot()
      .then((data) => {
        setIsInitialized(true)
        const welcomeMessage = geminiStatus
          ? "Hi! I'm Deepak's AI-powered assistant powered by Google Gemini. I can answer questions based on all available knowledge files. Ask me anything about his experience, skills, education, achievements, or any other information!"
          : "Hi! I'm Deepak's assistant. Ask me anything about his background! ⚠️ Note: For better AI-powered answers, configure the Gemini API key in your .env file. See GEMINI_SETUP.md for instructions."
        setMessages([
          {
            type: 'bot',
            text: welcomeMessage
          }
        ])
      })
      .catch(error => {
        console.error('Failed to initialize chatbot:', error)
        setMessages([
          {
            type: 'bot',
            text: "Hi! I'm here to help. Ask me anything about Deepak's background!"
          }
        ])
        setIsInitialized(true)
      })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setIsLoading(true)

    // Simulate thinking time for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      const answer = await generateAnswer(userMessage)
      setMessages(prev => [...prev, { type: 'bot', text: answer }])
    } catch (error) {
      console.error('Error generating answer:', error)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I'm sorry, I encountered an error. Please try asking your question again. If this persists, please check if the Gemini API key is configured."
      }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleReload = async () => {
    setIsLoading(true)
    try {
      await reloadResume()
        setMessages([
          {
            type: 'bot',
            text: "Knowledge base has been reloaded! Ask me anything about the updated information."
          }
        ])
    } catch (error) {
      console.error('Failed to reload resume:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const suggestedQuestions = [
    "What are your skills?",
    "Tell me about your experience",
    "What's your education?",
    "What are your achievements?"
  ]

  const handleSuggestedQuestion = (question) => {
    setInput(question)
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} }
      setMessages(prev => [...prev, { type: 'user', text: question }])
      setIsLoading(true)
      
      setTimeout(async () => {
        try {
          const answer = await generateAnswer(question)
          setMessages(prev => [...prev, { type: 'bot', text: answer }])
        } catch (error) {
          setMessages(prev => [...prev, {
            type: 'bot',
            text: "I'm sorry, I encountered an error. Please try again."
          }])
        } finally {
          setIsLoading(false)
        }
      }, 300)
    }, 100)
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        <span className="chatbot-icon">💬</span>
        {isOpen && <span className="chatbot-close">×</span>}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <h3>Deepak's AI Assistant {geminiAvailable && <span className="ai-badge">AI</span>}</h3>
              <p>Ask me anything about Deepak's background</p>
            </div>
            <div className="chatbot-actions">
              <button
                className="chatbot-reload-btn"
                onClick={handleReload}
                title="Reload resume data"
                disabled={isLoading}
              >
                🔄
              </button>
              <button
                className="chatbot-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                ×
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-suggestions">
                <p>Try asking:</p>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => handleSuggestedQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                <div className="message-content">
                  {msg.type === 'bot' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Deepak's resume..."
              className="chatbot-input"
              disabled={isLoading || !isInitialized}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!input.trim() || isLoading || !isInitialized}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot

