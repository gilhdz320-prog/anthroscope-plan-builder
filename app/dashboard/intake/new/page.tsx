import { createClient } from "@/lib/supabase/server";
import { IntakeNewClient, type IntakeRow } from "./IntakeNewClient";

export const dynamic = "force-dynamic";

export default async function NewIntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("intake_forms")
    .select("id, client_name, token, status, created_at, completed_at")
    .order("created_at", { ascending: false });

  return (
    <IntakeNewClient
      initialForms={(data as IntakeRow[]) ?? []}
      userId={user?.id ?? null}
    />
  );
}
