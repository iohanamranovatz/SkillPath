import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `backend/ai/client.ts` citeste configuratia la incarcarea modulului, nu la
 * fiecare apel. Ca sa putem testa si cazul "AI neconfigurat", fiecare test
 * reincarca modulul cu propriul set de variabile de mediu.
 */
const AI_KEYS = ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"] as const;

const CONFIGURED = {
    AI_BASE_URL: "https://ai.example.com/v1",
    AI_API_KEY: "secret-key-do-not-leak",
    AI_MODEL: "test-model",
};

const originalEnv = Object.fromEntries(AI_KEYS.map((key) => [key, process.env[key]]));

async function loadClient(env: Partial<Record<(typeof AI_KEYS)[number], string>> = CONFIGURED) {
    vi.resetModules();
    for (const key of AI_KEYS) {
        if (env[key] === undefined) delete process.env[key];
        else process.env[key] = env[key];
    }
    return import("@/backend/ai/client");
}

/** Raspuns valid de la un endpoint compatibil OpenAI. */
function chatResponse(content: string) {
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

afterAll(() => {
    for (const key of AI_KEYS) {
        if (originalEnv[key] === undefined) delete process.env[key];
        else process.env[key] = originalEnv[key];
    }
});

describe("askJSON", () => {
    describe("configuratie", () => {
        it("nu apeleaza providerul daca lipseste AI_BASE_URL", async () => {
            const { askJSON } = await loadClient({ AI_API_KEY: "k" });

            const result = await askJSON("sys", "user");

            expect(result).toEqual({
                ok: false,
                error: "AI is not configured (AI_BASE_URL / AI_API_KEY).",
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("nu apeleaza providerul daca lipseste AI_API_KEY", async () => {
            const { askJSON } = await loadClient({ AI_BASE_URL: "https://ai.example.com/v1" });

            const result = await askJSON("sys", "user");

            expect(result.ok).toBe(false);
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe("cererea trimisa", () => {
        it("trimite modelul, cheia si formatul JSON impus", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('{"ok":1}'));

            await askJSON("system prompt", "user prompt");

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, init] = fetchMock.mock.calls[0];

            expect(url).toBe("https://ai.example.com/v1/chat/completions");
            expect(init.method).toBe("POST");
            expect(init.headers.Authorization).toBe("Bearer secret-key-do-not-leak");

            const body = JSON.parse(init.body);
            expect(body.model).toBe("test-model");
            expect(body.response_format).toEqual({ type: "json_object" });
            expect(body.messages).toEqual([
                { role: "system", content: "system prompt" },
                { role: "user", content: "user prompt" },
            ]);
        });

        it("foloseste valorile implicite: fara reasoning, 2048 tokens", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse("{}"));

            await askJSON("sys", "user");

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.reasoning_effort).toBe("none");
            expect(body.max_tokens).toBe(2048);
        });

        it("propaga optiunile primite", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse("{}"));

            await askJSON("sys", "user", { reasoningEffort: "high", maxTokens: 8192, timeoutMs: 45000 });

            const body = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(body.reasoning_effort).toBe("high");
            expect(body.max_tokens).toBe(8192);
        });

        it("cade pe modelul implicit daca AI_MODEL nu e setat", async () => {
            const { askJSON } = await loadClient({
                AI_BASE_URL: CONFIGURED.AI_BASE_URL,
                AI_API_KEY: CONFIGURED.AI_API_KEY,
            });
            fetchMock.mockResolvedValue(chatResponse("{}"));

            await askJSON("sys", "user");

            expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("gemini-2.5-flash");
        });
    });

    describe("parsarea raspunsului", () => {
        it("returneaza obiectul parsat pentru JSON curat", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('{"questions":[{"text":"Q1"}]}'));

            const result = await askJSON<{ questions: { text: string }[] }>("sys", "user");

            expect(result).toEqual({ ok: true, data: { questions: [{ text: "Q1" }] } });
        });

        it("extrage JSON-ul dintr-un bloc ```json", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('Sigur!\n```json\n{"a":1}\n```\nSper ca ajuta.'));

            const result = await askJSON<{ a: number }>("sys", "user");

            expect(result).toEqual({ ok: true, data: { a: 1 } });
        });

        it("extrage JSON-ul dintr-un bloc fara eticheta de limbaj", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('```\n{"a":2}\n```'));

            expect(await askJSON("sys", "user")).toEqual({ ok: true, data: { a: 2 } });
        });

        it("extrage JSON-ul cand modelul il inconjoara cu proza", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('Iata raspunsul: {"a":3} - gata.'));

            expect(await askJSON("sys", "user")).toEqual({ ok: true, data: { a: 3 } });
        });

        it("respinge un raspuns fara acolade", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse("Nu pot raspunde la asta."));

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "The AI response was not valid JSON.",
            });
        });

        it("respinge JSON malformat intre acolade", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue(chatResponse('{"a": 1, "b":}'));

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "The AI response was not valid JSON.",
            });
        });

        it("semnaleaza un raspuns gol", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [] }) });

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "Empty response from the AI provider.",
            });
        });

        it("semnaleaza un body care nu e JSON valid", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => {
                    throw new Error("Unexpected token");
                },
            });

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "Empty response from the AI provider.",
            });
        });
    });

    describe("erori", () => {
        it("nu scurge body-ul providerului catre apelant", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                text: async () => 'Invalid key: "secret-key-do-not-leak"',
            });

            const result = await askJSON("sys", "user");

            expect(result).toEqual({ ok: false, error: "AI provider returned 401." });
            expect(JSON.stringify(result)).not.toContain("secret-key-do-not-leak");
        });

        it("logheaza eroarea providerului pentru diagnostic", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "boom" });

            await askJSON("sys", "user");

            expect(console.error).toHaveBeenCalledWith("AI provider error:", 500, "boom");
        });

        it("raporteaza timeout-ul distinct de o eroare de retea", async () => {
            const { askJSON } = await loadClient();
            const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
            fetchMock.mockRejectedValue(timeout);

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "The AI request timed out.",
            });
        });

        it("trateaza AbortError tot ca timeout", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "The AI request timed out.",
            });
        });

        it("raporteaza o eroare de retea generica", async () => {
            const { askJSON } = await loadClient();
            fetchMock.mockRejectedValue(new TypeError("fetch failed"));

            expect(await askJSON("sys", "user")).toEqual({
                ok: false,
                error: "Could not reach the AI provider.",
            });
        });
    });
});
