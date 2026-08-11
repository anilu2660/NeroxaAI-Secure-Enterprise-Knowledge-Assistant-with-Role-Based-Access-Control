import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { askAssistant, getAssistantTools } from "@/api/workspace-service";
import type { AssistantAnswer } from "@/api/types";
import { AssistantComposer, type ComposerSubmission } from "@/rag/components/AssistantComposer";

/**
 * Dashboard AI query composer. Reuses the assistant composer so every control
 * (attachments, web search, tool selection) behaves identically, and submits
 * through the same `askAssistant` service boundary.
 */
export function AiComposer({
  suggestions,
  actor,
  onAnswer,
}: {
  suggestions: string[];
  actor?: string;
  onAnswer?: (answer: AssistantAnswer) => void;
}) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const tools = useQuery({ queryKey: ["assistant-tools"], queryFn: getAssistantTools });

  const handleSubmit = async (submission: ComposerSubmission) => {
    if (pending) return;
    setPending(true);
    setNotice(null);
    try {
      const answer = await askAssistant({
        question: submission.question,
        attachments: submission.attachments,
        webSearch: submission.webSearch,
        toolIds: submission.toolIds,
        ...(actor ? { actor } : {}),
      });
      onAnswer?.(answer);
      setNotice(
        answer.status === "live"
          ? "Answer updated below."
          : "Question recorded in this session. No AI provider or retrieval service is connected, so no answer or sources were generated.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <AssistantComposer
        onSubmit={(submission) => void handleSubmit(submission)}
        pending={pending}
        suggestions={suggestions}
        tools={tools.data ?? []}
      />

      {notice ? (
        <p
          role="status"
          className="mt-2.5 rounded-xl border border-hairline bg-card/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
