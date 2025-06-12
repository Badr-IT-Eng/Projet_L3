"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GradientButton } from "@/components/ui/gradient-button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, MapPin } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { NotificationDropdown } from "@/components/ui/notification-dropdown"

const mainNavItems = [
  { title: "Home", href: "/" },
  { title: "Lost Items", href: "/lost-objects" },
  { title: "Report Item", href: "/report" },
  { title: "Find Item", href: "/search", className: "dark:text-white dark:font-bold dark:hover:text-primary-300" },
  { title: "Map", href: "/map" },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center gap-8 text-base">
        {mainNavItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "transition-colors hover:text-primary py-2 relative group dark:hover:text-primary link-hover",
              pathname === item.href 
                ? "text-primary font-medium active-nav-item" 
                : "text-muted-foreground dark:text-gray-300",
              item.className
            )}
          >
            {item.title}
            <span className={cn(
              "absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300", 
              pathname === item.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            )}></span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="px-2 md:hidden dark:text-gray-300">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 sm:max-w-xs bg-background/95 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 px-2 mb-8">
          <Image src="/logo.svg" width={140} height={50} alt="RECOVR Logo" className="dark:filter dark:brightness-110" />
        </Link>
        <div className="my-6 flex flex-col gap-2">
          {mainNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex w-full items-center py-3 px-4 text-base font-medium transition-all rounded-md link-hover",
                pathname === item.href
                  ? "font-medium text-primary bg-primary/5 active-nav-item"
                  : "text-muted-foreground hover:bg-muted dark:text-gray-200 dark:hover:text-primary",
                item.className
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t space-y-4 px-2">
          <Button className="w-full hover:text-white dark:text-gray-300 dark:hover:text-white" variant="outline" asChild>
            <Link href="/auth/signin">Log in</Link>
          </Button>
          <GradientButton variant="dark" className="w-full" asChild>
            <Link href="/auth/register">Sign up</Link>
          </GradientButton>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <MobileNav />
            <Link href="/" className="flex items-center gap-2 mr-10 relative group">
              <div className="absolute -inset-2 rounded-xl bg-background opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Image 
                src="/logo.svg" 
                width={140} 
                height={50} 
                alt="RECOVR Logo" 
                priority 
                className="h-10 w-auto relative dark:filter dark:brightness-110" 
              />
            </Link>
            <MainNav />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex hover:bg-muted dark:text-gray-300 dark:hover:bg-gray-800">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex hover:bg-muted dark:text-gray-300 dark:hover:bg-gray-800">
              <MapPin className="h-5 w-5" />
              <span className="sr-only">Map</span>
            </Button>
            <NotificationDropdown className="mr-2 hidden sm:flex" />
            <ThemeToggle />
            <div className="hidden md:flex md:gap-3 ml-2">
              <Button variant="outline" size="sm" className="h-10 px-4 hover:text-white dark:text-gray-300" asChild>
                <Link href="/auth/signin">Log in</Link>
              </Button>
              <GradientButton variant="dark" size="sm" className="h-10 px-4" asChild>
                <Link href="/auth/register">Sign up</Link>
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 