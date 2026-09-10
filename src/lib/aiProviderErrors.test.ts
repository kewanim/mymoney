import { describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ApiError as GeminiApiError } from "@google/genai";
import { statusFromProviderError } from "./aiProviderErrors";

describe("statusFromProviderError", () => {
  it("reads the status off an Anthropic APIError", () => {
    const err = new Anthropic.APIError(401, { error: { message: "bad key" } }, "bad key", undefined);
    expect(statusFromProviderError(err)).toBe(401);
  });

  it("reads the status off an OpenAI APIError", () => {
    const err = new OpenAI.APIError(429, { error: { message: "rate limited" } }, "rate limited", undefined);
    expect(statusFromProviderError(err)).toBe(429);
  });

  // Regression: this case used to fall through to the generic 502 fallback
  // because the old status-mapping only recognized Anthropic and OpenAI
  // error classes — a bad Gemini key looked like a server failure instead
  // of an auth problem.
  it("reads the status off a Gemini ApiError", () => {
    const err = new GeminiApiError({ message: "invalid API key", status: 401 });
    expect(statusFromProviderError(err)).toBe(401);
  });

  it("falls back to 502 for an unrecognized error", () => {
    expect(statusFromProviderError(new Error("boom"))).toBe(502);
  });

  it("honors a custom fallback status", () => {
    expect(statusFromProviderError(new Error("boom"), 400)).toBe(400);
  });

  it("falls back when a recognized error class carries no status", () => {
    const err = new Anthropic.APIError(undefined, undefined, "no status", undefined);
    expect(statusFromProviderError(err)).toBe(502);
  });
});
