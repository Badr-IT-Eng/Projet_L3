"use client"

import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, CameraIcon, Search as SearchIcon, CheckCircle, BarChart, BellRing } from "lucide-react"

export function FeatureGallery() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
            How <span className="text-gradient">RECOVR</span> Works
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg/relaxed">
            Our advanced AI system efficiently connects people with their lost items through a simple process
          </p>
        </div>
        
        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="report" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="report" className="data-[state=active]:bg-background">
                <div className="flex items-center gap-2">
                  <CameraIcon className="h-4 w-4" />
                  <span>Report</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="match" className="data-[state=active]:bg-background">
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4" />
                  <span>Match</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="recover" className="data-[state=active]:bg-background">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Recover</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="report" className="border rounded-lg p-1">
              <div className="relative overflow-hidden rounded-md aspect-video bg-muted">
                <Image 
                  src="/report-step.svg" 
                  alt="Reporting lost item on RECOVR"
                  fill
                  className="object-cover rounded-xl shadow-xl border border-border"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Report Your Lost Item</h3>
                  <p className="text-sm text-white/80">
                    Take a photo or upload an image of your lost item along with a description and location details.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/report-detail.svg"
                      alt="Adding item details on RECOVR" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/mobile-upload.svg"
                      alt="Mobile reporting on RECOVR" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="match" className="border rounded-lg p-1">
              <div className="relative overflow-hidden rounded-md aspect-video bg-muted">
                <Image 
                  src="/matching-step.svg" 
                  alt="AI matching process" 
                  fill 
                  className="object-cover rounded-xl shadow-xl border border-border"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">AI-Powered Matching</h3>
                  <p className="text-sm text-white/80">
                    Our advanced AI analyzes images to find potential matches from our database with high accuracy.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/ai-analysis.svg"
                      alt="AI vision analysis" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/matching-results.svg"
                      alt="Item matching results" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="recover" className="border rounded-lg p-1">
              <div className="relative overflow-hidden rounded-md aspect-video bg-muted">
                <Image 
                  src="/recover-step.svg" 
                  alt="Recovering lost item" 
                  fill 
                  className="object-cover rounded-xl shadow-xl border border-border"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Recover Your Item</h3>
                  <p className="text-sm text-white/80">
                    Get notified when your item is found and arrange for safe recovery through our secure system.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/notify-step.svg"
                      alt="Notification on RECOVR" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-[4/3]">
                    <Image 
                      src="/handover.svg"
                      alt="Item handover" 
                      fill 
                      className="object-cover rounded-xl shadow-xl border border-border"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Mobile-Ready</h3>
            <p className="text-sm text-muted-foreground">
              Report and track your lost items on the go with our responsive mobile interface.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BellRing className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Get immediate notifications when a potential match for your item is found.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Recovery Rate</h3>
            <p className="text-sm text-muted-foreground">
              Our system boasts a 96% success rate for returning items to their owners.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
} 