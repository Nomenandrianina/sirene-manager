import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Wifi, Info, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockApi, type DeviceStatus } from "@/services/mockApi";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [wifiCurrent, setWifiCurrent] = useState("");
  const [wifiNew, setWifiNew] = useState("");
  const [codeCurrent, setCodeCurrent] = useState("");
  const [codeNew, setCodeNew] = useState("");
  const [loading, setLoading] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    mockApi.getDeviceInfo().then((info) => setDevice(info.status));
  }, []);

  const handleChangeWifi = async () => {
    setLoading("wifi");
    const result = await mockApi.changeWifiPassword(wifiCurrent, wifiNew);
    setLoading("");
    toast({
      title: result.success ? "Succès" : "Erreur",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) {
      setWifiCurrent("");
      setWifiNew("");
    }
  };

  const handleChangeCode = async () => {
    setLoading("code");
    const result = await mockApi.changeAuthCode(codeCurrent, codeNew);
    setLoading("");
    toast({
      title: result.success ? "Succès" : "Erreur",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) {
      setCodeCurrent("");
      setCodeNew("");
    }
  };

  const handleLogout = async () => {
    await mockApi.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Paramètres</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Change WiFi Password */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Mot de passe WiFi</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Mot de passe actuel"
              value={wifiCurrent}
              onChange={(e) => setWifiCurrent(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Nouveau mot de passe"
              value={wifiNew}
              onChange={(e) => setWifiNew(e.target.value)}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={handleChangeWifi}
              disabled={!wifiCurrent || !wifiNew || loading === "wifi"}
            >
              {loading === "wifi" ? "Modification..." : "Modifier"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Auth Code */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Code d'authentification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Code actuel"
              value={codeCurrent}
              onChange={(e) => setCodeCurrent(e.target.value)}
            />
            <Input
              placeholder="Nouveau code (6 chiffres)"
              value={codeNew}
              onChange={(e) => setCodeNew(e.target.value)}
              maxLength={6}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={handleChangeCode}
              disabled={!codeCurrent || codeNew.length !== 6 || loading === "code"}
            >
              {loading === "code" ? "Modification..." : "Modifier"}
            </Button>
          </CardContent>
        </Card>

        {/* Device Info */}
        {device && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Informations appareil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modèle</span>
                <span className="font-medium">{device.model}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firmware</span>
                <span className="font-medium">v{device.firmwareVersion}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse IP</span>
                <span className="font-mono text-xs">{device.ipAddress}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse MAC</span>
                <span className="font-mono text-xs">{device.macAddress}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </main>
    </div>
  );
};

export default SettingsPage;
