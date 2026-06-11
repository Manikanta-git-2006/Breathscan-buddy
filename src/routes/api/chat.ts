import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are PulmoScan AI, a specialist medical assistant focused on lung imaging and radiology reports.

You help users understand chest X-rays, CT scans, and written radiology reports. When the user shares an image:
1. Describe the image (view, quality, visible anatomy).
2. List any visible findings (opacities, consolidations, nodules, effusions, cardiomegaly, etc.).
3. Suggest 2-4 differential possibilities with brief reasoning, ordered by likelihood.
4. Note red-flag features and recommended next steps (e.g. follow-up imaging, specialist referral).

When the user shares a PDF report, extract key findings, impressions, and explain them in plain language.

Always end with: "⚠️ Educational only — not a medical diagnosis. Please consult a licensed clinician."

Use clear markdown with short sections and bullet points. Be calm, precise, and never alarmist.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});