import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const oauthUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;

  const handleDemoAccess = () => {
    // The server uses DEMO_USER automatically when no session exists.
    // Simply navigate to dashboard — the backend will serve demo data.
    navigate("/dashboard");
  };

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Kaitel Training Platform
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Plataforma de entrenamiento para agentes de contact center
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            onClick={handleDemoAccess}
          >
            Acceder como Demo
          </Button>
          {oauthUrl && (
            <Button
              variant="outline"
              className="w-full font-semibold py-3"
              onClick={handleOAuthLogin}
            >
              Iniciar sesión con cuenta corporativa
            </Button>
          )}
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2">
            El acceso demo utiliza datos de ejemplo con rol de administrador.
            <br />
            Para producción, configure las variables de autenticación OAuth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
