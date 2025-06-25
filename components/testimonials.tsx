"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    content: "I lost my laptop in the campus library and was devastated. The RECOVR system helped me locate it within hours! The image matching technology is incredibly accurate.",
    author: { name: "Alex Johnson", role: "Student", avatarSrc: "/user-1.jpg" }
  },
  {
    content: "Lost my phone at a conference. I reported it on RECOVR and within a day, someone had found it and uploaded it to the system. The notification feature is fantastic!",
    author: { name: "Sarah Chen", role: "Software Engineer", avatarSrc: "/user-2.jpg" }
  },
  {
    content: "As someone who's constantly traveling for work, I'm prone to losing things. RECOVR has saved me multiple times by helping me recover my items quickly and efficiently.",
    author: { name: "Michael Rodriguez", role: "Business Consultant", avatarSrc: "/user-3.jpg" }
  },
  {
    content: "I use RECOVR to manage lost items in my classroom. The system is so intuitive that even my students can use it to report and find their lost belongings.",
    author: { name: "Emily Watson", role: "Teacher", avatarSrc: "/user-4.jpg" }
  }
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-24 lg:py-28 bg-gradient-to-b from-background to-muted/25">
      <div className="container">
        <div className="flex flex-col items-center justify-center space-y-4 text-center md:mx-auto md:max-w-3xl">
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-semibold">
            <span className="text-primary">Demo User Experiences</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg/relaxed">
            Sample testimonials showcasing the potential user experience with our recovery system.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 py-14 md:grid-cols-2 lg:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className={cn(
                "relative flex flex-col gap-4 rounded-xl border bg-background p-6 shadow transition-shadow hover:shadow-md",
                index === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.author.avatarSrc}
                    alt={testimonial.author.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-user.jpg";
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.author.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.author.role}</p>
                </div>
              </div>
              <blockquote className="text-pretty text-muted-foreground">
                "{testimonial.content}"
              </blockquote>
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 