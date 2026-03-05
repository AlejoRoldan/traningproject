import { ENV, isFeatureAvailable } from "./env";
import { callGeminiChat, convertGeminiToOpenAI } from "./gemini";
import { invokeAnthropic, CLAUDE_MODELS } from "./anthropic";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ─── Helpers ────────────────────────────────────────────────────────────────

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") return part;
  if (part.type === "image_url") return part;
  if (part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");
    return { role, name, tool_call_id, content };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return { role, name, content: contentParts[0].text };
  }

  return { role, name, content: contentParts };
};

/**
 * Determine which AI provider to use.
 * Priority: explicit AI_PROVIDER env var → Anthropic (if key present) → Gemini
 */
function resolveProvider(): "anthropic" | "gemini" {
  if (ENV.AI_PROVIDER) return ENV.AI_PROVIDER;
  if (isFeatureAvailable.anthropic()) return "anthropic";
  if (isFeatureAvailable.gemini()) return "gemini";
  throw new Error(
    "No AI provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY."
  );
}

// ─── Anthropic invocation ────────────────────────────────────────────────────

async function invokeLLMWithAnthropic(
  params: InvokeParams
): Promise<InvokeResult> {
  const { messages, maxTokens, max_tokens } = params;

  const normalizedMessages = messages.map(normalizeMessage);

  // Extract system messages and build system string
  const systemParts = normalizedMessages
    .filter((m) => m.role === "system")
    .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)));

  const systemPrompt = systemParts.length > 0 ? systemParts.join("\n") : undefined;

  // Build Anthropic-compatible messages (user/assistant only)
  const anthropicMessages = normalizedMessages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

  // Determine if JSON output is requested
  const isJsonRequested =
    params.responseFormat?.type === "json_schema" ||
    params.responseFormat?.type === "json_object" ||
    params.response_format?.type === "json_schema" ||
    params.response_format?.type === "json_object" ||
    !!params.outputSchema ||
    !!params.output_schema;

  const systemFinal = isJsonRequested
    ? `${systemPrompt ?? ""}\n\nIMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.`.trim()
    : systemPrompt;

  const result = await invokeAnthropic({
    messages: anthropicMessages,
    system: systemFinal,
    model: CLAUDE_MODELS.SONNET,
    maxTokens: maxTokens ?? max_tokens ?? 8192,
  });

  return {
    id: `claude-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: result.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: result.content,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: result.usage.input_tokens,
      completion_tokens: result.usage.output_tokens,
      total_tokens: result.usage.total_tokens,
    },
  };
}

// ─── Gemini invocation ───────────────────────────────────────────────────────

async function invokeLLMWithGemini(
  params: InvokeParams
): Promise<InvokeResult> {
  if (!isFeatureAvailable.gemini()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const { messages, maxTokens, max_tokens } = params;

  const normalizedMessages = messages.map(normalizeMessage);

  const systemMessages = normalizedMessages.filter((m) => m.role === "system");
  const contentMessages = normalizedMessages.filter((m) => m.role !== "system");

  const geminiMessages = contentMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [
      {
        text:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      },
    ],
  }));

  const systemInstruction =
    systemMessages.length > 0
      ? {
          parts: [
            {
              text: systemMessages
                .map((m) =>
                  typeof m.content === "string"
                    ? m.content
                    : JSON.stringify(m.content)
                )
                .join("\n"),
            },
          ],
        }
      : undefined;

  const geminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: maxTokens || max_tokens || 8192,
    },
    ...(systemInstruction && { systemInstruction }),
  };

  const geminiResponse = await callGeminiChat(
    geminiRequest as Parameters<typeof callGeminiChat>[0],
    "gemini-2.0-flash"
  );

  const openaiResponse = convertGeminiToOpenAI(geminiResponse);

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: "gemini-2.0-flash",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: openaiResponse.content,
        },
        finish_reason: geminiResponse.candidates[0]?.finishReason || "stop",
      },
    ],
    usage: geminiResponse.usageMetadata
      ? {
          prompt_tokens: geminiResponse.usageMetadata.promptTokenCount,
          completion_tokens: geminiResponse.usageMetadata.candidatesTokenCount,
          total_tokens: geminiResponse.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Invoke the configured LLM (Anthropic Claude by default, Gemini as fallback).
 * All AI features in the platform route through this function.
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const provider = resolveProvider();

  if (provider === "anthropic") {
    try {
      return await invokeLLMWithAnthropic(params);
    } catch (error) {
      // Fallback to Gemini if Anthropic fails and Gemini is available
      if (isFeatureAvailable.gemini()) {
        console.warn(
          "[LLM] Anthropic call failed, falling back to Gemini:",
          error instanceof Error ? error.message : error
        );
        return invokeLLMWithGemini(params);
      }
      throw error;
    }
  }

  return invokeLLMWithGemini(params);
}
