import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { todayIso } from "@/lib/format";

// Server-only route — this is the one place the Anthropic API key is read.
// Never expose it to the client; that's the whole reason this route exists
// instead of calling Claude directly from the browser.

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 20000;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

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

const SYSTEM_PROMPT = `You extract structured bill or debt information from whatever you're given — a short plain-English description, a scanned document, a screenshot, or a CSV/text export.

Find every distinct bill or debt present and return one entry per item in "entries" (an empty list if you find nothing billable).

For each entry, decide "kind":
- "bill" for a regular, expected obligation (rent, a subscription, a phone bill).
- "debt" for something off the normal bill cycle, already late, a loan, or anything with an escalating penalty (like a ticket).

Compute "dueDate" as an absolute ISO date (YYYY-MM-DD) from the "today" date given and any relative or explicit date in the source. Use null if no date is implied.
Only set "recurrence" when clearly a repeating cadence; otherwise null.
Only set "penaltyAmount"/"penaltyAfterDate" when an amount increases after a date; otherwise null.
Use null for "notes" unless there's meaningful extra context worth keeping.`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | {
      type: "image";
      source: { type: "base64"; media_type: (typeof SUPPORTED_IMAGE_TYPES)[number]; data: string };
    };

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Smart entry isn't set up yet — add ANTHROPIC_API_KEY to your environment to use it." },
      { status: 501 },
    );
  }

  const form = await request.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const file = form.get("file") as File | null;

  if (!text && !file) {
    return NextResponse.json({ error: "Add a description or a file first." }, { status: 400 });
  }

  if (file && file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "That file is too big — keep it under 8MB." }, { status: 400 });
  }

  const contentParts: ContentPart[] = [];

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (file.type === "application/pdf") {
      contentParts.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
      });
    } else if (file.type.startsWith("image/")) {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
        return NextResponse.json(
          { error: "That image type isn't supported — try PNG, JPG, GIF, or WebP." },
          { status: 400 },
        );
      }
      contentParts.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.type as (typeof SUPPORTED_IMAGE_TYPES)[number],
          data: buffer.toString("base64"),
        },
      });
    } else {
      const raw = buffer.toString("utf-8").slice(0, MAX_TEXT_CHARS);
      contentParts.push({ type: "text", text: `File "${file.name}":\n${raw}` });
    }
  }

  contentParts.push({
    type: "text",
    text: `Today's date is ${todayIso()}.${text ? ` Description: "${text}"` : ""}`,
  });

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentParts }],
      output_config: { format: zodOutputFormat(ParsedEntriesSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "Couldn't find anything to extract." }, { status: 422 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (err) {
    console.error("parse-entry error", err);
    if (err instanceof Anthropic.APIError) {
      const body = err.error as { error?: { message?: string } } | undefined;
      return NextResponse.json(
        { error: body?.error?.message ?? "Something went wrong talking to Claude." },
        { status: err.status ?? 502 },
      );
    }
    return NextResponse.json({ error: "Something went wrong talking to Claude." }, { status: 502 });
  }
}
