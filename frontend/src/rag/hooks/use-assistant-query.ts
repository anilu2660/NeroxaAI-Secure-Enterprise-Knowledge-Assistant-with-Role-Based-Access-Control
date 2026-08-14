import { useCallback, useRef, useState } from "react";

import {
  createAssistantSession,
  sendAssistantMessage,
  normalizeAssistantMessage,
} from "@/api/assistant-service";
import type { AssistantQueryResponse } from "@/api/assistant-types";

interface UseAssistantQueryOptions {
  token?: string | null;
  departmentFilter?: string | null;
}

interface UseAssistantQueryResult {
  data: AssistantQueryResponse | null;
  pending: boolean;
  error: Error | null;
  sessionId: string | null;
  submit: (query: string) => Promise<AssistantQueryResponse | null>;
  reset: () => void;
  cancel: () => void;
}

export function useAssistantQuery({
  token,
  departmentFilter,
}: UseAssistantQueryOptions = {}): UseAssistantQueryResult {
  const [data, setData] = useState<AssistantQueryResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (query: string): Promise<AssistantQueryResponse | null> => {
      const trimmed = query.trim();
      if (!trimmed || pending) return null;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPending(true);
      setError(null);

      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const session = await createAssistantSession(
            trimmed.slice(0, 40) + (trimmed.length > 40 ? "..." : ""),
            { token, signal: controller.signal },
          );
          activeSessionId = session.id;
          setSessionId(session.id);
        }

        const message = await sendAssistantMessage(
          activeSessionId,
          trimmed,
          departmentFilter,
          { token, signal: controller.signal },
        );

        const result = normalizeAssistantMessage(
          { query: trimmed, department_filter: departmentFilter },
          message,
        );
        setData(result);
        return result;
      } catch (cause) {
        if (controller.signal.aborted) return null;
        const nextError = cause instanceof Error ? cause : new Error("Assistant request failed.");
        setError(nextError);
        return null;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setPending(false);
      }
    },
    [departmentFilter, pending, sessionId, token],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setData(null);
    setError(null);
    setPending(false);
    setSessionId(null);
  }, []);

  return { data, pending, error, sessionId, submit, reset, cancel };
}
