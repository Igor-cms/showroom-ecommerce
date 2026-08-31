import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoginBackground from "@/components/wholesale-copy/LoginBackground";
import TMark from "@/components/wholesale-copy/TMark";
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
    <div className="relative w-full h-screen overflow-hidden bg-wholesale-bg">
      <LoginBackground />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        {/* Below lg the field is narrowed and dropped slightly, so it sits
            lighter over the framed photo. The drop is deliberately small: the
            child's face lands ~26px under the field's bottom edge at this
            framing, so anything past ~18px would put the pill back over it —
            the exact overlap the framing was changed to clear. lg keeps the
            desktop composition untouched. */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[19rem] translate-y-[2vh] space-y-3 lg:max-w-md lg:translate-y-0"
        >
          {/* Unified Input Container */}
          <div className={`relative flex items-center h-9 rounded-full bg-[#F8F5E4]/90 backdrop-blur-sm ${
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
              className="flex-1 h-full bg-transparent border-none outline-none pl-6 pr-28 text-left text-base text-neutral-800 placeholder:text-neutral-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!password || isLoading}
              className={`absolute right-1 h-7 px-6 rounded-full border border-black text-sm font-medium transition-colors ${
                password && !isLoading
                  ? "bg-[#c9c2b2] text-black hover:bg-[#b8b0a0] cursor-pointer"
                  : "bg-[#c9c2b2] text-black cursor-not-allowed"
              }`}
            >
              {isLoading ? "Verifying..." : "SUBMIT"}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-center text-sm">Incorrect password</p>
          )}
          <div className="text-center">
            <Link
              to="/wholesale-request?mode=setup"
              className="text-[#F8F5E4] text-sm font-medium hover:underline drop-shadow uppercase"
            >
              Request sign up
            </Link>
          </div>
        </form>

        <TMark />
      </div>
    </div>
  );
};

export default PasswordProtection;
