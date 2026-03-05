import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

/**
 * Anthropic Claude client for the Kaitel Training Platform.
 * Used as the primary LLM provider for evaluation, coaching, and client simulation.
 */

// Available Claude models (ordered by capability)
export const CLAUDE_MODELS = {
  /** Most intelligent: complex evaluations, coaching plans, trend analysis */
  OPUS: "claude-opus-4-6",
  /** Best balance of speed/intelligence: client simulation, feedback generation */
  SONNET: "claude-sonnet-4-6",
  /** Fastest: simple tasks, keyword detection, quick summaries */
  HAIKU: "claude-haiku-4-5-20251001",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

let _anthropicClient: Anthropic | null = null;

/**
 * Get or create the Anthropic client singleton.
 */
export function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    if (!ENV.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    _anthropicClient = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });
  }
  return _anthropicClient;
}

/**
 * Check if Anthropic is available.
 */
export function isAnthropicAvailable(): boolean {
  return !!ENV.ANTHROPIC_API_KEY;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicInvokeParams {
  messages: AnthropicMessage[];
  system?: string;
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
}

export interface AnthropicInvokeResult {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model: string;
}

/**
 * Invoke Claude with the given messages and return a structured result.
 * This is the core function used by all AI features in the platform.
 */
export async function invokeAnthropic(
  params: AnthropicInvokeParams
): Promise<AnthropicInvokeResult> {
  const client = getAnthropicClient();
  const model = params.model ?? CLAUDE_MODELS.SONNET;
  const maxTokens = params.maxTokens ?? 8192;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
    ...(params.temperature !== undefined
      ? { temperature: params.temperature }
      : {}),
  });

  const content =
    response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("") ?? "";

  return {
    content,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    model: response.model,
  };
}

/**
 * Invoke Claude and parse the response as JSON.
 * Handles both raw JSON and JSON wrapped in markdown code blocks.
 */
export async function invokeAnthropicJSON<T = unknown>(
  params: AnthropicInvokeParams
): Promise<T> {
  // Append JSON instruction to system prompt
  const systemWithJSON = params.system
    ? `${params.system}\n\nIMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.`
    : "Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.";

  const result = await invokeAnthropic({ ...params, system: systemWithJSON });

  let jsonText = result.content.trim();

  // Strip markdown code blocks if present
  if (jsonText.startsWith("```")) {
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonText = match[1].trim();
    }
  }

  return JSON.parse(jsonText) as T;
}
