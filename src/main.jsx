import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import OrderForm from "./pages/OrderForm";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://semqrrxvkmykfvlwjpvh.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_XPzxQmg9TPtxeEzhfCPvHw_3-ZO1jCe";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function Login({ onLogin }) {
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "").trim();

    // Admin fallback for testing and warehouse owner access
    if (username === "BOUSHAHRI" && password === "BOUSHAHRI") {
      const adminUser = { username: "BOUSHAHRI", role: "admin", clinic_id: null, clinic: { name: "BOUSHAHRI CLINIC", doctor_name: "Admin" } };
      localStorage.setItem("boushahri_user", JSON.stringify(adminUser));
      onLogin(adminUser);
      return;
    }

    // Clinic users created from the main warehouse/admin program
    const { data, error: dbError } = await supabase
      .from("users_app")
      .select("id, username, role, clinic_id, active, clinics(id, name, doctor_name)")
      .eq("username", username)
      .eq("password", password)
      .eq("active", true)
      .limit(1);

    if (dbError) {
      setError("Database connection error. Please contact warehouse admin.");
      return;
    }

    if (data && data.length > 0) {
      const row = data[0];
      const user = {
        id: row.id,
        username: row.username,
        role: row.role || "clinic",
        clinic_id: row.clinic_id,
        clinic: row.clinics || { name: "Clinic", doctor_name: "Doctor" },
      };
      localStorage.setItem("boushahri_user", JSON.stringify(user));
      onLogin(user);
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={handleLogin}>
        <img className="loginLogo" src="/logo.png" alt="BOUSHAHRI logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
        <h1 className="loginTitle">BOUSHAHRI MEDICAL STORE</h1>
        <input className="loginInput" name="username" placeholder="Username" autoComplete="username" />
        <input className="loginInput" name="password" type="password" placeholder="Password" autoComplete="current-password" />
        <button className="loginButton" type="submit">Login</button>
        {error && <div className="loginError">{error}</div>}
      </form>
    </div>
  );
}

function App() {
  const saved = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("boushahri_user") || "null"); } catch { return null; }
  }, []);
  const [user, setUser] = useState(saved);

  function logout() {
    localStorage.removeItem("boushahri_user");
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;

  return <OrderForm supabase={supabase} user={user} onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
