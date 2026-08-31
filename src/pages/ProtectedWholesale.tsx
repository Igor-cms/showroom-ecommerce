import { useState, useEffect } from "react";
import Wholesale from "./Wholesale";
import PasswordProtection from "@/components/PasswordProtection";
import { supabase } from "@/integrations/supabase/client";

const ProtectedWholesale = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("wholesale-token");
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase.functions.invoke(
          'verify-wholesale-password',
          { body: { token } }
        );
        
        if (data?.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("wholesale-token");
        }
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem("wholesale-token");
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, []);

  const handleAuthenticate = (token: string) => {
    localStorage.setItem("wholesale-token", token);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticate={handleAuthenticate} />;
  }

  return <Wholesale />;
};

export default ProtectedWholesale;
