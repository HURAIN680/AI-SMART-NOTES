import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LogIn, Mail, Lock, Sparkles, ArrowLeft } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/notes");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-blue-500/20 to-violet-500/20" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Back button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </button>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-8 text-center border-b border-white/10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-400">
                Sign in to continue to your notes
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              <Input
                label="Email Address"
                icon={<Mail />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                icon={<Lock />}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-white/10">
                <p className="text-slate-400 text-sm">
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={handleGoToRegister}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>

            <div className="h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Lock className="w-3 h-3" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, icon, type, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition"
          required
        />
      </div>
    </div>
  );
}

export default Login;
