import type { AssistantQueryResponse } from "./assistant-types";

declare module "./types" {
  interface AssistantAnswer {
    execution?: AssistantQueryResponse | null;
  }
}

declare module "./assistant-types" {
  interface AssistantQueryResponse {
    webSearchStatus?: string | null;
  }
}
