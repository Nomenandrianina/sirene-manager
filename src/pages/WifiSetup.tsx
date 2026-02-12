import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, WifiOff, ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockApi } from "@/services/mockApi";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { icon: Radio, text: "Ouvrez les paramètres WiFi de votre téléphone" },
  { icon: Wifi, text: 'Connectez-vous au réseau "ESP32-SIRENE"' },
  { icon: ArrowRight, text: "Entrez le mot de passe ci-dessous" },
];

const WifiSetup = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!password.trim()) return;
    setLoading(true);
    const result = await mockApi.connectWifi(password);
    setLoading(false);

    if (result.success) {
      setConnected(true);
      toast({ title: "Connecté !", description: result.message });
      setTimeout(() => navigate("/auth"), 1000);
    } else {
      toast({ title: "Erreur", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wifi className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connexion WiFi</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous au hotspot de votre sirène ESP32
          </p>
        </div>

        {/* Steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Étapes de connexion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground pt-1">{step.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Connection form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={connected ? "text-green-600 font-medium" : "text-muted-foreground"}>
                {connected ? "Connecté" : "Non connecté"}
              </span>
            </div>

            <Input
              type="password"
              placeholder="Mot de passe WiFi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              disabled={loading || connected}
            />

            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={loading || connected || !password.trim()}
            >
              {loading ? "Connexion..." : connected ? "Connecté ✓" : "Se connecter"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Mot de passe par défaut : <span className="font-mono">sirene2024</span>
        </p>
      </div>
    </div>
  );
};

export default WifiSetup;
