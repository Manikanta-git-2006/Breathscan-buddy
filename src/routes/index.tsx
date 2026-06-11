import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Activity, ScanLine, FileText, MessagesSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulmoScan AI — Lung X-ray analysis assistant" },
      { name: "description", content: "Upload chest X-rays and radiology reports. PulmoScan AI summarises findings, suggests differentials, and answers your questions." },
      { property: "og:title", content: "PulmoScan AI" },
      { property: "og:description", content: "AI-powered chest X-ray and radiology report analysis." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg">PulmoScan AI</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Lovable AI
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Read your chest X-ray
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                in plain language.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
              Upload an X-ray image or a radiology report PDF. PulmoScan AI summarises findings,
              flags possible conditions, and answers your follow-up questions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="shadow-[var(--shadow-soft)]">
                  Start an analysis
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  How it works
                </Button>
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Educational tool only. Not a substitute for licensed medical advice.
            </p>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-3xl opacity-30 blur-3xl"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div
              className="relative rounded-3xl border border-border bg-card p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                <span className="ml-2 text-xs text-muted-foreground">chest_xray_001.jpg</span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl bg-muted/60 p-3">
                  <span className="font-medium text-primary">Findings</span>
                  <p className="mt-1 text-muted-foreground">
                    Patchy opacity in the right lower lobe with preserved costophrenic angles.
                  </p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <span className="font-medium text-primary">Differential</span>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    <li>Community-acquired pneumonia</li>
                    <li>Atelectasis</li>
                    <li>Pulmonary infiltrate</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-accent/40 bg-accent/20 p-3 text-xs text-accent-foreground">
                  ⚠️ Educational only — not a medical diagnosis.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: ScanLine, title: "X-ray analysis", desc: "Vision AI inspects the image for opacities, nodules, effusions and more." },
            { icon: FileText, title: "Report parsing", desc: "Drop a PDF radiology report — get a plain-language summary instantly." },
            { icon: MessagesSquare, title: "Conversational Q&A", desc: "Ask follow-up questions. Threads are saved to your account." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <div
                className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
