import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "Dental",
    purchase_price: "",
    sell_price: "",
    stock: "",
    min_stock: "",
  });

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async () => {
    if (!form.name || !form.sell_price) return alert("اكتب اسم المنتج وسعر البيع");

    const { error } = await supabase.from("products").insert([{
      name: form.name,
      category: form.category,
      purchase_price: Number(form.purchase_price || 0),
      sell_price: Number(form.sell_price || 0),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
    }]);

    if (error) return alert(error.message);

    setForm({ name: "", category: "Dental", purchase_price: "", sell_price: "", stock: "", min_stock: "" });
    loadProducts();
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>BOUSHAHRI Admin Dashboard</h1>
        <button onClick={logout} style={styles.logout}>Logout</button>
      </div>

      <div style={styles.card}>
        <h2>Add Product</h2>

        <div style={styles.grid}>
          <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>Dental</option>
            <option>Surgical</option>
            <option>Lab</option>
          </select>
          <input placeholder="Purchase price" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
          <input placeholder="Sell price" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
          <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input placeholder="Min stock" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
        </div>

        <button onClick={addProduct} style={styles.primary}>Add Product</button>
      </div>

      <div style={styles.card}>
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
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 30, background: "#f3f7fb", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logout: { padding: "10px 18px", background: "#0f766e", color: "#fff", border: 0, borderRadius: 10 },
  card: { background: "#fff", padding: 24, borderRadius: 18, marginTop: 20, boxShadow: "0 8px 25px rgba(0,0,0,.08)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  primary: { marginTop: 15, padding: "12px 20px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
};