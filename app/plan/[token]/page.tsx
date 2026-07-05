import type { Metadata } from "next";
import { PlanViewClient } from "./PlanViewClient";

export const metadata: Metadata = {
  title: "Plan de Nutrición",
  robots: { index: false, follow: false },
};

export default async function PublicPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PlanViewClient token={token} />;
}
