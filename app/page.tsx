import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorks } from "@/components/how-it-works"
import { FeatureGallery } from "@/components/feature-gallery"
import { Testimonials } from "@/components/testimonials"

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeatureGallery />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
    </div>
  )
}
