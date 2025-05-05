import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Google OAuth registration
  const handleGoogleRegister = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Email/password registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Registration successful! Please check your email to confirm your account.");
      // Optionally, redirect to login after a delay
      setTimeout(() => navigate("/login"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Register for Interview Coder</h2>
        <button
          onClick={handleGoogleRegister}
          className="w-full py-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register with Google"}
        </button>
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="p-2 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="p-2 rounded"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-400 text-sm text-center">{error}</div>}
        {success && <div className="mt-4 text-green-400 text-sm text-center">{success}</div>}
        <div className="mt-4 text-center">
          <a href="#" onClick={() => navigate("/login")} className="text-blue-400 hover:underline text-sm">
            Already have an account? Log in
          </a>
        </div>
      </div>
    </div>
  );
}