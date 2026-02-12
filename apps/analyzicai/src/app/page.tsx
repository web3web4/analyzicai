import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AppsShowcase from '@/components/AppsShowcase';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <AppsShowcase />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
