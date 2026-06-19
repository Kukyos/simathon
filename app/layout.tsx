import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LastVisitedTracker from "@/components/LastVisitedTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simathon — physics simulation workshop",
  description: "Vibe-code a cinematic physics simulation in one day.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav />
          <LastVisitedTracker />
          <main className="flex-1 w-full max-w-3xl px-5 md:px-10 py-8 md:py-12">
            {children}
          </main>
          <footer className="border-t border-white/5">
            <div className="max-w-3xl px-5 md:px-10 py-5 text-xs text-muted flex flex-wrap gap-3 justify-between">
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
        </div>
      </body>
    </html>
  );
}
