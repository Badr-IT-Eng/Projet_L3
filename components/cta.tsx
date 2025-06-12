import Link from "next/link"
import { GradientButton } from "@/components/ui/gradient-button"
import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="border-t bg-muted/30 py-20">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 items-center">
          <div className="flex flex-col gap-4 text-center mx-auto max-w-[900px]">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Find Your Lost Items?</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Start using our AI-powered lost and found system today to quickly recover your valuable belongings.
              </p>
            </div>
            <div className="mx-auto flex flex-col sm:flex-row gap-4 min-[400px]:w-full min-[400px]:max-w-md">
              <Link href="/report" className="w-full">
                <GradientButton size="lg" className="w-full" animation="shimmer">
                  Get Started Now
                </GradientButton>
              </Link>
              <Link href="/search" className="w-full">
                <Button size="lg" variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 