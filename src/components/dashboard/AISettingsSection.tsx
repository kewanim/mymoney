"use client";

import { useState } from "react";
import {
  useAISettings,
  setProvider,
  setApiKey,
  PROVIDER_LABEL,
  PROVIDER_KEY_HELP,
  type AIProvider,
} from "@/lib/aiSettings";
import { Card, SectionHeading, PrimaryButton, FieldInput } from "./ui";

const PROVIDERS: AIProvider[] = ["claude", "openai", "gemini"];

export function AISettingsSection() {
  const settings = useAISettings();
  const [draftKey, setDraftKey] = useState("");
  const [saved, setSaved] = useState(false);

  const activeKey = settings.apiKeys[settings.provider] ?? "";
  const help = PROVIDER_KEY_HELP[settings.provider];

  function handleProviderChange(provider: AIProvider) {
    setProvider(provider);
    setDraftKey("");
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draftKey.trim()) return;
    setApiKey(settings.provider, draftKey.trim());
    setDraftKey("");
    setSaved(true);
  }

  return (
    <Card>
      <SectionHeading title="Smart Entry AI" count={PROVIDERS.length} action={null} />

      <p className="mb-3 text-sm text-ink-soft">
        Pick which AI powers Smart Entry and connect your own API key — everything stays on this
        device, nothing is sent anywhere but the provider you choose.
      </p>

      <div className="mb-4 flex gap-0.5 rounded-full bg-field p-1">
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleProviderChange(provider)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              settings.provider === provider
                ? "bg-gradient-to-r from-teal to-violet text-teal-ink"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {PROVIDER_LABEL[provider]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-ink-soft">
            {PROVIDER_LABEL[settings.provider]} API key
          </label>
          {activeKey && !draftKey && (
            <span className="text-xs text-good">Key saved · •••{activeKey.slice(-4)}</span>
          )}
        </div>
        <div className="flex gap-2">
          <FieldInput
            type="password"
            value={draftKey}
            onChange={(e) => {
              setDraftKey(e.target.value);
              setSaved(false);
            }}
            placeholder={activeKey ? "Enter a new key to replace it" : "Paste your API key"}
            className="flex-1"
            autoComplete="off"
          />
          <PrimaryButton type="submit" disabled={!draftKey.trim()}>
            Save
          </PrimaryButton>
        </div>
        {saved && <p className="text-xs text-good">Saved on this device.</p>}
        <p className="text-xs text-ink-soft">
          Get a key at{" "}
          <a href={help.url} target="_blank" rel="noreferrer" className="text-teal underline">
            {help.label}
          </a>
          .
        </p>
      </form>
    </Card>
  );
}
