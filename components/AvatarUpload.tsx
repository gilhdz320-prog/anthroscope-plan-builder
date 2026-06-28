"use client";

// NOTE: This requires a PUBLIC Storage bucket named `avatars` in the Supabase
// Dashboard (Storage > New bucket > name "avatars", mark as Public), and an
// `avatar_url text` column on public.profiles. See supabase/add_avatar_support.sql.

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AvatarUpload({ userId }: { userId: string }) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const url = (data as { avatar_url?: string | null })?.avatar_url;
        if (url) setAvatarUrl(url);
      });
  }, [userId, supabase]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(publicUrl);

    const { error: profErr } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", userId);
    if (profErr) setError(profErr.message);

    setUploading(false);
  }

  return (
    <div className="mt-5">
      <label className="label">Foto de perfil</label>
      <div className="mt-2 flex items-center gap-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Subir foto de perfil"
          className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-90"
          style={{
            border: "2px solid var(--gold)",
            background: "var(--surface-sunken)",
            color: "var(--gold)",
          }}
        >
          {uploading ? (
            <span className="spinner" />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
        <div>
          <p
            style={{
              fontFamily: "var(--font-cormorant), ui-serif, serif",
              fontSize: "17px",
              color: "var(--ink-strong)",
            }}
          >
            Sube tu foto
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
            JPG o PNG. Haz clic en el círculo para cambiarla.
          </p>
          {error && (
            <p className="mt-1 text-[11px]" style={{ color: "#fb7185" }}>
              {error}
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </div>
  );
}
