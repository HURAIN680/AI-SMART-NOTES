import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { UserPlus, Mail, Lock, User, Sparkles, ArrowLeft } from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-cyan-500/20" />

      {/* Floating orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 left-20 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Back button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors group"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h2>
              <p className="text-slate-400">
                Join thousands of smart note-takers
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Name */}
              <Input
                label="Full Name"
                icon={<User />}
                type="text"
                value={name}
                onChange={setName}
                placeholder="Enter your name"
              />

              {/* Email */}
              <Input
                label="Email Address"
                icon={<Mail />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
              />

              {/* Password */}
              <Input
                label="Password"
                icon={<Lock />}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Create a password"
                helper="Must be at least 6 characters"
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Login */}
              <div className="pt-4 text-center border-t border-white/10">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="text-violet-400 hover:text-violet-300 font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>

            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600" />
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            By creating an account, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({ label, icon, type, value, onChange, placeholder, helper }) {
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
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition"
          required
        />
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

export default Register;
