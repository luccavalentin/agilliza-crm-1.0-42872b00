import { useState } from "react";
import { User, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadAvatarProps {
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
  userId?: string;
}

export function UploadAvatar({ currentUrl, onUploadComplete, userId }: UploadAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validations
    if (!file.type.startsWith("image/")) {
      return toast.error("Por favor, selecione uma imagem válida.");
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("A imagem deve ter no máximo 2MB.");
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId || Math.random()}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("configuracoes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("configuracoes")
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      toast.success("Foto carregada com sucesso!");
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload da imagem: " + (error.message || "Tente novamente"));
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="group relative h-32 w-32 overflow-hidden rounded-full border-4 border-background bg-muted shadow-xl ring-2 ring-primary/10 transition-all hover:ring-primary/30">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary/20">
            <User className="h-16 w-16" />
          </div>
        )}
        
        <label 
          htmlFor="avatar-upload" 
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-white" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white">Upload</span>
            </>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>

        {currentUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            onClick={() => onUploadComplete("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
        Clique na imagem para trocar a foto
      </p>
    </div>
  );
}