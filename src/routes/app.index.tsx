import { createFileRoute } from "@tanstack/react-router";
import { ScanLine, FileText, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-xl text-center">
        <div
          className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <ScanLine className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Start a new lung analysis</h1>
        <p className="mt-2 text-muted-foreground">
          Tap <span className="font-medium text-foreground">New analysis</span> in the sidebar to begin.
          Upload a chest X-ray image or a radiology report PDF, then chat with PulmoScan AI.
        </p>
        <div className="mt-8 grid gap-3 text-left text-sm md:grid-cols-3">
          {[
            { icon: ScanLine, title: "Upload an X-ray", desc: "JPG, PNG, or WebP." },
            { icon: FileText, title: "Drop a report", desc: "PDF radiology reports." },
            { icon: MessagesSquare, title: "Ask anything", desc: "Follow-up questions, saved." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-4">
              <f.icon className="mb-2 h-4 w-4 text-primary" />
              <div className="font-medium">{f.title}</div>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          ⚠️ Educational only — not a medical diagnosis.
        </p>
      </div>
    </div>
  );
}