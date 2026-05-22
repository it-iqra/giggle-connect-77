import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadProps {
  bucket: "avatars" | "gig-images" | "portfolio" | "resumes" | "attachments";
  accept?: string;
  maxSizeMB?: number;
  currentUrl?: string | null;
  onUploaded: (url: string, path: string) => void;
  label?: string;
}

export function FileUpload({
  bucket,
  accept = "image/*",
  maxSizeMB = 5,
  currentUrl,
  onUploaded,
  label = "Upload file",
}: FileUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isPublic = ["avatars", "gig-images", "portfolio"].includes(bucket);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMB} MB`);
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    let url = "";
    if (isPublic) {
      url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    } else {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
      url = data?.signedUrl ?? "";
    }
    onUploaded(url, path);
    setUploading(false);
    toast.success("Uploaded");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl && accept.startsWith("image") && (
        <img src={currentUrl} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
      )}
      {currentUrl && !accept.startsWith("image") && (
        <a href={currentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
          View current file
        </a>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Uploading…" : label}
      </Button>
    </div>
  );
}
