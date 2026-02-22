# AnalyzicAI Landing Page

The official landing page for AnalyzicAI.com - showcasing the family of AI-powered analysis tools.

## Overview

AnalyzicAI is the brand umbrella for a suite of AI-powered analysis applications:

- **UXicAI** - AI-powered UI/UX design analysis
- **SolidicAI** - Smart contract security and optimization analysis

## Features

- 🎨 Modern, responsive single-page design
- 🌓 Dark mode support
- ⚡ Built with Next.js 15 and React 19
- 🎯 Tailwind CSS for styling
- 📱 Mobile-first responsive design
- ♿ Accessibility focused
- 🚀 Optimized performance

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The app runs on port 3000 by default.

## Project Structure

```
apps/analyzicai/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Main landing page
│   │   └── globals.css     # Global styles and animations
│   └── components/
│       ├── Navigation.tsx   # Sticky nav with mobile menu
│       ├── Hero.tsx        # Hero section with CTA
│       ├── Features.tsx    # Feature grid
│       ├── AppsShowcase.tsx # App family showcase
│       ├── HowItWorks.tsx  # Process explanation
│       ├── CTA.tsx         # Call to action
│       └── Footer.tsx      # Footer with links
├── public/                 # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Components

### Navigation
- Sticky header with scroll detection
- Mobile-responsive hamburger menu
- Smooth scroll to sections
- Brand logo and links

### Hero
- Gradient background with animations
- Main value proposition
- Dual CTAs
- Stats showcase

### Features
- 6-item grid showcasing core features
- Icon-based cards with gradients
- Hover effects and animations

### AppsShowcase
- Detailed cards for each app in the family
- Key features lists
- External links to apps
- Status badges

### HowItWorks
- 4-step process visualization
- Connected timeline on desktop
- Step-by-step explanation
- Additional info panel

### CTA
- Strong call to action
- Multiple app links
- Feature highlights
- Gradient background

### Footer
- Multi-column layout
- App links
- Resources and company info
- Social media links

## Design System

### Colors
- Primary: Blue shades (sky-blue palette)
- Secondary: Purple shades
- Uses Tailwind's extended color palette

### Typography
- Font: Inter (Google Fonts)
- Hierarchy: 5xl-7xl for headers, xl-2xl for body

### Animations
- Float animation for background elements
- Gradient animation for backgrounds
- Hover effects on interactive elements
- Smooth scroll behavior

## Deployment

The app is designed to be deployed on Vercel:

```bash
pnpm build
```

Set the root directory to `apps/analyzicai` in Vercel dashboard.

## License

Part of the AnalyzicAI monorepo.
