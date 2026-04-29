import React, { useEffect, useState } from "react";

export default function AdminDashboard({ supabase, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    purchase_price: "",
    sell_price: "",
    stock: "",
    min_stock: "",
  });

  const [clinicForm, setClinicForm] = useState({
    username: "",
    password: "",
    clinic_name: "",
    doctor_name: "",
  });

  useEffect(() => {
    loadProducts();
    loadRequests();
    loadUsers();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  }

  async function loadRequests() {
    const { data, error } = await supabase
      .from("clinic_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users_app")
      .select("*")
      .order("username", { ascending: true });

    if (!error) setUsers(data || []);
  }

  async function addProduct() {
    if (!productForm.name || !productForm.sell_price) {
      alert("اكتب اسم المنتج وسعر البيع");
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: productForm.name,
      category: productForm.category,
      purchase_price: Number(productForm.purchase_price || 0),
      sell_price: Number(productForm.sell_price || 0),
      stock: Number(productForm.stock || 0),
      min_stock: Number(productForm.min_stock || 0),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setProductForm({
      name: "",
      category: "",
      purchase_price: "",
      sell_price: "",
      stock: "",
      min_stock: "",
    });

    loadProducts();
  }

  async function createClinicUser() {
    if (
      !clinicForm.username ||
      !clinicForm.password ||
      !clinicForm.clinic_name ||
      !clinicForm.doctor_name
    ) {
      alert("كمل بيانات العيادة كلها");
      return;
    }

    const { error } = await supabase.from("users_app").insert({
      username: clinicForm.username,
      password: clinicForm.password,
      role: "clinic",
      clinic_name: clinicForm.clinic_name,
      doctor_name: clinicForm.doctor_name,
      active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setClinicForm({
      username: "",
      password: "",
      clinic_name: "",
      doctor_name: "",
    });

    loadUsers();
    alert("تم إنشاء حساب العيادة");
  }

  async function updateRequestStatus(id, status) {
    const { error } = await supabase
      .from("clinic_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadRequests();
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>BOUSHAHRI Admin Dashboard</h1>
          <p>Welcome {user?.username}</p>
        </div>

        <button style={styles.logout} onClick={onLogout}>
          Logout
        </button>
      </div>

      <div style={styles.grid2}>
        <section style={styles.card}>
          <h2>Add Product</h2>

          <input
            style={styles.input}
            placeholder="Product name"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Category"
            value={productForm.category}
            onChange={(e) =>
              setProductForm({ ...productForm, category: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Purchase price"
            value={productForm.purchase_price}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                purchase_price: e.target.value,
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Sell price"
            value={productForm.sell_price}
            onChange={(e) =>
              setProductForm({ ...productForm, sell_price: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Stock"
            value={productForm.stock}
            onChange={(e) =>
              setProductForm({ ...productForm, stock: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Min stock"
            value={productForm.min_stock}
            onChange={(e) =>
              setProductForm({ ...productForm, min_stock: e.target.value })
            }
          />

          <button style={styles.primary} onClick={addProduct}>
            Add Product
          </button>
        </section>

        <section style={styles.card}>
          <h2>Create Clinic User</h2>

          <input
            style={styles.input}
            placeholder="Username"
            value={clinicForm.username}
            onChange={(e) =>
              setClinicForm({ ...clinicForm, username: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Password"
            value={clinicForm.password}
            onChange={(e) =>
              setClinicForm({ ...clinicForm, password: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Clinic name"
            value={clinicForm.clinic_name}
            onChange={(e) =>
              setClinicForm({ ...clinicForm, clinic_name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Doctor name"
            value={clinicForm.doctor_name}
            onChange={(e) =>
              setClinicForm({ ...clinicForm, doctor_name: e.target.value })
            }
          />

          <button style={styles.primary} onClick={createClinicUser}>
            Create Clinic User
          </button>
        </section>
      </div>

      <section style={styles.card}>
        <h2>Products</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Sell Price</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{Number(p.sell_price || 0).toFixed(3)} KWD</td>
                <td>{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.card}>
        <h2>Clinic Users</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Clinic</th>
              <th>Doctor</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.clinic_name}</td>
                <td>{u.doctor_name}</td>
                <td>{u.role}</td>
                <td>{u.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.card}>
        <h2>Clinic Requests</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Clinic ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.request_date}</td>
                <td>{r.clinic_id || "N/A"}</td>
                <td>{r.status}</td>
                <td>{Number(r.total || 0).toFixed(3)} KWD</td>
                <td>
                  <button
                    style={styles.approve}
                    onClick={() => updateRequestStatus(r.id, "Approved")}
                  >
                    Approve
                  </button>

                  <button
                    style={styles.reject}
                    onClick={() => updateRequestStatus(r.id, "Rejected")}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  logout: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "18px",
    marginBottom: "22px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
  },

  primary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  approve: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    marginRight: "6px",
    cursor: "pointer",
  },

  reject: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};