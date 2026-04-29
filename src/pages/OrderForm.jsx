import React, { useEffect, useMemo, useState } from "react";

const KWD = new Intl.NumberFormat("en-KW", { style: "currency", currency: "KWD", minimumFractionDigits: 3 });

export default function OrderForm({ supabase, user, onLogout }) {
  const clinicName = user?.clinic?.name || "BOUSHAHRI CLINIC";
  const doctorName = user?.clinic?.doctor_name || "Doctor Name";
  const clinicId = user?.clinic_id || null;

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product_id: "", qty: 1, price: 0 }]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setError("");
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, stock, sale_price, sell_price")
      .order("name", { ascending: true });

    if (error) {
      setError("Could not load products from the main warehouse system.");
      return;
    }
    setProducts(data || []);
  }

  function productPrice(product) {
    return Number(product?.sale_price ?? product?.sell_price ?? 0);
  }

  function updateItem(index, field, value) {
    setItems((old) => old.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      if (field === "product_id") {
        const p = products.find((x) => x.id === value);
        next.price = productPrice(p);
      }
      if (field === "qty") next.qty = Math.max(1, Number(value || 1));
      return next;
    }));
  }

  function addItem() {
    setItems((old) => [...old, { product_id: "", qty: 1, price: 0 }]);
  }

  function removeItem(index) {
    setItems((old) => old.length === 1 ? old : old.filter((_, i) => i !== index));
  }

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0), [items]);

  async function sendRequest() {
    setMessage("");
    setError("");

    const validItems = items.filter((item) => item.product_id && Number(item.qty) > 0);
    if (!validItems.length) {
      setError("Please select at least one product.");
      return;
    }
    if (!clinicId && user?.role !== "admin") {
      setError("This user is not linked to a clinic. Please contact warehouse admin.");
      return;
    }

    setSending(true);
    const requestPayload = {
      clinic_id: clinicId,
      request_date: new Date().toISOString().slice(0, 10),
      status: "Pending",
      total: grandTotal,
      notes: `Request submitted from clinic mobile app by ${user.username}`,
    };

    const { data: request, error: reqError } = await supabase
      .from("clinic_requests")
      .insert(requestPayload)
      .select("id")
      .single();

    if (reqError) {
      setSending(false);
      setError("Could not send request. Please check database tables and internet connection.");
      return;
    }

    const rows = validItems.map((item) => ({
      request_id: request.id,
      product_id: item.product_id,
      qty: Number(item.qty),
      price: Number(item.price),
      total: Number(item.qty) * Number(item.price),
    }));

    const { error: itemsError } = await supabase.from("request_items").insert(rows);
    if (itemsError) {
      setSending(false);
      setError("Request header was created but items could not be saved.");
      return;
    }

    setItems([{ product_id: "", qty: 1, price: 0 }]);
    setMessage("Request sent successfully. Warehouse will receive it now.");
    setSending(false);
  }

  return (
    <div className="pageShell">
      <button className="logoutBtn" onClick={onLogout}>Logout</button>
      <section className="orderCard">
        <div className="orderHeader">
          <div>
            <h1>Clinic Product Request</h1>
            <p>Create a new warehouse request</p>
          </div>
          <span className="statusBadge">Pending</span>
        </div>

        <div className="notice">Please review product quantities carefully before sending the request.</div>

        <div className="clinicGrid">
          <div className="infoBox"><span>Clinic</span><b>{clinicName}</b></div>
          <div className="infoBox"><span>Doctor</span><b>{doctorName}</b></div>
        </div>

        <div className="orderTable headerRow">
          <b>Product</b><b>Qty</b><b>Price</b><b>Total</b><b></b>
        </div>

        {items.map((item, index) => {
          const lineTotal = Number(item.qty || 0) * Number(item.price || 0);
          return (
            <div className="orderTable itemRow" key={index}>
              <select value={item.product_id} onChange={(e) => updateItem(index, "product_id", e.target.value)}>
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.category ? `- ${p.category}` : ""}</option>
                ))}
              </select>
              <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} />
              <input readOnly value={Number(item.price || 0).toFixed(3)} />
              <input readOnly value={lineTotal.toFixed(3)} />
              <button className="removeBtn" onClick={() => removeItem(index)} type="button">×</button>
            </div>
          );
        })}

        <button className="addBtn" onClick={addItem} type="button">+ Add Product</button>

        <div className="grandTotal"><span>Grand Total</span><b>{KWD.format(grandTotal)}</b></div>
        {message && <div className="successMsg">{message}</div>}
        {error && <div className="errorMsg">{error}</div>}
        <button className="sendBtn" disabled={sending} onClick={sendRequest}>{sending ? "Sending..." : "Send Request"}</button>
      </section>
    </div>
  );
}
