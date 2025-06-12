import { Users, Map, Search, ThumbsUp } from "lucide-react"

const stats = [
  {
    icon: <Users className="h-5 w-5" />,
    value: "10K+",
    label: "Active Users",
  },
  {
    icon: <Map className="h-5 w-5" />,
    value: "250+",
    label: "Locations",
  },
  {
    icon: <Search className="h-5 w-5" />,
    value: "15K+",
    label: "Items Found",
  },
  {
    icon: <ThumbsUp className="h-5 w-5" />,
    value: "95%",
    label: "Success Rate",
  },
]

export function Stats() {
  return (
    <section className="border-y py-12 bg-muted/20">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <div className="text-primary">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 