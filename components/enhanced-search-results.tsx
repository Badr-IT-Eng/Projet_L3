"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactModal } from "@/components/contact-modal"
import { MapPin, Calendar, MessageCircle, Eye, TrendingUp, Sparkles } from "lucide-react"
import Image from "next/image"

interface SearchResult {
  id: number
  name: string
  location: string
  date: string
  image: string
  matchScore: number
  category: string
  itemType?: string
  status?: string
}

interface EnhancedSearchResultsProps {
  results: SearchResult[]
  totalMatches: number
  searchQuality: string
  topScore?: number
  isLoading?: boolean
}

export function EnhancedSearchResults({ 
  results, 
  totalMatches, 
  searchQuality, 
  topScore,
  isLoading = false 
}: EnhancedSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (totalMatches === 0) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No High-Quality Matches Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              Try uploading a clearer image or check if similar items exist in the database.
            </p>
          </div>
          {topScore && (
            <div className="text-xs text-gray-400">
              Best similarity: {topScore.toFixed(1)}% (threshold: 65%)
            </div>
          )}
        </div>
      </Card>
    )
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-green-400" 
    if (score >= 70) return "bg-yellow-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const getMatchLabel = (score: number) => {
    if (score >= 90) return "Excellent Match"
    if (score >= 80) return "Very Good Match"
    if (score >= 70) return "Good Match"
    if (score >= 60) return "Fair Match"
    return "Weak Match"
  }

  return (
    <div className="space-y-6">
      {/* Search Quality Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">
            Search Results ({totalMatches} {totalMatches === 1 ? 'match' : 'matches'})
          </h2>
        </div>
        {searchQuality === 'high' && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            High Quality Results
          </Badge>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-0">
              <div className="flex gap-0">
                {/* Image Section */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={result.image}
                    alt={result.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                  {/* Match Score Overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      className={`${getMatchScoreColor(result.matchScore)} text-white text-xs px-2 py-1`}
                    >
                      {result.matchScore.toFixed(0)}%
                    </Badge>
                  </div>
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                        {result.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {getMatchLabel(result.matchScore)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{result.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                        {result.itemType && (
                          <Badge 
                            variant={result.itemType === 'FOUND' ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            {result.itemType}
                          </Badge>
                        )}
                      </div>
                      
                      <ContactModal itemId={result.id} itemName={result.name}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {result.itemType === 'FOUND' ? 'Contact Finder' : 'Contact Owner'}
                        </Button>
                      </ContactModal>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Tips */}
      {totalMatches > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900">Found a Match?</h4>
                <p className="text-sm text-blue-700">
                  Click "Contact Owner" to send a message. Be sure to provide details that prove the item is yours.
                  The owner will receive your message and can respond directly to your email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}