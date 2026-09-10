import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { statusFromProviderError } from "@/lib/aiProviderErrors";
import type { AIProvider } from "@/lib/aiSettings";

// Lets the Settings card confirm a pasted key actually works before the
// user is mid-Smart-Entry — a bad key otherwise only surfaces as a failed
// parse. Each check is the cheapest authenticated call the provider's SDK
// offers (listing models), so it costs no generation tokens.

async function verifyClaude(apiKey: string): Promise<void> {
  const client = new Anthropic({ apiKey });
  await client.models.list({ limit: 1 });
}

async function verifyOpenAI(apiKey: string): Promise<void> {
  const client = new OpenAI({ apiKey });
  await client.models.list();
}

async function verifyGemini(apiKey: string): Promise<void> {
  const ai = new GoogleGenAI({ apiKey });
  await ai.models.list({ config: { pageSize: 1 } });
}

const VERIFIERS: Record<AIProvider, (apiKey: string) => Promise<void>> = {
  claude: verifyClaude,
  openai: verifyOpenAI,
  gemini: verifyGemini,
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { provider?: AIProvider; apiKey?: string } | null;
  const provider = body?.provider;
  const apiKey = body?.apiKey?.trim();

  if (!provider || !(provider in VERIFIERS)) {
    return NextResponse.json({ ok: false, error: "Unknown provider." }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Enter a key first." }, { status: 400 });
  }

  try {
    await VERIFIERS[provider](apiKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "That key didn't work.";
    return NextResponse.json({ ok: false, error: message }, { status: statusFromProviderError(err) });
  }
}
