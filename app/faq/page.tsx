"use client"

import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  const faqs = [
    {
      question: "How does RECOVR work?",
      answer: "RECOVR uses advanced AI technology to match lost and found items. When you report a lost item, our system analyzes the description and image to automatically search for potential matches among found items. Similarly, when institutions or users report found items, we notify owners of potentially matching lost items."
    },
    {
      question: "Is RECOVR free to use?",
      answer: "Yes, RECOVR is completely free for individual users. You can report lost items, search for found items, and use our AI matching features at no cost. Our goal is to help reunite people with their belongings."
    },
    {
      question: "How accurate is the AI matching system?",
      answer: "Our AI system provides highly accurate matching based on visual features, descriptions, and metadata. However, final verification should always be done by the user. We continuously improve our algorithms to provide better matches over time."
    },
    {
      question: "What information do I need to provide when reporting a lost item?",
      answer: "To report a lost item, you'll need to provide: the item name, detailed description, category, last known location, date and time lost, a photo of the item, and your contact information (phone or email) so people can reach you if they find your item."
    },
    {
      question: "How will I be notified if my item is found?",
      answer: "When our AI system detects a potential match, we'll send you a notification via the contact method you provided (email or phone). You'll receive details about the potential match and contact information to coordinate the return."
    },
    {
      question: "What happens to my personal information?",
      answer: "We take privacy seriously. Your contact information is only shared when there's a potential match for your lost item, and only for the purpose of returning your belongings. We never sell or share your data with third parties. See our Privacy Policy for full details."
    },
    {
      question: "Can institutions use RECOVR for their lost and found departments?",
      answer: "Yes! RECOVR offers administrative tools for schools, offices, and other institutions. Admins can upload videos for AI analysis, manage found items, and use our matching system to efficiently return items to their owners."
    },
    {
      question: "What types of items can I report?",
      answer: "You can report any type of lost item including electronics, clothing, bags, accessories, documents, keys, jewelry, toys, books, and more. Our AI system is trained to recognize a wide variety of objects."
    },
    {
      question: "How long are items kept in the system?",
      answer: "Lost item reports remain active until you mark them as found or cancel the report. Found items reported by institutions may have specific retention policies depending on their internal procedures."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard security measures including data encryption, secure servers, and strict access controls. Your personal information and uploaded images are protected against unauthorized access."
    },
    {
      question: "Can I edit or delete my lost item report?",
      answer: "Yes, you can edit your item details or delete your report at any time through your dashboard. If you find your item through other means, please update your report to avoid unnecessary notifications."
    },
    {
      question: "What if someone tries to claim my item falsely?",
      answer: "We recommend meeting in a safe, public location when arranging to retrieve your item. Ask for verification details about the item that only the true owner would know. If you suspect fraudulent activity, contact us immediately."
    },
    {
      question: "How does the map feature work?",
      answer: "Our map feature shows the locations where items were lost or found, helping you identify if an item might be yours based on proximity to where you lost it. You can select locations directly on the map when reporting items."
    },
    {
      question: "Can I search for items without creating an account?",
      answer: "Yes, you can browse and search lost items without creating an account. However, to report lost items, receive notifications, or contact other users, you'll need to create a free account."
    },
    {
      question: "What image formats are supported?",
      answer: "We support all common image formats including JPEG, PNG, and WebP. Images should be clear and well-lit for best AI matching results. Maximum file size is 5MB per image."
    },
    {
      question: "How can institutions integrate RECOVR?",
      answer: "Institutions can contact us to set up administrative accounts with additional features like bulk uploads, video analysis, and custom integration options. We provide training and support for staff members."
    }
  ]

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about RECOVR and our AI-powered lost and found platform.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still Have Questions?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you can't find the answer you're looking for, please don't hesitate to contact us. 
              We're here to help you reunite with your lost belongings.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> youssef.azizi@etu.univ-amu.fr</p>
              <p><strong>Phone:</strong> +33 7 49 49 10 42</p>
              <p><strong>Address:</strong> 22 traverse brun, 13016 Marseille, France</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}