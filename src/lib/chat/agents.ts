import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// An "agent" = one Gemini model reached with one API key.
// Google applies free-tier limits per model AND per Google project, so:
//   - the same key on a different model has its own quota (flash vs flash-lite)
//   - a key from ANOTHER Google account/project has a completely separate quota
// When one agent hits its limit, the next one takes over.
export type Agent = {
  id: string;
  label: string;
  model: LanguageModel;
};

const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

function readKeys(): string[] {
  const names = [
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY_2",
    "GOOGLE_GENERATIVE_AI_API_KEY_3",
    "GOOGLE_GENERATIVE_AI_API_KEY_4",
    "GOOGLE_GENERATIVE_AI_API_KEY_5",
  ];
  const keys = names
    .map((n) => process.env[n]?.trim())
    .filter((k): k is string => !!k);
  return [...new Set(keys)];
}

function readModels(): string[] {
  const raw = process.env.CHAT_MODELS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return raw && raw.length > 0 ? raw : DEFAULT_MODELS;
}

// Order = priority. Best model first (on every key), then the lighter model.
// e.g. flash/key1, flash/key2, flash-lite/key1, flash-lite/key2
export function buildAgents(): Agent[] {
  const keys = readKeys();
  const agents: Agent[] = [];
  for (const modelId of readModels()) {
    keys.forEach((apiKey, i) => {
      const provider = createGoogleGenerativeAI({ apiKey });
      agents.push({
        id: `${modelId}#${i + 1}`,
        label: `${modelId} (clé ${i + 1})`,
        model: provider(modelId),
      });
    });
  }
  return agents;
}

const g = globalThis as unknown as { __chatAgents?: Agent[] };

export function getAgents(): Agent[] {
  g.__chatAgents ??= buildAgents();
  return g.__chatAgents;
}