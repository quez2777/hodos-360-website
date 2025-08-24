# HODOS 360 LLC - AI-Powered Legal Tech Solutions

The official website for HODOS 360 LLC, showcasing our revolutionary AI-driven platforms that transform law firm operations, marketing, and client interactions.

## 🚀 Our Products

### HODOS - Complete AI Law Firm Management
Transform your entire law firm with AI-powered executives:
- **AI C-Suite**: CFO, CMO, CAIO, and more
- **AI Operations**: Reception, administration, and workflow automation
- **Comprehensive Management**: From strategy to execution
- **100+ AI Agents**: Working together across 15 specialized crews

### HODOS Marketing Platform
Dominate your market with AI-driven marketing:
- **AI SEO**: 7 specialized agents for complete SEO optimization
- **Content Creation**: AI-powered blog, social, and video content
- **Email Marketing**: Automated campaigns with 7 dedicated agents
- **Performance Analytics**: Real-time insights and optimization

### HODOS VIDEO Agents
Revolutionary video and voice AI agents:
- **AI Receptionist**: 24/7 intelligent client greeting
- **AI Intake Specialist**: Automated client onboarding
- **AI Sales Agent**: Convert leads with personalized interactions
- **Video Marketing**: Complete video strategy and production

## 🤖 AI Capabilities

Our platform features **15 specialized AI crews** with over **100 AI agents**:

### Marketing & Growth (42 Agents)
- **SEO Crew**: 7 agents for comprehensive SEO
- **Content Creation Crew**: 7 agents for all content needs
- **Social Media Crew**: 7 agents for social presence
- **Email Marketing Crew**: 7 agents for email campaigns
- **Video Marketing Crew**: 7 agents for video strategy
- **Reputation Management Crew**: 7 agents for online reputation

### Client Management (16 Agents)
- **Lead Generation Crew**: 8 agents for lead acquisition
- **Client Service Crew**: 8 agents for client success

### Legal Operations (24 Agents)
- **Contract Management Crew**: 8 agents for contracts
- **Compliance Crew**: 8 agents for regulatory compliance
- **Legal Research Crew**: 8 agents for legal research

### Business Intelligence (24 Agents)
- **Business Intelligence Crew**: 8 agents for analytics
- **Competitive Analysis Crew**: 8 agents for market intelligence
- **Financial Analysis Crew**: 8 agents for financial insights

### Master Orchestration
- **Master Orchestrator**: Coordinates all crews for integrated campaigns

## 🛠 Tech Stack

Built with cutting-edge technologies:
- **Next.js 14.1.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library

## Design System

The project features a custom design system with:
- **Primary Colors**: Lapis Lazuli blue spectrum
- **Accent Colors**: Royal blue and gold
- **Themes**: Dark and light mode support
- **Typography**: System font stack optimized for readability

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- Python 3.11 or higher
- npm or yarn package manager

### Frontend Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### AI Backend Installation

```bash
# Navigate to backend
cd backend/

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Launch the AI Mega Demo
python gradio_apps/launch_mega_demo.py
```

The AI demo will be available at `http://localhost:7860`

### Development

The development server runs at `http://localhost:3000`

```bash
npm run dev
```

### Testing

Run the test suite:

```bash
npm test
```

## Project Structure

```
HODOS-Site/
├── app/                # Next.js App Router pages
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── ...            # Feature-specific components
├── backend/            # AI Backend
│   ├── crews/         # CrewAI implementations
│   │   ├── seo_crew.py
│   │   ├── content_crew.py
│   │   ├── social_media_crew.py
│   │   ├── lead_generation_crew.py
│   │   ├── client_service_crew.py
│   │   ├── contract_crew.py
│   │   ├── compliance_crew.py
│   │   ├── business_intelligence_crew.py
│   │   └── master_orchestrator.py
│   ├── gradio_apps/   # Interactive AI demos
│   │   ├── mega_demo.py
│   │   └── launch_mega_demo.py
│   └── README.md      # Backend documentation
├── docs/              # Documentation
│   └── AI_SERVICES.md # Comprehensive AI guide
├── lib/               # Utility functions and helpers
├── public/            # Static assets
├── styles/            # Global styles and CSS modules
├── design-system.css  # Custom design tokens
├── next.config.js     # Next.js configuration
├── package.json       # Dependencies and scripts
├── postcss.config.js  # PostCSS configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add your environment variables here
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## ✨ Website Features

- ⚡ **Ultra-Fast Performance**: Next.js 14 with edge optimization
- 🎨 **Modern Design**: Glassmorphism, gradients, and micro-interactions
- 🤖 **AI Showcase**: Interactive demos of our AI capabilities
- 📱 **Fully Responsive**: Flawless experience on all devices
- 🌓 **Dark/Light Mode**: Sophisticated theme switching
- 🎭 **Smooth Animations**: Framer Motion for engaging UX
- 🔒 **Enterprise Security**: SOC 2 compliant infrastructure
- ♿ **WCAG Compliant**: Fully accessible design
- 📊 **Analytics Ready**: Integrated performance tracking
- 🚀 **SEO Optimized**: Built for maximum visibility

## Tech Stack

### Frontend
- Next.js 14.1.0
- React 18.2.0
- TypeScript 5
- Tailwind CSS 3.3.0
- PostCSS
- Custom design system

### Backend AI Platform
- **CrewAI Framework**: Multi-agent orchestration
- **LangChain**: AI application framework
- **Gradio**: Interactive AI demos
- **Python 3.11+**: Core AI runtime
- **OpenAI/Local LLMs**: Language model flexibility

### UI Components
- Radix UI primitives
- Lucide React icons
- Custom component library
- Framer Motion animations

### Development Tools
- ESLint
- Jest for testing
- TypeScript strict mode
- Pytest for AI testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## 🏢 About HODOS 360 LLC

We're revolutionizing the legal industry with AI-powered solutions that transform how law firms operate, market, and interact with clients. Our comprehensive suite of AI platforms provides law firms with the technology they need to thrive in the digital age.

### Our Mission
Empower law firms with cutting-edge AI technology to enhance efficiency, improve client experiences, and drive unprecedented growth.

### Contact
- **Website**: [www.hodos360.com](https://www.hodos360.com)
- **Email**: hello@hodos360.com
- **LinkedIn**: [HODOS 360 LLC](https://linkedin.com/company/hodos360)

---

Built with ❤️ and AI by HODOS 360 LLC | Transforming Legal Tech