"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does Gaia verify impact?",
    answer:
      "We use a combination of satellite imagery, on-ground verification, and blockchain technology to ensure all reported impact is accurate and verifiable.",
  },
  {
    question: "How can I fund a project?",
    answer:
      "Browse our verified projects, select one that aligns with your values, and contribute directly through our platform. Your funds go directly to the project.",
  },
  {
    question: "What are carbon credits?",
    answer:
      "Carbon credits represent verified reductions in carbon emissions. One credit equals one metric ton of CO2 equivalent. You can earn, trade, or retire them.",
  },
  {
    question: "Who are node operators?",
    answer:
      "Node operators are community members who help verify and validate environmental impact data on our network. They earn rewards for their participation.",
  },
  {
    question: "Is blockchain used for transparency?",
    answer:
      "Yes, we use blockchain technology to create an immutable record of all transactions and impact metrics, ensuring complete transparency.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-foreground/70">Find answers to common questions about Gaia Protocol.</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/70 leading-relaxed">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
