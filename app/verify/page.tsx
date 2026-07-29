import { VerifyForm } from "./VerifyForm";

export const metadata = { title: "Verify a certificate · Simathon" };

export default function VerifyPage() {
  return (
    <div className="prose-body max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">certificate verification</div>
      <h1 className="text-3xl font-bold mt-1">Verify a certificate</h1>
      <p className="text-ink/80 mt-2 text-[15px]">
        Every certificate issued for the Black Hole Simulation Workshop &amp; Hackathon carries an ID,
        printed below the citation. Enter it here to see who it was issued to.
      </p>
      <VerifyForm />
    </div>
  );
}
