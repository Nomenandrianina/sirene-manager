import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Battery,
  BatteryMedium,
  Wifi,
  WifiOff,
  Music,
  Upload,
  Play,
  Square,
  Settings,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockApi, type DeviceInfo } from "@/services/mockApi";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    mockApi.getDeviceInfo().then(setDevice);
  }, []);

  const handleTestPlay = useCallback(async () => {
    const result = await mockApi.testPlayback();
    if (result.success && result.duration > 0) {
      setPlaying(true);
      setPlayProgress(0);
      const interval = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPlaying(false);
            return 0;
          }
          return prev + 100 / (result.duration * 2);
        });
      }, 500);
    }
  }, []);

  const handleStop = useCallback(async () => {
    await mockApi.stopPlayback();
    setPlaying(false);
    setPlayProgress(0);
    toast({ title: "Lecture arrêtée" });
  }, [toast]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const { status, currentMp3 } = device;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Sirène ESP32</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Device Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Statut de l'appareil</CardTitle>
              <Badge variant={status.connected ? "default" : "destructive"}>
                {status.connected ? "Connecté" : "Déconnecté"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {status.connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">WiFi</span>
              </div>
              <div className="flex items-center gap-2">
                <BatteryMedium className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{status.batteryLevel}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">v{status.firmwareVersion}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{status.model}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current MP3 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Fichier audio actuel</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentMp3 ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{currentMp3.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(currentMp3.size)} • {currentMp3.duration}s
                  </p>
                </div>
                {playing && <Progress value={playProgress} className="h-2" />}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun fichier chargé</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => navigate("/upload")}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">Uploader MP3</span>
          </Button>

          {playing ? (
            <Button className="h-20 flex-col gap-2" variant="destructive" onClick={handleStop}>
              <Square className="h-5 w-5" />
              <span className="text-xs">Arrêter</span>
            </Button>
          ) : (
            <Button
              className="h-20 flex-col gap-2"
              onClick={handleTestPlay}
              disabled={!currentMp3}
            >
              <Play className="h-5 w-5" />
              <span className="text-xs">Tester le message</span>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
