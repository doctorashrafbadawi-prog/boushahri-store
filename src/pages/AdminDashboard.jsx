import React, { useEffect, useMemo, useState } from "react";

export default function AdminDashboard({ supabase, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestItems, setRequestItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierAccounts, setSupplierAccounts] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);

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

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    supplier_id: "",
    invoice_no: "",
    total: "",
    paid: "",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    loadProducts();
    loadRequests();
    loadRequestItems();
    loadUsers();
    loadSuppliers();
    loadSupplierAccounts();
    loadPurchaseInvoices();
  }

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  }

  async function loadRequests() {
    const { data } = await supabase
      .from("clinic_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data || []);
  }

  async function loadRequestItems() {
    const { data } = await supabase.from("request_items").select("*");
    setRequestItems(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from("users_app").select("*").order("username");
    setUsers(data || []);
  }

  async function loadSuppliers() {
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
  }

  async function loadSupplierAccounts() {
    const { data } = await supabase
      .from("supplier_accounts")
      .select("*")
      .order("transaction_date", { ascending: false });
    setSupplierAccounts(data || []);
  }

  async function loadPurchaseInvoices() {
    const { data } = await supabase
      .from("purchase_invoices")
      .select("*")
      .order("invoice_date", { ascending: false });
    setPurchaseInvoices(data || []);
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

    if (error) return alert(error.message);

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
    if (!clinicForm.username || !clinicForm.password || !clinicForm.clinic_name) {
      alert("كمل بيانات العيادة");
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

    if (error) return alert(error.message);

    setClinicForm({
      username: "",
      password: "",
      clinic_name: "",
      doctor_name: "",
    });

    loadUsers();
    alert("تم إنشاء حساب العيادة");
  }

  async function approveRequest(requestId) {
    const items = requestItems.filter((x) => x.request_id === requestId);

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      const currentStock = Number(product?.stock || 0);
      const qty = Number(item.qty || 0);

      if (product && currentStock < qty) {
        alert(`المخزون غير كافي للمنتج: ${product.name}`);
        return;
      }
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;

      await supabase
        .from("products")
        .update({ stock: Number(product.stock || 0) - Number(item.qty || 0) })
        .eq("id", item.product_id);
    }

    const { error } = await supabase
      .from("clinic_requests")
      .update({
        status: "Approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return alert(error.message);

    loadAll();
  }

  async function rejectRequest(requestId) {
    const { error } = await supabase
      .from("clinic_requests")
      .update({
        status: "Rejected",
        rejected_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return alert(error.message);

    loadRequests();
  }

  async function addSupplier() {
    if (!supplierForm.name) {
      alert("اكتب اسم المورد");
      return;
    }

    const { error } = await supabase.from("suppliers").insert({
      name: supplierForm.name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
      balance: 0,
    });

    if (error) return alert(error.message);

    setSupplierForm({ name: "", phone: "", email: "", address: "" });
    loadSuppliers();
  }

  async function addPurchaseInvoice() {
    if (!invoiceForm.supplier_id || !invoiceForm.total) {
      alert("اختار المورد واكتب إجمالي الفاتورة");
      return;
    }

    const total = Number(invoiceForm.total || 0);
    const paid = Number(invoiceForm.paid || 0);
    const balance = total - paid;

    const { error } = await supabase.from("purchase_invoices").insert({
      supplier_id: invoiceForm.supplier_id,
      invoice_no: invoiceForm.invoice_no,
      invoice_date: new Date().toISOString().slice(0, 10),
      total,
      paid,
      balance,
      status: balance > 0 ? "Open" : "Paid",
    });

    if (error) return alert(error.message);

    await supabase.from("supplier_accounts").insert({
      supplier_id: invoiceForm.supplier_id,
      type: "invoice",
      amount: total,
      notes: `Invoice ${invoiceForm.invoice_no || ""}`,
    });

    if (paid > 0) {
      await supabase.from("supplier_accounts").insert({
        supplier_id: invoiceForm.supplier_id,
        type: "payment",
        amount: paid,
        notes: `Payment for invoice ${invoiceForm.invoice_no || ""}`,
      });
    }

    const supplier = suppliers.find((s) => s.id === invoiceForm.supplier_id);
    await supabase
      .from("suppliers")
      .update({ balance: Number(supplier?.balance || 0) + balance })
      .eq("id", invoiceForm.supplier_id);

    setInvoiceForm({
      supplier_id: "",
      invoice_no: "",
      total: "",
      paid: "",
      notes: "",
    });

    loadAll();
  }

  const reports = useMemo(() => {
    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.stock || 0) * Number(p.purchase_price || 0),
      0
    );

    const totalSalesRequests = requests
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + Number(r.total || 0), 0);

    const supplierBalance = suppliers.reduce(
      (sum, s) => sum + Number(s.balance || 0),
      0
    );

    const pendingRequests = requests.filter((r) => r.status === "Pending").length;

    return {
      totalStockValue,
      totalSalesRequests,
      supplierBalance,
      pendingRequests,
    };
  }, [products, requests, suppliers]);

  function requestDetails(requestId) {
    return requestItems
      .filter((x) => x.request_id === requestId)
      .map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return `${product?.name || "Product"} × ${item.qty}`;
      })
      .join(" / ");
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

      <div style={styles.reportGrid}>
        <div style={styles.reportBox}>
          <span>Pending Requests</span>
          <b>{reports.pendingRequests}</b>
        </div>
        <div style={styles.reportBox}>
          <span>Approved Requests Total</span>
          <b>{reports.totalSalesRequests.toFixed(3)} KWD</b>
        </div>
        <div style={styles.reportBox}>
          <span>Stock Value</span>
          <b>{reports.totalStockValue.toFixed(3)} KWD</b>
        </div>
        <div style={styles.reportBox}>
          <span>Supplier Balance</span>
          <b>{reports.supplierBalance.toFixed(3)} KWD</b>
        </div>
      </div>

      <div style={styles.grid2}>
        <section style={styles.card}>
          <h2>Add Product</h2>
          <input style={styles.input} placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          <input style={styles.input} placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
          <input style={styles.input} placeholder="Purchase price" value={productForm.purchase_price} onChange={(e) => setProductForm({ ...productForm, purchase_price: e.target.value })} />
          <input style={styles.input} placeholder="Sell price" value={productForm.sell_price} onChange={(e) => setProductForm({ ...productForm, sell_price: e.target.value })} />
          <input style={styles.input} placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
          <input style={styles.input} placeholder="Min stock" value={productForm.min_stock} onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })} />
          <button style={styles.primary} onClick={addProduct}>Add Product</button>
        </section>

        <section style={styles.card}>
          <h2>Create Clinic User</h2>
          <input style={styles.input} placeholder="Username" value={clinicForm.username} onChange={(e) => setClinicForm({ ...clinicForm, username: e.target.value })} />
          <input style={styles.input} placeholder="Password" value={clinicForm.password} onChange={(e) => setClinicForm({ ...clinicForm, password: e.target.value })} />
          <input style={styles.input} placeholder="Clinic name" value={clinicForm.clinic_name} onChange={(e) => setClinicForm({ ...clinicForm, clinic_name: e.target.value })} />
          <input style={styles.input} placeholder="Doctor name" value={clinicForm.doctor_name} onChange={(e) => setClinicForm({ ...clinicForm, doctor_name: e.target.value })} />
          <button style={styles.primary} onClick={createClinicUser}>Create Clinic User</button>
        </section>
      </div>

      <div style={styles.grid2}>
        <section style={styles.card}>
          <h2>Add Supplier</h2>
          <input style={styles.input} placeholder="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input style={styles.input} placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input style={styles.input} placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          <input style={styles.input} placeholder="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
          <button style={styles.primary} onClick={addSupplier}>Add Supplier</button>
        </section>

        <section style={styles.card}>
          <h2>Add Supplier Invoice</h2>
          <select style={styles.input} value={invoiceForm.supplier_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, supplier_id: e.target.value })}>
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input style={styles.input} placeholder="Invoice No" value={invoiceForm.invoice_no} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_no: e.target.value })} />
          <input style={styles.input} placeholder="Total" value={invoiceForm.total} onChange={(e) => setInvoiceForm({ ...invoiceForm, total: e.target.value })} />
          <input style={styles.input} placeholder="Paid" value={invoiceForm.paid} onChange={(e) => setInvoiceForm({ ...invoiceForm, paid: e.target.value })} />
          <button style={styles.primary} onClick={addPurchaseInvoice}>Add Invoice</button>
        </section>
      </div>

      <Table title="Products" headers={["Name", "Category", "Purchase", "Sell", "Stock"]}>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.category}</td>
            <td>{Number(p.purchase_price || 0).toFixed(3)}</td>
            <td>{Number(p.sell_price || 0).toFixed(3)}</td>
            <td>{p.stock}</td>
          </tr>
        ))}
      </Table>

      <Table title="Clinic Users" headers={["Username", "Clinic", "Doctor", "Role", "Active"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.username}</td>
            <td>{u.clinic_name}</td>
            <td>{u.doctor_name}</td>
            <td>{u.role}</td>
            <td>{u.active ? "Yes" : "No"}</td>
          </tr>
        ))}
      </Table>

      <Table title="Clinic Requests" headers={["Date", "Details", "Status", "Total", "Actions"]}>
        {requests.map((r) => (
          <tr key={r.id}>
            <td>{r.request_date}</td>
            <td>{requestDetails(r.id)}</td>
            <td>{r.status}</td>
            <td>{Number(r.total || 0).toFixed(3)} KWD</td>
            <td>
              {r.status === "Pending" && (
                <>
                  <button style={styles.approve} onClick={() => approveRequest(r.id)}>Approve</button>
                  <button style={styles.reject} onClick={() => rejectRequest(r.id)}>Reject</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <Table title="Suppliers" headers={["Name", "Phone", "Email", "Balance"]}>
        {suppliers.map((s) => (
          <tr key={s.id}>
            <td>{s.name}</td>
            <td>{s.phone}</td>
            <td>{s.email}</td>
            <td>{Number(s.balance || 0).toFixed(3)} KWD</td>
          </tr>
        ))}
      </Table>

      <Table title="Purchase Invoices" headers={["Invoice", "Supplier", "Total", "Paid", "Balance", "Status"]}>
        {purchaseInvoices.map((inv) => {
          const supplier = suppliers.find((s) => s.id === inv.supplier_id);
          return (
            <tr key={inv.id}>
              <td>{inv.invoice_no}</td>
              <td>{supplier?.name || ""}</td>
              <td>{Number(inv.total || 0).toFixed(3)}</td>
              <td>{Number(inv.paid || 0).toFixed(3)}</td>
              <td>{Number(inv.balance || 0).toFixed(3)}</td>
              <td>{inv.status}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

function Table({ title, headers, children }) {
  return (
    <section style={styles.card}>
      <h2>{title}</h2>
      <table style={styles.table}>
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f3f7fb", padding: 30, fontFamily: "Arial" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  logout: { background: "#0f766e", color: "#fff", border: 0, padding: "12px 20px", borderRadius: 10, fontWeight: 700 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  reportGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, marginBottom: 20 },
  reportBox: { background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 8px 25px rgba(0,0,0,.08)" },
  card: { background: "#fff", padding: 24, borderRadius: 18, marginBottom: 22, boxShadow: "0 8px 25px rgba(0,0,0,.08)" },
  input: { width: "100%", padding: 12, marginBottom: 10, borderRadius: 10, border: "1px solid #cbd5e1", boxSizing: "border-box" },
  primary: { background: "#2563eb", color: "#fff", border: 0, padding: "12px 18px", borderRadius: 10, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse" },
  approve: { background: "#16a34a", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 8, marginRight: 6 },
  reject: { background: "#dc2626", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 8 },
};