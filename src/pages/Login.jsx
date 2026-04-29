import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 👇 تسجيل دخول من Supabase
    const { data, error } = await supabase
      .from("users_app")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("❌ Invalid username or password");
      setLoading(false);
      return;
    }

    // 👇 حفظ الجلسة
    localStorage.setItem("auth", "true");
    localStorage.setItem("user", JSON.stringify(data));

    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.logo} alt="Logo" />

        <h2 style={styles.title}>BOUSHAHRI MEDICAL STORE</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f5fa8, #1e3a8a)",
  },

  card: {
    background: "#ffffff",
    padding: "36px",
    borderRadius: "26px",
    width: "420px",
    maxWidth: "90%",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  },

  logo: {
    width: "85px",
    display: "block",
    margin: "0 auto 18px",
  },

  title: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: "18px",
    textAlign: "center",
    letterSpacing: "1px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },

  button: {
    width: "150px",
    padding: "11px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "block",
    margin: "15px auto 0",
    fontSize: "15px",
    fontWeight: "700",
  },
};