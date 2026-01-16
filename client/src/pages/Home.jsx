import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Zap, Shield, Cloud } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-cyan-500/20">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 50%)`,
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl w-full">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-12 md:p-16">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-violet-300" />
                  <span className="text-sm font-medium text-violet-200">
                    AI-Powered Intelligence
                  </span>
                </div>
              </div>

              {/* Hero */}
              <div className="text-center mb-12">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                  AI Smart Notes
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-2xl mx-auto">
                  Transform the way you think. Capture ideas, unlock insights,
                  and amplify creativity.
                </p>
                <p className="text-slate-400 max-w-xl mx-auto">
                  Your second brain, powered by AI
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <button
                  onClick={handleRegister}
                  className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:scale-105 transition"
                >
                  <span className="flex items-center gap-2">
                    Get Started Free
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={handleLogin}
                  className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition"
                >
                  Sign In
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Feature
                  icon={<Brain />}
                  title="AI Powered"
                  desc="Smart summaries and intelligent organization."
                  gradient="from-violet-500 to-fuchsia-500"
                />
                <Feature
                  icon={<Cloud />}
                  title="Cloud Sync"
                  desc="Access notes anytime, anywhere."
                  gradient="from-fuchsia-500 to-pink-500"
                />
                <Feature
                  icon={<Shield />}
                  title="Secure"
                  desc="Enterprise-grade data protection."
                  gradient="from-cyan-500 to-blue-500"
                />
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600" />
          </div>

          <p className="text-center text-slate-500 mt-8 text-sm">
            Build smarter. Think faster. Write better.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc, gradient }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  );
}

export default Home;
