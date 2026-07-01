import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LastVisitedTracker from "@/components/LastVisitedTracker";
import DotField from "@/components/DotField";
import PhysicsClutter from "@/components/PhysicsClutter";
import RouteProgress from "@/components/RouteProgress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simathon — physics simulation workshop",
  description: "Vibe-code a cinematic physics simulation in one day.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex relative">
        <RouteProgress />
        {/* Background: subtle dotfield, only over the content column (skip sidebar) */}
        <div className="fixed top-0 right-0 bottom-0 left-0 md:left-[260px] -z-10 pointer-events-none">
          <DotField
            dotRadius={1.2}
            dotSpacing={20}
            bulgeStrength={40}
            glowRadius={160}
            gradientFrom="rgba(124, 92, 255, 0.45)"
            gradientTo="rgba(255, 106, 61, 0.32)"
            glowColor="rgba(124, 92, 255, 0.5)"
          />
        </div>
        <PhysicsClutter />

        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 relative md:ml-[260px]">
          <MobileNav />
          <LastVisitedTracker />
          <main className="flex-1 w-full max-w-5xl mx-auto px-5 md:px-12 py-8 md:py-12">
            {children}
          </main>
          <footer>
            <div className="max-w-5xl mx-auto px-5 md:px-12 py-5 text-xs text-muted flex flex-wrap gap-3 justify-between opacity-70">
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
