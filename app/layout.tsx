import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import LastVisitedTracker from "@/components/LastVisitedTracker";

// Auth state lives in cookies — Server Components must re-read every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simathon — physics simulation workshop",
  description: "Vibe-code a cinematic physics simulation in one day.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <LastVisitedTracker />
        <main className="max-w-5xl mx-auto px-5 py-8">{children}</main>
        <footer className="border-t border-white/5 mt-16">
          <div className="max-w-5xl mx-auto px-5 py-6 text-xs text-muted flex flex-wrap gap-3 justify-between">
            <div>
              built by{" "}
              <a
                href="https://www.linkedin.com/in/armaansucks/"
                target="_blank"
                rel="noreferrer"
                className="text-ink hover:text-accent underline underline-offset-2"
              >
                Armaan
              </a>{" "}
              · part of physicssim
            </div>
            <div>
              stuck?{" "}
              <a href="/chat" className="text-accent">
                ask in chat
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
