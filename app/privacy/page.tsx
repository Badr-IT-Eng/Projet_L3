"use client"

import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <p className="text-muted-foreground">
                  When you report lost items, we collect contact information (email or phone number) 
                  to enable people who find your items to reach you. We also collect item descriptions, 
                  locations, and photos you voluntarily provide.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-muted-foreground">
                  We automatically collect information about how you use our service, including 
                  search queries, pages visited, and interaction patterns to improve our AI matching algorithms.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To facilitate the return of lost items to their owners</li>
                <li>To improve our AI object detection and matching capabilities</li>
                <li>To send notifications about potential matches for your lost items</li>
                <li>To provide customer support and respond to inquiries</li>
                <li>To analyze usage patterns and improve our services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We do not sell, trade, or otherwise transfer your personal information to third parties. 
                Your contact information is only shared when someone reports finding an item that matches 
                your lost item report, and only for the purpose of reuniting you with your belongings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes encryption 
                of sensitive data and secure server infrastructure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Request a copy of your data</li>
                <li>Report privacy concerns or violations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience, remember your 
                preferences, and analyze site usage. You can control cookie settings through your 
                browser preferences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> youssef.azizi@etu.univ-amu.fr</p>
                <p><strong>Phone:</strong> +33 7 49 49 10 42</p>
                <p><strong>Address:</strong> 22 traverse brun, 13016 Marseille, France</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}