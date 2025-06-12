"use client"

import Link from "next/link"
import Image from "next/image"
import { Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/80 backdrop-blur-lg w-full">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="RECOVR Logo" width={140} height={40} />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Using advanced AI technology to help you recover your lost belongings quickly and efficiently.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-base font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { title: "Home", href: "/" },
                { title: "Lost Items", href: "/lost-objects" },
                { title: "Report Item", href: "/report" },
                { title: "Find Item", href: "/search" },
                { title: "Map", href: "/map" },
              ].map((link) => (
                <li key={link.title}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-base font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              {[
                { title: "Help Center", href: "/help" },
                { title: "Privacy Policy", href: "/privacy" },
                { title: "Terms of Service", href: "/terms" },
                { title: "FAQ", href: "/faq" },
                { title: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.title}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-base font-medium mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  123 Recovery Street, Tech Park<br />
                  San Francisco, CA 94107
                </span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href="mailto:contact@recovr.tech" className="text-muted-foreground hover:text-primary transition-colors">
                  contact@recovr.tech
                </a>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href="tel:+1-800-RECOVR" className="text-muted-foreground hover:text-primary transition-colors">
                  +1-800-RECOVR
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t py-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} RECOVR Technologies. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 