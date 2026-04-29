import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "BOUSHAHRI" && password === "BOUSHAHRI") {
      localStorage.setItem("auth", "true");
      window.location.reload();
    } else {
      alert("Invalid username or password");
    }
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

          <button type="submit" style={styles.button}>
            Login
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
    background: "#0f5fa8",
  },

  card: {
    background: "#ffffff",
    padding: "36px",
    borderRadius: "26px",
    width: "520px",
    maxWidth: "90%",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  },

  logo: {
    width: "90px",
    display: "block",
    margin: "0 auto 22px",
  },

  title: {
    fontSize: "22px",
    color: "#1e3a8a",
    marginBottom: "26px",
    textAlign: "center",
    whiteSpace: "nowrap",
    fontWeight: "700",
    letterSpacing: "1px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 18px",
    marginBottom: "14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
  },

  button: {
    width: "160px",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    display: "block",
    margin: "16px auto 0",
    fontSize: "16px",
    fontWeight: "700",
  },
};