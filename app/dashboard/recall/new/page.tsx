import { createClient } from "@/lib/supabase/server";
import { RecallNewClient, type RecallRow } from "./RecallNewClient";
export const dynamic = "force-dynamic";

export default async function NewRecallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("dietary_recalls")
    .select("id, client_name, client_email, token, recall_type, status, created_at, completed_at")
    .order("created_at", { ascending: false });

  return (
    <RecallNewClient
      initialRecalls={(data as RecallRow[]) ?? []}
      userId={user?.id ?? null}
    />
  );
}
