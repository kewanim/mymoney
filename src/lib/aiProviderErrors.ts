// Each AI SDK (Claude, ChatGPT, Gemini) throws its own error class with its
// own shape for the HTTP status the provider responded with. Centralized here
// so parse-entry and verify-key map all three the same way — a bad Gemini
// key should read as "unauthorized," not fall through to a generic 502 the
// way an unrecognized error class would.

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ApiError as GeminiApiError } from "@google/genai";

const DEFAULT_STATUS = 502;

export function statusFromProviderError(err: unknown, fallback: number = DEFAULT_STATUS): number {
  if (err instanceof Anthropic.APIError) return err.status ?? fallback;
  if (err instanceof OpenAI.APIError) return err.status ?? fallback;
  if (err instanceof GeminiApiError) return err.status ?? fallback;
  return fallback;
}
