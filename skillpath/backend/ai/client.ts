/**
 * Thin wrapper over any OpenAI-compatible chat endpoint (Gemini, Groq,
 * OpenRouter, Ollama). Swapping the provider is a change in .env.local only.
 *
 * This file is deliberately NOT marked "use server": that directive turns every
 * export into a client-callable endpoint, and this module holds the API key.
 * Import it only from other server modules.
 */

const BASE_URL = process.env.AI_BASE_URL ?? "";
const API_KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gemini-2.5-flash";

export type AskResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export type AskOptions = {
    // Gemini thinks before answering by default, which roughly doubles the
    // latency. "none" turns it off - good for short, well-specified outputs.
    reasoningEffort?: "none" | "low" | "medium" | "high";
    timeoutMs?: number;
    maxTokens?: number;
};

// Small models sometimes wrap the JSON in prose or a ```json fence.
function extractJson(raw: string): string | null {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : raw;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;

    return candidate.slice(start, end + 1);
}

export async function askJSON<T>(
    system: string,
    user: string,
    options: AskOptions = {}
): Promise<AskResult<T>> {
    if (!BASE_URL || !API_KEY) {
        return { ok: false, error: "AI is not configured (AI_BASE_URL / AI_API_KEY)." };
    }

    const { reasoningEffort = "none", timeoutMs = 20000, maxTokens = 2048 } = options;

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            signal: AbortSignal.timeout(timeoutMs),
            body: JSON.stringify({
                model: MODEL,
                reasoning_effort: reasoningEffort,
                max_tokens: maxTokens,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                ],
            }),
        });
    } catch (err: any) {
        const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
        return { ok: false, error: timedOut ? "The AI request timed out." : "Could not reach the AI provider." };
    }

    if (!res.ok) {
        // The provider body can contain the key in an echoed request - never surface it.
        console.error("AI provider error:", res.status, await res.text().catch(() => ""));
        return { ok: false, error: `AI provider returned ${res.status}.` };
    }

    const payload = await res.json().catch(() => null);
    const text: string | undefined = payload?.choices?.[0]?.message?.content;
    if (!text) return { ok: false, error: "Empty response from the AI provider." };

    const json = extractJson(text);
    if (!json) return { ok: false, error: "The AI response was not valid JSON." };

    try {
        return { ok: true, data: JSON.parse(json) as T };
    } catch {
        return { ok: false, error: "The AI response was not valid JSON." };
    }
}
