import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    id: "item-1",
    question: "How does NeroxaAI prevent proprietary documents from leaking to public AI models?",
    answer:
      "NeroxaAI runs 100% on self-hosted inference engines (such as Ollama hosting Qwen 2.5 or Llama 3). Vectors and document chunks are processed entirely on your private server or VPC. No queries, embeddings, or documents are ever uploaded to OpenAI, Anthropic, or external cloud providers.",
  },
  {
    id: "item-2",
    question: "How does Role-Based Access Control (RBAC) restrict search results between employees?",
    answer:
      "When a user submits a question, the FastAPI middleware checks their authenticated JWT token, verified department, and role permissions. Qdrant vector queries are strictly pre-filtered so employees only search vectors belonging to their assigned departments or public clearance levels. An unauthorized employee cannot retrieve or see citations for restricted documents.",
  },
  {
    id: "item-3",
    question: "What document formats and file sizes are supported?",
    answer:
      "NeroxaAI supports PDF, DOCX, and TXT files up to 10MB per document. The engine automatically handles text extraction, sentence segmentation, token sliding window chunking, and SHA-256 deduplication to prevent duplicate embeddings.",
  },
  {
    id: "item-4",
    question: "How does the hybrid search & Cross-Encoder reranker improve response precision?",
    answer:
      "NeroxaAI combines dense semantic vector search (BAAI/bge-small-en-v1.5) with sparse keyword matching (BM25). The top candidate chunks are then scored by a Cross-Encoder reranker (ms-marco-MiniLM-L-6-v2) to ensure only the most authoritative context reaches the LLM prompt.",
  },
  {
    id: "item-5",
    question: "Can an administrator update role permissions and departments in real-time?",
    answer:
      "Yes. The Admin Dashboard includes a live Permission Matrix, User Management table with two-factor SMS status, Access Scope manager, and immutable Audit Logs that track all system interactions.",
  },
];

export function FaqSection() {
  return (
    <section id="documentation" className="relative mx-auto w-full max-w-[960px] px-5 sm:px-8 py-16 lg:py-24">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
          <HelpCircle className="size-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to know about NeroxaAI.
        </h2>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Clear answers regarding architecture, security isolation, and enterprise deployment.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-hairline/80 bg-card/60 p-6 sm:p-8 shadow-xl backdrop-blur-2xl">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="rounded-2xl border border-hairline/60 bg-secondary/20 px-4 transition-all duration-200 hover:border-primary/35 data-[state=open]:border-primary/40 data-[state=open]:bg-secondary/35"
            >
              <AccordionTrigger className="text-[13.5px] font-semibold text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[12.5px] leading-relaxed text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
