import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import { mockApi } from "@/services/mockApi";
import { useToast } from "@/hooks/use-toast";

const AuthCode = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    const result = await mockApi.authenticate(code);
    setLoading(false);

    if (result.success) {
      toast({ title: "Bienvenue !", description: result.message });
      navigate("/dashboard");
    } else {
      toast({ title: "Erreur", description: result.message, variant: "destructive" });
      setCode("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authentification</h1>
          <p className="text-sm text-muted-foreground">
            Entrez le code à 6 chiffres de votre sirène
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={code.length !== 6 || loading}
            >
              {loading ? "Vérification..." : "Valider"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Code de test : <span className="font-mono">123456</span>
        </p>
      </div>
    </div>
  );
};

export default AuthCode;
