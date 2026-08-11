import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface MarkdownProps {
  content: string;
  className?: string;
}

/** Code block component with copy button */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-hairline bg-secondary/40 font-mono text-[12px]">
      <div className="flex items-center justify-between border-b border-hairline/60 bg-secondary/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10.5px] hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-foreground/90 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Shadcn AI Markdown / Marker renderer component.
 * Parses headers, bold, italics, lists, code blocks, tables, blockquotes, and links cleanly.
 */
export function Markdown({ content, className = "" }: MarkdownProps) {
  if (!content) return null;

  // Split into blocks (code blocks vs regular paragraphs/lists)
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-2 text-[13px] leading-relaxed text-foreground/90 ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return <CodeBlock key={idx} language={block.language} code={block.content} />;
        }

        if (block.type === "header") {
          const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          const sizeClass =
            block.level === 1
              ? "text-[16px] font-semibold text-foreground mt-3 mb-1"
              : block.level === 2
                ? "text-[14.5px] font-semibold text-foreground mt-2.5 mb-1"
                : "text-[13.5px] font-medium text-foreground mt-2 mb-0.5";
          return (
            <Tag key={idx} className={sizeClass}>
              {renderInlineMarkdown(block.content)}
            </Tag>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClass = block.ordered
            ? "list-decimal list-inside space-y-1 pl-1 my-1.5"
            : "list-disc list-inside space-y-1 pl-1 my-1.5";
          return (
            <ListTag key={idx} className={listClass}>
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="text-foreground/85">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={idx}
              className="my-2 border-l-2 border-primary/50 bg-secondary/20 py-1.5 pl-3 pr-2 italic text-muted-foreground rounded-r-lg"
            >
              {renderInlineMarkdown(block.content)}
            </blockquote>
          );
        }

        if (block.type === "table") {
          return (
            <div key={idx} className="my-2 overflow-x-auto rounded-xl border border-hairline">
              <table className="w-full text-left text-[12px]">
                {block.headers.length > 0 && (
                  <thead className="border-b border-hairline bg-secondary/50 font-medium text-foreground">
                    <tr>
                      {block.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2">
                          {renderInlineMarkdown(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-hairline/40 last:border-0 hover:bg-secondary/20">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return <p key={idx}>{renderInlineMarkdown(block.content)}</p>;
      })}
    </div>
  );
}

/** Shadcn Skeleton marker loader for AI thinking / searching state */
export function MarkdownSkeleton({ message = "Searching knowledge base and generating answer…" }: { message?: string }) {
  return (
    <div className="space-y-2.5 py-1">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="font-medium text-foreground/80">{message}</span>
      </div>

      <div className="space-y-2 pt-1 max-w-[560px]">
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-[88%] rounded-md" />
        <Skeleton className="h-3.5 w-[65%] rounded-md" />
      </div>
    </div>
  );
}

// ─── Block Parser Helpers ──────────────────────────────────────────────────

type Block =
  | { type: "paragraph"; content: string }
  | { type: "header"; level: number; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Code block ```
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      continue;
    }

    // Headers #, ##, ###
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch && headerMatch[1] && headerMatch[2]) {
      blocks.push({
        type: "header",
        level: headerMatch[1].length,
        content: headerMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote >
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) {
        quoteLines.push((lines[i] ?? "").trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push({ type: "quote", content: quoteLines.join(" ") });
      continue;
    }

    // Bullet or Numbered Lists
    const isUnordered = /^\s*[-*+]\s+/.test(line);
    const isOrdered = /^\s*\d+\.\s+/.test(line);

    if (isUnordered || isOrdered) {
      const items: string[] = [];
      const isOrd = isOrdered;
      while (i < lines.length) {
        const curLine = lines[i] ?? "";
        const curUnordered = /^\s*[-*+]\s+/.test(curLine);
        const curOrdered = /^\s*\d+\.\s+/.test(curLine);
        if (curUnordered || curOrdered) {
          items.push(curLine.replace(/^\s*([-*+]|\d+\.)\s+/, ""));
          i++;
        } else if (curLine.trim() === "") {
          break;
        } else {
          if (items.length > 0) {
            items[items.length - 1] += " " + curLine.trim();
          }
          i++;
        }
      }
      blocks.push({ type: "list", ordered: isOrd, items });
      continue;
    }

    // Tables | header | header |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|") && (lines[i] ?? "").trim().endsWith("|")) {
        tableLines.push((lines[i] ?? "").trim());
        i++;
      }
      if (tableLines.length >= 2 && tableLines[0]) {
        const parseRow = (r: string) => r.split("|").slice(1, -1).map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        const bodyLines = tableLines.slice(1).filter((l) => !/^\|[\s-:]+\|/.test(l));
        const rows = bodyLines.map(parseRow);
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Regular paragraph
    if (line.trim()) {
      blocks.push({ type: "paragraph", content: line.trim() });
    }
    i++;
  }

  return blocks;
}

// ─── Inline Markdown Formatter ─────────────────────────────────────────────

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match inline code (`code`), bold (**bold**), italic (*italic*), links ([title](url))
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining) {
    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Italic *text*
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    // Link [title](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    const matches = [
      codeMatch ? { type: "code", match: codeMatch, index: codeMatch.index! } : null,
      boldMatch ? { type: "bold", match: boldMatch, index: boldMatch.index! } : null,
      italicMatch ? { type: "italic", match: italicMatch, index: italicMatch.index! } : null,
      linkMatch ? { type: "link", match: linkMatch, index: linkMatch.index! } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index);

    if (!matches.length) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === "code") {
      parts.push(
        <code
          key={keyIdx++}
          className="rounded-md border border-hairline bg-secondary/50 px-1.5 py-0.5 font-mono text-[11.5px] text-foreground/90"
        >
          {first.match[1]}
        </code>,
      );
    } else if (first.type === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-foreground">
          {first.match[1]}
        </strong>,
      );
    } else if (first.type === "italic") {
      parts.push(
        <em key={keyIdx++} className="italic text-foreground/90">
          {first.match[1]}
        </em>,
      );
    } else if (first.type === "link") {
      parts.push(
        <a
          key={keyIdx++}
          href={first.match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-90 transition-opacity"
        >
          {first.match[1]}
        </a>,
      );
    }

    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return parts;
}
