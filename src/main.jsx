import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

import OrderForm from "./pages/OrderForm";
import "./style.css";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://semqrrxvkmykfvlwjpvh.supabase.co";

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_XPzxQmg9TPtxeEzhfCPvHw_3-ZO1jCe";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function Login({ onLogin }) {
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "").trim();

    if (username === "BOUSHAHRI" && password === "BOUSHAHRI") {
      const adminUser = {
        id: "admin",
        username: "BOUSHAHRI",
        role: "admin",
        clinic_id: null,
        clinic_name: "BOUSHAHRI CLINIC",
        doctor_name: "Admin",
      };

      localStorage.setItem("boushahri_user", JSON.stringify(adminUser));
      onLogin(adminUser);
      return;
    }

    const { data, error: dbError } = await supabase
      .from("users_app")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .limit(1);

    if (dbError) {
      setError("Database connection error.");
      return;
    }

    if (data && data.length > 0) {
      const user = data[0];
      localStorage.setItem("boushahri_user", JSON.stringify(user));
      onLogin(user);
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={handleLogin}>
        <img
          className="loginLogo"
          src="/logo.png"
          alt="BOUSHAHRI logo"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <h1 className="loginTitle">BOUSHAHRI MEDICAL STORE</h1>

        <input className="loginInput" name="username" placeholder="Username" />

        <input
          className="loginInput"
          name="password"
          type="password"
          placeholder="Password"
        />

        <button className="loginButton" type="submit">
          Login
        </button>

        {error && <div className="loginError">{error}</div>}
      </form>
    </div>
  );
}

function App() {
  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("boushahri_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [user, setUser] = useState(savedUser);

  function logout() {
    localStorage.removeItem("boushahri_user");
    setUser(null);
  }

  if (!user) {
  return <Login onLogin={setUser} />;
}

if (user.role === "admin") {
  return <AdminDashboard supabase={supabase} user={user} onLogout={logout} />;
}

return <OrderForm supabase={supabase} user={user} onLogout={logout} />;