import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t border-hairline/80 bg-card/40 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="size-6 text-foreground" />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                NeroxaAI
              </span>
            </Link>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Secure enterprise knowledge assistant with Retrieval-Augmented Generation, Role-Based Access Control, and air-gapped local AI inference.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Architecture & Capabilities */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
              Capabilities
            </p>
            <ul className="space-y-2 text-[12.5px] text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Role-Based Access Control</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Qdrant Vector Database</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">BGE Cross-Encoder Reranker</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Local Ollama LLM</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Redis Semantic Cache</a></li>
            </ul>
          </div>

          {/* Col 3: Security & Trust */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
              Security &amp; Governance
            </p>
            <ul className="space-y-2 text-[12.5px] text-muted-foreground">
              <li><a href="#security" className="hover:text-primary transition-colors">Air-Gapped Privacy</a></li>
              <li><a href="#security" className="hover:text-primary transition-colors">OAuth2 &amp; SMS OTP Verification</a></li>
              <li><a href="#security" className="hover:text-primary transition-colors">SHA-256 Deduplication</a></li>
              <li><a href="#security" className="hover:text-primary transition-colors">Forensic Audit Logs</a></li>
              <li><a href="#security" className="hover:text-primary transition-colors">Departmental Boundaries</a></li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
              Workspace Platform
            </p>
            <ul className="space-y-2 text-[12.5px] text-muted-foreground">
              <li><Link to="/login" className="hover:text-primary transition-colors">Sign In / Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Workspace Dashboard</Link></li>
              <li><Link to="/assistant" className="hover:text-primary transition-colors">AI Knowledge Assistant</Link></li>
              <li><Link to="/documents" className="hover:text-primary transition-colors">Document Repository</Link></li>
              <li><Link to="/access" className="hover:text-primary transition-colors">Access Matrix</Link></li>
            </ul>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NeroxaAI Enterprise. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#security" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#security" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
