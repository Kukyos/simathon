import { redirect } from "next/navigation";

export const metadata = { title: "Phase · Simathon" };

// ponytail: phase gates were dropped mid-workshop. Old URLs redirect to submit.
// The phase_progress table and PhaseForm component are still in the repo; the
// admin dashboard can still read/act on them if needed.
export default async function PhasePage() {
  redirect("/submit");
}
