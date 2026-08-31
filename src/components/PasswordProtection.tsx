import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import passwordBg from "@/assets/password-bg-new.jpg";
import { supabase } from "@/integrations/supabase/client";

interface PasswordProtectionProps {
  onAuthenticate: (token: string) => void;
}

const PasswordProtection = ({ onAuthenticate }: PasswordProtectionProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const inputElement = document.getElementById("password-input");
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'verify-wholesale-password',
        { body: { password } }
      );
      
      if (functionError || data?.error) {
        setError(true);
        setPassword("");
      } else if (data?.token) {
        onAuthenticate(data.token);
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError(true);
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${passwordBg})`,
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
          {/* Unified Input Container */}
          <div className={`relative flex items-center h-14 rounded-full bg-white/90 backdrop-blur-sm ${
            error ? "ring-2 ring-red-500" : ""
          }`}>
            <input
              id="password-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="flex-1 h-full bg-transparent border-none outline-none px-6 text-center text-lg placeholder:text-gray-400"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!password || isLoading}
              className={`absolute right-1 h-12 px-6 rounded-full text-white text-base font-medium transition-colors ${
                password && !isLoading
                  ? "bg-[#007AFF] hover:bg-[#0051D5] cursor-pointer" 
                  : "bg-[#D6D6D6] cursor-not-allowed"
              }`}
            >
              {isLoading ? "Verifying..." : "Open"}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-center text-sm">Incorrect password</p>
          )}
        </form>

      </div>
    </div>
  );
};

export default PasswordProtection;
