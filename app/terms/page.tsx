"use client"

import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                By accessing and using RECOVR, you accept and agree to be bound by the terms and 
                provisions of this agreement. These Terms of Service govern your use of our lost 
                and found platform and AI-powered object detection services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                RECOVR is a lost and found platform that uses artificial intelligence to help users 
                report lost items, search for found items, and facilitate the return of belongings 
                to their rightful owners. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Lost item reporting and management</li>
                <li>AI-powered object detection and matching</li>
                <li>Search and discovery tools</li>
                <li>Contact facilitation between users</li>
                <li>Administrative tools for institutions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Accurate Information</h3>
                  <p className="text-muted-foreground">
                    You agree to provide accurate, complete, and truthful information when reporting 
                    lost or found items. Misrepresentation of ownership or false claims are prohibited.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Lawful Use</h3>
                  <p className="text-muted-foreground">
                    You must use our services only for lawful purposes and in accordance with these 
                    Terms. You may not use the platform to facilitate illegal activities or harassment.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <p className="text-muted-foreground">
                    You must provide valid contact information to enable communication regarding 
                    your lost or found items. You are responsible for maintaining current contact details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Making false claims about lost or found items</li>
                <li>Attempting to claim items that do not belong to you</li>
                <li>Using the platform for commercial purposes without authorization</li>
                <li>Uploading inappropriate, offensive, or copyrighted content</li>
                <li>Attempting to circumvent our security measures</li>
                <li>Harassment or inappropriate contact with other users</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The RECOVR platform, including its AI algorithms, design, and functionality, is 
                protected by intellectual property laws. Users retain ownership of content they 
                upload but grant us license to use it for service operation and improvement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                RECOVR is provided "as is" without warranties of any kind. While we strive to provide 
                accurate AI matching and reliable service, we cannot guarantee the return of lost items 
                or the accuracy of our detection algorithms. Users participate at their own risk.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                RECOVR and its operators shall not be liable for any direct, indirect, incidental, 
                special, or consequential damages arising from the use of our services, including 
                but not limited to the loss of items, failed matches, or communication issues between users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to terminate or suspend access to our services at any time, 
                without prior notice, for conduct that we believe violates these Terms or is harmful 
                to other users or the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Changes will be 
                effective immediately upon posting. Your continued use of the service constitutes 
                acceptance of the revised terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us:
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