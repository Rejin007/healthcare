import React, { useState } from "react";
import { authService } from "../services/auth.service";

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      console.log("Login clicked");

      const res = await authService.adminLogin(email, password);

      console.log("API response:", res);

      if (res.success) {
        const token = res.data.accessToken;
        const user = res.data.user;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        onLogin(token, user);
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-white text-2xl mb-6 text-center">
          Admin Login
        </h2>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 mb-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="admin@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-slate-700 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-slate-700 text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;