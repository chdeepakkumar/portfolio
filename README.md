# Deepak Kumar CH - Portfolio Website

A modern, tech-focused portfolio website showcasing my experience, skills, and achievements as a Software Engineer.

## 🚀 Features

- **Modern React Application** built with Vite for fast development and optimized builds
- **Tech-focused Design** with dark theme and code-inspired aesthetics
- **Fully Responsive** - works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations** and interactive elements for enhanced user experience
- **Interactive Chatbot** - AI-powered resume assistant that answers questions about your background
- **Admin Panel** - JWT-based authentication with full CRUD operations for managing portfolio content
- **Password Reset** - Email-based password reset functionality
- **Drag & Drop** - Reorder sections with intuitive drag-and-drop interface
- **SEO Optimized** with proper meta tags and semantic HTML

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Express.js** - Backend server for API and authentication
- **JWT** - Token-based authentication
- **Nodemailer** - Email service for password reset
- **Google Gemini AI** - AI-powered chatbot for intelligent Q&A
- **PDF.js** - For parsing resume PDF content
- **@dnd-kit** - Drag and drop functionality
- **CSS3** - Custom styling with CSS variables and animations

## 📦 Installation

1. Clone the repository or navigate to the portfolio directory:
   ```bash
   cd portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory:
     ```bash
     # Create .env file
     touch .env
     ```
   - Copy `.env.example` to `.env` and fill in the values:
     ```env
     # Server Configuration
     PORT=3001
     FRONTEND_URL=http://localhost:3000

     # JWT Secrets (generate strong random strings)
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

     # Admin User (initial credentials - change after first login)
     ADMIN_EMAIL=your-email@example.com
     ADMIN_PASSWORD=admin123

     # Gmail Configuration for Password Reset
     GMAIL_USER=your-email@gmail.com
     GMAIL_APP_PASSWORD=your-gmail-app-password

     # Google Gemini API Key (optional, for chatbot)
     VITE_GEMINI_API_KEY=your_actual_api_key_here
     ```
   - **Gmail App Password Setup**:
     1. Go to your Google Account settings
     2. Enable 2-Step Verification
     3. Go to App Passwords and generate a new app password for "Mail"
     4. Use the generated 16-character password as `GMAIL_APP_PASSWORD`
   - See `ENV_SETUP.md` for detailed instructions

4. Start the development servers:
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start them separately:
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   npm run dev:server
   ```

5. Open your browser and visit:
   - Frontend: `http://localhost:3000` (or the port shown by Vite)
   - Backend API: `http://localhost:3001`

## 🏗️ Build for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory, ready to be deployed to any static hosting service.

## 🚢 Deployment

This portfolio is ready to deploy to various platforms:

### GitHub Pages

1. Update `vite.config.js` to set the base path:
   ```js
   base: '/your-repo-name/',
   ```

2. Install `gh-pages` package:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist` folder to [Netlify](https://www.netlify.com/)

   OR

3. Connect your GitHub repository and set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

   OR

3. Connect your GitHub repository on [Vercel](https://vercel.com/) and it will auto-detect the settings.

### Other Static Hosting

Any static hosting service that supports HTML/CSS/JS will work:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting
- Cloudflare Pages

Simply upload the contents of the `dist` folder after running `npm run build`.

## 🔐 Admin Features

The portfolio includes a full admin panel for managing content:

### Authentication
- **JWT-based authentication** with access and refresh tokens
- **Password reset** via email
- **Single admin user** system

### Admin Panel Features
- **Section Management**: Show/hide sections and reorder them with drag-and-drop
- **Experience Editor**: Add, edit, and delete work experience entries
- **Skills Editor**: Manage skill categories and individual skills
- **Education Editor**: Add, edit, and delete education entries
- **Achievements Editor**: Manage achievement cards
- **Contact Editor**: Update contact description and manage social links

### Accessing Admin Panel
1. Click the "Admin" button in the header
2. Login with your admin credentials
3. Navigate to `/admin` to access the full admin panel
4. All changes are saved automatically to the backend

## 📁 Project Structure

```
portfolio/
├── server/          # Backend Express server
│   ├── index.js     # Server entry point
│   ├── routes/      # API routes
│   │   ├── auth.js  # Authentication routes
│   │   └── portfolio.js  # Portfolio CRUD routes
│   ├── middleware/  # Express middleware
│   │   └── auth.js  # JWT authentication middleware
│   ├── utils/       # Utility functions
│   │   ├── email.js # Email service
│   │   └── password.js  # Password hashing
│   └── data/        # JSON data storage
│       ├── knowledge/  # Knowledge base files
│       │   └── portfolio.json
│       └── users.json
├── public/
│   └── resources/   # Resume PDF file
│       └── DeepakKumarChResume.pdf
├── src/
│   ├── components/  # React components
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Skills.jsx
│   │   ├── Experience.jsx
│   │   ├── Education.jsx
│   │   ├── Achievements.jsx
│   │   ├── Contact.jsx
│   │   ├── Chatbot.jsx
│   │   ├── Login.jsx
│   │   ├── AdminPanel.jsx
│   │   └── admin/   # Admin editor components
│   │       ├── SectionManager.jsx
│   │       ├── ExperienceEditor.jsx
│   │       ├── SkillsEditor.jsx
│   │       ├── EducationEditor.jsx
│   │       ├── AchievementsEditor.jsx
│   │       └── ContactEditor.jsx
│   ├── context/     # React contexts
│   │   ├── AuthContext.jsx
│   │   └── PortfolioContext.jsx
│   ├── utils/       # Utility functions
│   │   ├── auth.js  # API client and auth helpers
│   │   ├── resumeParser.js
│   │   └── chatbot.js
│   ├── styles/      # CSS files
│   │   ├── App.css
│   │   └── Chatbot.css
│   ├── App.jsx      # Main app component
│   └── main.jsx     # Entry point
├── index.html
├── package.json
├── vite.config.js
├── .env.example     # Environment variables template
└── README.md
```

## 🎨 Customization

### Colors

Edit the CSS variables in `src/styles/App.css`:

```css
:root {
  --bg-primary: #0a0e27;
  --accent-primary: #64ffda;
  /* ... other variables */
}
```

### Content

**For Admin Users**: Use the admin panel at `/admin` to manage all content through the web interface.

**For Manual Updates**: Update the content in `server/data/knowledge/portfolio.json` or use the admin panel:
- About section - Professional summary and highlights
- Skills section - Skill categories and individual skills
- Experience section - Work experience entries
- Education section - Education entries
- Achievements section - Achievement cards
- Contact section - Contact description and social links

### Updating Your Resume

The chatbot is trained on your resume PDF. To update it:

1. Replace the resume file:
   ```bash
   cp /path/to/your/new/resume.pdf public/resources/DeepakKumarChResume.pdf
   ```

2. The chatbot will automatically reload the resume data when users click the reload button (🔄) in the chatbot interface, or you can rebuild the site:
   ```bash
   npm run build
   ```

The chatbot extracts text from the PDF and uses Google Gemini AI to intelligently answer questions about your background, skills, experience, education, and achievements.

### Chatbot Features

- **AI-Powered**: Uses Google Gemini Pro model for intelligent, context-aware responses
- **Resume-Based**: Trained on your actual resume PDF content
- **Smart Fallback**: Works without API key using basic search (limited functionality)
- **Auto-Reload**: Reload button to refresh resume data when updated

**Important Security Note**: The API key is exposed in the client-side code. For production, consider:
- Using a backend proxy to protect your API key
- Setting up API key restrictions in Google Cloud Console
- Using environment-specific keys for development vs production

## 📝 License

This project is open source and available for personal use.

## 👤 Author

**Deepak Kumar CH**

- GitHub: [@chdeepakkumar](https://www.github.com/chdeepakkumar)
- LeetCode: [@ChDeepakKumar](https://www.leetcode.com/ChDeepakKumar)

---

Built with ❤️ using React and Vite

