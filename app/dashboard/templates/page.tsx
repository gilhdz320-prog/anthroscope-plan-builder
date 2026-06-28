import { createClient } from "@/lib/supabase/server";
import { TemplatesClient, type Template } from "./TemplatesClient";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch both the user's own templates AND public seed templates.
  let query = supabase
    .from("templates")
    .select(
      "id, name, description, goal, kcal_target, is_seed, is_public, user_id",
    )
    .order("created_at", { ascending: false });

  query = user
    ? query.or(`user_id.eq.${user.id},is_seed.eq.true`)
    : query.eq("is_seed", true);

  const { data, error } = await query;

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{
            background: "rgba(244,63,94,0.1)",
            borderColor: "rgba(244,63,94,0.3)",
            color: "#fb7185",
          }}
        >
          {error.message}
        </div>
      )}
      <TemplatesClient
        initialTemplates={(data as Template[]) ?? []}
        userId={user?.id ?? null}
      />
    </div>
  );
}
