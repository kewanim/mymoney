import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { todayIso } from "@/lib/format";
import { statusFromProviderError } from "@/lib/aiProviderErrors";
import { xlsxToText } from "@/lib/xlsxToText";

// Server-only route. The API key comes from the client on every request —
// each user brings their own key (Claude/ChatGPT/Gemini), stored only in
// their browser's localStorage, never on this server.

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 20000;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
const XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type AIProvider = "claude" | "openai" | "gemini";
const PROVIDER_LABEL: Record<AIProvider, string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

const ParsedEntrySchema = z.object({
  kind: z.enum(["bill", "debt"]),
  name: z.string(),
  amount: z.number(),
  dueDate: z.string().nullable(),
  recurrence: z.enum(["none", "weekly", "biweekly", "monthly", "yearly"]).nullable(),
  penaltyAmount: z.number().nullable(),
  penaltyAfterDate: z.string().nullable(),
  notes: z.string().nullable(),
});

const ParsedEntriesSchema = z.object({
  entries: z.array(ParsedEntrySchema).max(25),
});
type ParsedEntries = z.infer<typeof ParsedEntriesSchema>;

const SYSTEM_PROMPT = `You extract structured bill or debt information from whatever you're given — a short plain-English description, a scanned document, a screenshot, or a CSV/text export.

Find every distinct bill or debt present and return one entry per item in "entries" (an empty list if you find nothing billable).

For each entry, decide "kind":
- "bill" for a regular, expected obligation (rent, a subscription, a phone bill).
- "debt" for something off the normal bill cycle, already late, a loan, or anything with an escalating penalty (like a ticket).

Compute "dueDate" as an absolute ISO date (YYYY-MM-DD) from the "today" date given and any relative or explicit date in the source. Use null if no date is implied.
Only set "recurrence" when clearly a repeating cadence; otherwise null.
Only set "penaltyAmount"/"penaltyAfterDate" when an amount increases after a date; otherwise null.
Use null for "notes" unless there's meaningful extra context worth keeping.`;

// Provider-agnostic representation of what the user submitted — each
// adapter below maps this to its own provider's wire format.
type RawInput =
  | { kind: "text"; text: string }
  | { kind: "pdf"; base64: string }
  | { kind: "image"; base64: string; mediaType: (typeof SUPPORTED_IMAGE_TYPES)[number] };

async function buildRawInputs(request: Request): Promise<
  | { ok: true; inputs: RawInput[] }
  | { ok: false; status: number; error: string }
> {
  const form = await request.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const file = form.get("file") as File | null;

  if (!text && !file) {
    return { ok: false, status: 400, error: "Add a description or a file first." };
  }
  if (file && file.size > MAX_FILE_BYTES) {
    return { ok: false, status: 400, error: "That file is too big — keep it under 8MB." };
  }

  const inputs: RawInput[] = [];

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const isXlsx = file.type === XLSX_MEDIA_TYPE || /\.xlsx$/i.test(file.name);
    const isLegacyXls = /\.xls$/i.test(file.name) && !isXlsx;

    if (file.type === "application/pdf") {
      inputs.push({ kind: "pdf", base64: buffer.toString("base64") });
    } else if (file.type.startsWith("image/")) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
        return { ok: false, status: 400, error: "That image type isn't supported — try PNG, JPG, GIF, or WebP." };
      }
      inputs.push({
        kind: "image",
        base64: buffer.toString("base64"),
        mediaType: file.type as (typeof SUPPORTED_IMAGE_TYPES)[number],
      });
    } else if (isLegacyXls) {
      return { ok: false, status: 400, error: "Old-format .xls isn't supported — save it as .xlsx and try again." };
    } else if (isXlsx) {
      let sheetText: string;
      try {
        sheetText = await xlsxToText(buffer);
      } catch {
        return { ok: false, status: 400, error: "Couldn't read that spreadsheet." };
      }
      inputs.push({ kind: "text", text: `Spreadsheet "${file.name}":\n${sheetText.slice(0, MAX_TEXT_CHARS)}` });
    } else {
      const raw = buffer.toString("utf-8").slice(0, MAX_TEXT_CHARS);
      inputs.push({ kind: "text", text: `File "${file.name}":\n${raw}` });
    }
  }

  inputs.push({
    kind: "text",
    text: `Today's date is ${todayIso()}.${text ? ` Description: "${text}"` : ""}`,
  });

  return { ok: true, inputs };
}

async function extractWithClaude(apiKey: string, inputs: RawInput[]): Promise<ParsedEntries> {
  const client = new Anthropic({ apiKey });
  const content = inputs.map((input) => {
    if (input.kind === "text") return { type: "text" as const, text: input.text };
    if (input.kind === "pdf") {
      return {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: input.base64 },
      };
    }
    return {
      type: "image" as const,
      source: { type: "base64" as const, media_type: input.mediaType, data: input.base64 },
    };
  });

  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(ParsedEntriesSchema) },
  });

  if (!response.parsed_output) throw new Error("Couldn't find anything to extract.");
  return response.parsed_output;
}

async function extractWithOpenAI(apiKey: string, inputs: RawInput[]): Promise<ParsedEntries> {
  if (inputs.some((input) => input.kind === "pdf")) {
    throw new Error("PDF uploads aren't supported with ChatGPT yet — try Claude or Gemini for PDFs.");
  }

  const client = new OpenAI({ apiKey });
  const content = inputs.map((input) => {
    if (input.kind === "text") return { type: "text" as const, text: input.text };
    // Unreachable at runtime — the guard above already threw if any input
    // was a PDF — but TS needs this arm to narrow `input` to "image" below.
    if (input.kind === "pdf") throw new Error("PDF uploads aren't supported with ChatGPT yet.");
    return {
      type: "image_url" as const,
      image_url: { url: `data:${input.mediaType};base64,${input.base64}` },
    };
  });

  const completion = await client.chat.completions.parse({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    response_format: zodResponseFormat(ParsedEntriesSchema, "parsed_entries"),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) throw new Error("Couldn't find anything to extract.");
  return parsed;
}

const GEMINI_JSON_SCHEMA = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      maxItems: 25,
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["bill", "debt"] },
          name: { type: "string" },
          amount: { type: "number" },
          dueDate: { type: "string", nullable: true },
          recurrence: {
            type: "string",
            enum: ["none", "weekly", "biweekly", "monthly", "yearly"],
            nullable: true,
          },
          penaltyAmount: { type: "number", nullable: true },
          penaltyAfterDate: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
        },
        required: ["kind", "name", "amount", "dueDate", "recurrence", "penaltyAmount", "penaltyAfterDate", "notes"],
      },
    },
  },
  required: ["entries"],
};

async function extractWithGemini(apiKey: string, inputs: RawInput[]): Promise<ParsedEntries> {
  const ai = new GoogleGenAI({ apiKey });
  const input = [
    { type: "text" as const, text: SYSTEM_PROMPT },
    ...inputs.map((raw) => {
      if (raw.kind === "text") return { type: "text" as const, text: raw.text };
      if (raw.kind === "pdf") {
        return { type: "document" as const, data: raw.base64, mime_type: "application/pdf" };
      }
      return { type: "image" as const, data: raw.base64, mime_type: raw.mediaType };
    }),
  ];

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash",
    input,
    response_format: { type: "text", mime_type: "application/json", schema: GEMINI_JSON_SCHEMA },
  });

  const raw = interaction.output_text;
  if (!raw) throw new Error("Couldn't find anything to extract.");
  const result = ParsedEntriesSchema.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error("Gemini's response didn't match the expected shape.");
  return result.data;
}

export async function POST(request: Request) {
  const form = await request.clone().formData();
  const provider = form.get("provider") as AIProvider | null;
  const apiKey = (form.get("apiKey") as string | null)?.trim();

  if (!provider || !["claude", "openai", "gemini"].includes(provider)) {
    return NextResponse.json({ error: "Pick an AI provider in Settings first." }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: `Add your ${PROVIDER_LABEL[provider]} API key in Settings first.` },
      { status: 400 },
    );
  }

  const built = await buildRawInputs(request);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status });
  }

  try {
    const extractors: Record<AIProvider, (key: string, inputs: RawInput[]) => Promise<ParsedEntries>> = {
      claude: extractWithClaude,
      openai: extractWithOpenAI,
      gemini: extractWithGemini,
    };
    const result = await extractors[provider](apiKey, built.inputs);
    if (result.entries.length === 0) {
      return NextResponse.json({ error: "Couldn't find anything to extract." }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("parse-entry error", err);
    const message = err instanceof Error ? err.message : `Something went wrong talking to ${PROVIDER_LABEL[provider]}.`;
    return NextResponse.json({ error: message }, { status: statusFromProviderError(err) });
  }
}
