"""
LLM Prompts

Prompt templates for the RAG pipeline.
Constructs system and user prompts with retrieved context and source citations.
"""


# System prompt that defines the assistant's behavior
SYSTEM_PROMPT = """You are an Enterprise Knowledge Assistant. Your role is to answer 
questions accurately based ONLY on the provided context documents. 

Rules:
1. Answer ONLY from the provided context. Do not use external knowledge.
2. If the context does not contain enough information to answer, say so clearly.
3. Always cite your sources using the document title and page number.
4. Be concise, professional, and accurate.
5. If multiple documents are relevant, synthesize information across them.
6. Format citations as [Source: document_title, Page: page_number].
"""


def build_context_prompt(context_chunks: list[dict]) -> str:
    """
    Build the context section from retrieved document chunks.

    Args:
        context_chunks: List of dicts with keys:
            - content: str (the text chunk)
            - title: str (document title)
            - page_number: int (source page)
            - department: str (owning department)

    Returns:
        Formatted context string for the LLM prompt.
    """
    if not context_chunks:
        return "No relevant documents found."

    context_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        title = chunk.get("title", "Unknown Document")
        page = chunk.get("page_number", "N/A")
        department = chunk.get("department", "General")
        content = chunk.get("content", "")

        context_parts.append(
            f"--- Document {i} ---\n"
            f"Title: {title}\n"
            f"Department: {department}\n"
            f"Page: {page}\n"
            f"Content:\n{content}\n"
        )

    return "\n".join(context_parts)


def build_query_prompt(query: str, context_chunks: list[dict]) -> str:
    """
    Build the full user prompt with context and query.

    Args:
        query: The user's question.
        context_chunks: Retrieved document chunks with metadata.

    Returns:
        Formatted prompt string ready to send to the LLM.
    """
    context = build_context_prompt(context_chunks)

    return (
        f"Context Documents:\n"
        f"{context}\n\n"
        f"Question: {query}\n\n"
        f"Instructions: Answer the question based on the context above. "
        f"Include citations in the format [Source: document_title, Page: page_number] "
        f"for every claim you make."
    )
