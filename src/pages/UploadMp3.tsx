import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowLeft, FileAudio, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockApi } from "@/services/mockApi";
import { useToast } from "@/hooks/use-toast";

const UploadMp3 = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const result = await mockApi.uploadMp3(file, setProgress);
    setUploading(false);
    setUploadResult(result);

    if (result.success) {
      toast({ title: "Succès", description: result.message });
    } else {
      toast({ title: "Erreur", description: result.message, variant: "destructive" });
    }
  };

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Upload MP3</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Drop zone */}
        <Card
          className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Sélectionner un fichier MP3</p>
              <p className="text-xs text-muted-foreground mt-1">Format MP3 uniquement • Max 5 MB</p>
            </div>
          </CardContent>
        </Card>

        <input
          ref={fileRef}
          type="file"
          accept=".mp3,audio/mpeg"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Selected file */}
        {file && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <FileAudio className="h-8 w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
              </div>

              {uploading && <Progress value={progress} className="h-2" />}

              {uploadResult && (
                <div className={`flex items-center gap-2 text-sm ${uploadResult.success ? "text-green-600" : "text-destructive"}`}>
                  {uploadResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {uploadResult.message}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={uploading || uploadResult?.success === true}
              >
                {uploading ? `Upload en cours... ${progress}%` : uploadResult?.success ? "Uploadé ✓" : "Envoyer vers la sirène"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UploadMp3;
