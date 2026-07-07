import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { todayIso } from "@/lib/format";

// Server-only route — this is the one place the Anthropic API key is read.
// Never expose it to the client; that's the whole reason this route exists
// instead of calling Claude directly from the browser.

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

const SYSTEM_PROMPT = `You extract structured bill or debt information from a short, plain-English description.

Decide "kind":
- "bill" for a regular, expected obligation (rent, a subscription, a phone bill).
- "debt" for something off the normal bill cycle, already late, a loan, or anything with an escalating penalty (like a ticket).

Compute "dueDate" as an absolute ISO date (YYYY-MM-DD) from the "today" date given and any relative phrase ("in 14 days", "next Friday"). Use null if no date is implied.
Only set "recurrence" when the text clearly implies a repeating cadence; otherwise null.
Only set "penaltyAmount"/"penaltyAfterDate" when the text describes an amount that increases after a date; otherwise null.
Use null for "notes" unless there's meaningful extra context worth keeping.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Smart entry isn't set up yet — add ANTHROPIC_API_KEY to your environment to use it." },
      { status: 501 },
    );
  }

  const { text } = await request.json();
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Description can't be empty." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Today's date is ${todayIso()}. Description: "${text.trim()}"` },
      ],
      output_config: { format: zodOutputFormat(ParsedEntrySchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "Couldn't understand that description." }, { status: 422 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (err) {
    console.error("parse-bill error", err);
    return NextResponse.json({ error: "Something went wrong talking to Claude." }, { status: 502 });
  }
}
