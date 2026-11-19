import { AIInsightSection } from '../components/AIInsightSection'
import { DashboardPreview } from '../components/DashboardPreview'
import { FeatureCards } from '../components/FeatureCards'
import { FinalCTA } from '../components/FinalCTA'
import { Footer } from '../components/Footer'
import { HeroSection } from '../components/HeroSection'
import { HowItWorks } from '../components/HowItWorks'
import { Navbar } from '../components/Navbar'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F7FA]">
      <Navbar />

      <main>
        <HeroSection />
        <DashboardPreview />
        <HowItWorks />
        <FeatureCards />
        <AIInsightSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
