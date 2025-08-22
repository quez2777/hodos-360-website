# CLAUDE.md - HODOS 360 LLC Project Guidelines

## 🎯 Project Overview
HODOS 360 LLC is an AI-powered legal tech company offering three flagship products:
1. **HODOS** - Complete AI law firm management system
2. **HODOS Marketing Platform** - AI SEO and paid marketing
3. **HODOS VIDEO Agents** - Video/voice AI for reception, intake, and sales

## 🎨 Design Philosophy
- **Ultra-Modern**: Cutting-edge design with glassmorphism, gradients, and micro-interactions
- **Professional**: Conveys trust and innovation for law firms
- **AI-Forward**: Showcase AI capabilities through interactive elements
- **Performance**: Lightning-fast with smooth animations

## 🎭 Brand Voice & Tone
- **Innovative**: We're revolutionizing legal tech
- **Professional**: Trusted by top law firms
- **Confident**: Leaders in AI legal solutions
- **Clear**: Complex tech explained simply

## 🏗️ Development Standards

### Component Architecture
```typescript
// All components should follow this pattern
interface ComponentProps {
  className?: string
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Component: React.FC<ComponentProps> = ({ 
  className, 
  children, 
  variant = 'primary',
  size = 'md' 
}) => {
  // Implementation
}
```

### Animation Guidelines
- Use Framer Motion for all animations
- Stagger animations for lists
- Subtle hover effects on interactive elements
- Page transitions should be smooth but quick

### Color Usage
- **Primary**: Lapis Lazuli gradient for main CTAs
- **Gold**: Accent for premium features
- **Glass**: Semi-transparent backgrounds with blur
- **Dark Mode**: Must look equally stunning

## 📁 File Organization
```
components/
├── ui/           # Reusable UI components
├── sections/     # Page sections (Hero, Features, etc.)
├── products/     # Product-specific components
├── animations/   # Animation wrappers
└── layout/       # Header, Footer, Navigation
```

## 🔧 Key Features to Implement

### Homepage Sections
1. **Hero**: Video background with AI visualization
2. **Products Showcase**: Interactive cards for each product
3. **Benefits**: Animated statistics and ROI calculator
4. **Tech Stack**: Modern tech visualization
5. **Testimonials**: Client success stories
6. **CTA**: Book a demo form

### Product Pages
- Interactive demos
- Feature comparisons
- Pricing calculators
- Case studies
- Integration guides

### Interactive Elements
- AI chat preview
- Live SEO analysis demo
- Video agent interaction sample
- ROI calculator
- Performance metrics dashboard

## 🚀 Performance Requirements
- Lighthouse score > 95
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Cumulative Layout Shift < 0.1

## 🔒 Security Considerations
- Implement CSP headers
- Sanitize all user inputs
- Use environment variables for sensitive data
- Regular dependency updates

## 📱 Responsive Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px - 1440px
- Wide: 1440px+

## 🧪 Testing Requirements
- Unit tests for utilities
- Component tests for UI
- E2E tests for critical paths
- Accessibility testing

## 📈 Analytics & Tracking
- Google Analytics 4
- Conversion tracking
- User behavior heatmaps
- A/B testing framework

## 🎯 Conversion Optimization
- Clear CTAs on every page
- Demo booking prominently featured
- Social proof throughout
- Trust badges and certifications
- Live chat integration

## 💡 AI Integration Points
- Chatbot for instant support
- Personalized content recommendations
- Dynamic pricing based on firm size
- Automated lead qualification
- Smart content generation

## 🚦 Deployment Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] SEO meta tags configured
- [ ] Analytics implemented
- [ ] Security headers set
- [ ] Error tracking enabled
- [ ] SSL configured
- [ ] CDN optimized
- [ ] Monitoring alerts set

Remember: We're building the future of legal tech. Every pixel should reflect innovation, trust, and cutting-edge technology.