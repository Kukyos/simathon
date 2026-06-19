import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Simulate the Impossible — Physics Sim Workshop",
  description:
    "One-day workshop + week-long hackathon. Build cinematic physics simulations — black holes, galaxies, particle worlds — with Python, Taichi, and AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-6xl mx-auto px-5 py-10">{children}</main>
        <footer className="border-t border-white/5 mt-20">
          <div className="max-w-6xl mx-auto px-5 py-8 text-sm text-muted flex flex-wrap gap-3 justify-between">
            <div>Built by <span className="text-ink">Armaan</span> · part of <span className="text-ink">physicssim</span></div>
            <div>Stuck? Hit the <a href="/chat" className="text-accent">chat</a>.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
