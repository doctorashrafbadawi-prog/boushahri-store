import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

export default function AdminDashboard({ supabase, user, onLogout }) {
  const today = new Date().toISOString().slice(0, 10);

  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestItems, setRequestItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierAccounts, setSupplierAccounts] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

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
    product_id: "",
    qty: "",
    unit_cost: "",
    invoice_no: "",
    purchase_date: today,
    total: "",
    paid: "",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([
      loadProducts(),
      loadRequests(),
      loadRequestItems(),
      loadUsers(),
      loadSuppliers(),
      loadSupplierAccounts(),
      loadPurchaseInvoices(),
      loadStockMovements(),
    ]);
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) return console.log("products error", error);
    setProducts(data || []);
  }

  async function loadRequests() {
    const { data, error } = await supabase
      .from("clinic_requests")
      .select("*")
      .order("date", { ascending: false });

    if (error) return console.log("requests error", error);
    setRequests(data || []);
  }

  async function loadRequestItems() {
    const { data, error } = await supabase.from("request_items").select("*");
    if (error) return console.log("request_items error", error);
    setRequestItems(data || []);
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users_app")
      .select("*")
      .order("username");

    if (error) return console.log("users error", error);
    setUsers(data || []);
  }

  async function loadSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) return console.log("suppliers error", error);
    setSuppliers(data || []);
  }

  async function loadSupplierAccounts() {
    const { data, error } = await supabase
      .from("supplier_accounts")
      .select("*")
      .order("transaction_date", { ascending: false });

    if (error) return console.log("supplier_accounts error", error);
    setSupplierAccounts(data || []);
  }

  async function loadPurchaseInvoices() {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select("*")
      .order("purchase_date", { ascending: false });

    if (error) return console.log("purchase_invoices error", error);
    setPurchaseInvoices(data || []);
  }

  async function loadStockMovements() {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .order("movement_date", { ascending: false });

    if (error) return console.log("stock_movements error", error);
    setStockMovements(data || []);
  }

  const productById = (id) => products.find((p) => p.id === id);
  const supplierById = (id) => suppliers.find((s) => s.id === id);
  const productPrice = (productId) => Number(productById(productId)?.sell_price || 0);
  const requestDate = (req) => req?.date || req?.request_date || "";
  const invoiceDate = (inv) => inv?.purchase_date || inv?.invoice_date || "";
  const formatDate = (value) => (value ? String(value).slice(0, 10) : "");

  function requestTotal(requestId) {
    return requestItems
      .filter((x) => x.request_id === requestId)
      .reduce(
        (sum, item) =>
          sum + Number(item.qty || 0) * productPrice(item.product_id),
        0
      );
  }

  function requestDetails(requestId) {
    return requestItems
      .filter((x) => x.request_id === requestId)
      .map((item) => {
        const product = productById(item.product_id);
        const price = productPrice(item.product_id);
        const total = Number(item.qty || 0) * price;
        return `${product?.name || "Product"} × ${item.qty} = ${total.toFixed(
          3
        )} KWD`;
      })
      .join(" / ");
  }

  function inDateRangeByValue(value) {
    const d = formatDate(value);
    if (!d) return true;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  }

  function inDateRange(req) {
    return inDateRangeByValue(requestDate(req));
  }

  const filteredRequests = useMemo(
    () => requests.filter(inDateRange),
    [requests, fromDate, toDate]
  );

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter((inv) => inDateRangeByValue(invoiceDate(inv)));
  }, [purchaseInvoices, fromDate, toDate]);

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (p) => Number(p.stock || 0) <= Number(p.min_stock || 0)
      ),
    [products]
  );

  const productReport = useMemo(() => {
    if (!selectedProduct) return { qty: 0, value: 0 };

    let qty = 0;
    let value = 0;

    filteredRequests.forEach((req) => {
      requestItems
        .filter(
          (i) => i.request_id === req.id && i.product_id === selectedProduct
        )
        .forEach((i) => {
          qty += Number(i.qty || 0);
          value += Number(i.qty || 0) * productPrice(i.product_id);
        });
    });

    return { qty, value };
  }, [selectedProduct, filteredRequests, requestItems, products]);

  const supplierReport = useMemo(() => {
    const accounts = supplierAccounts.filter(
      (a) => a.supplier_id === selectedSupplier
    );

    const totalInvoices = accounts
      .filter((a) => a.type === "invoice")
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const totalPaid = accounts
      .filter((a) => a.type === "payment")
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    return {
      totalInvoices,
      totalPaid,
      balance: totalInvoices - totalPaid,
    };
  }, [selectedSupplier, supplierAccounts]);

  const purchaseReport = useMemo(() => {
    const total = filteredPurchaseInvoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0),
      0
    );

    const paid = filteredPurchaseInvoices.reduce(
      (sum, inv) => sum + Number(inv.paid || 0),
      0
    );

    const balance = filteredPurchaseInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance || 0),
      0
    );

    return {
      count: filteredPurchaseInvoices.length,
      total,
      paid,
      balance,
    };
  }, [filteredPurchaseInvoices]);

  const monthlyReport = useMemo(() => {
    if (!reportMonth) return { count: 0, total: 0 };

    const list = requests.filter((r) =>
      formatDate(requestDate(r)).startsWith(reportMonth)
    );

    return {
      count: list.length,
      total: list.reduce((sum, r) => sum + requestTotal(r.id), 0),
    };
  }, [reportMonth, requests, requestItems, products]);

  const annualReport = useMemo(() => {
    const year = String(reportYear || "");
    const list = requests.filter((r) =>
      formatDate(requestDate(r)).startsWith(year)
    );

    return {
      count: list.length,
      total: list.reduce((sum, r) => sum + requestTotal(r.id), 0),
    };
  }, [reportYear, requests, requestItems, products]);

  const stockReport = useMemo(() => {
    if (!selectedProduct) {
      return { inQty: 0, outQty: 0, adjustmentQty: 0, balance: 0 };
    }

    const list = stockMovements.filter((m) => m.product_id === selectedProduct);

    const inQty = list
      .filter((m) => m.type === "in")
      .reduce((sum, m) => sum + Number(m.qty || 0), 0);

    const outQty = list
      .filter((m) => m.type === "out")
      .reduce((sum, m) => sum + Number(m.qty || 0), 0);

    const adjustmentQty = list
      .filter((m) => m.type === "adjustment")
      .reduce((sum, m) => sum + Number(m.qty || 0), 0);

    return {
      inQty,
      outQty,
      adjustmentQty,
      balance: Number(productById(selectedProduct)?.stock || 0),
    };
  }, [selectedProduct, stockMovements, products]);

  const reports = useMemo(() => {
    const totalStockValue = products.reduce(
      (sum, p) =>
        sum + Number(p.stock || 0) * Number(p.purchase_price || 0),
      0
    );

    const approvedRequestsTotal = requests
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + requestTotal(r.id), 0);

    const supplierBalance = suppliers.reduce(
      (sum, s) => sum + Number(s.balance || 0),
      0
    );

    const pendingRequests = requests.filter(
      (r) => r.status === "Pending"
    ).length;

    return {
      totalStockValue,
      approvedRequestsTotal,
      supplierBalance,
      pendingRequests,
    };
  }, [products, requests, requestItems, suppliers]);

  async function addProduct() {
    if (!productForm.name || !productForm.sell_price) {
      return alert("اكتب اسم المنتج وسعر البيع");
    }

    const stock = Number(productForm.stock || 0);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: productForm.name,
        category: productForm.category,
        purchase_price: Number(productForm.purchase_price || 0),
        sell_price: Number(productForm.sell_price || 0),
        stock,
        min_stock: Number(productForm.min_stock || 0),
      })
      .select("id")
      .single();

    if (error) return alert(error.message);

    if (stock > 0 && data?.id) {
      await supabase.from("stock_movements").insert({
        product_id: data.id,
        type: "in",
        qty: stock,
        reference_type: "manual",
        notes: "Initial stock",
      });
    }

    setProductForm({
      name: "",
      category: "",
      purchase_price: "",
      sell_price: "",
      stock: "",
      min_stock: "",
    });

    loadAll();
  }

  async function createClinicUser() {
    if (!clinicForm.username || !clinicForm.password || !clinicForm.clinic_name) {
      return alert("كمل بيانات العيادة");
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

    if (!items.length) {
      return alert("لا يوجد منتجات داخل الطلب");
    }

    for (const item of items) {
      const product = productById(item.product_id);
      const currentStock = Number(product?.stock || 0);
      const qty = Number(item.qty || 0);

      if (product && currentStock < qty) {
        return alert(`المخزون غير كافي للمنتج: ${product.name}`);
      }
    }

    for (const item of items) {
      const product = productById(item.product_id);
      if (!product) continue;

      const qty = Number(item.qty || 0);

      await supabase
        .from("products")
        .update({ stock: Number(product.stock || 0) - qty })
        .eq("id", item.product_id);

      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        type: "out",
        qty,
        reference_type: "clinic_request",
        reference_id: requestId,
        notes: "Clinic request approved",
      });
    }

    const { error } = await supabase
      .from("clinic_requests")
      .update({
        status: "Approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return alert(error.message);

    await loadAll();
  }

  async function rejectRequest(requestId) {
    const note = prompt("سبب الرفض؟") || "";

    const { error } = await supabase
      .from("clinic_requests")
      .update({
        status: "Rejected",
        rejected_at: new Date().toISOString(),
        admin_note: note,
      })
      .eq("id", requestId);

    if (error) return alert(error.message);

    loadRequests();
  }

  async function addSupplier() {
    if (!supplierForm.name) return alert("اكتب اسم المورد");

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
    if (
      !invoiceForm.supplier_id ||
      !invoiceForm.product_id ||
      !invoiceForm.qty ||
      !invoiceForm.unit_cost
    ) {
      return alert("اختار المورد والمنتج واكتب الكمية وسعر الشراء");
    }

    const qty = Number(invoiceForm.qty || 0);
    const unitCost = Number(invoiceForm.unit_cost || 0);
    const calculatedTotal = qty * unitCost;
    const total = Number(invoiceForm.total || calculatedTotal);
    const paid = Number(invoiceForm.paid || 0);
    const balance = total - paid;
    const purchaseDate = invoiceForm.purchase_date || today;

    const { data: invoice, error } = await supabase
      .from("purchase_invoices")
      .insert({
        supplier_id: invoiceForm.supplier_id,
        invoice_no: invoiceForm.invoice_no,
        invoice_date: purchaseDate,
        purchase_date: purchaseDate,
        total,
        paid,
        balance,
        status: balance > 0 ? "Open" : "Paid",
      })
      .select("id")
      .single();

    if (error) return alert(error.message);

    await supabase.from("supplier_accounts").insert({
      supplier_id: invoiceForm.supplier_id,
      transaction_date: purchaseDate,
      type: "invoice",
      amount: total,
      notes: `Invoice ${invoiceForm.invoice_no || ""}`,
    });

    if (paid > 0) {
      await supabase.from("supplier_accounts").insert({
        supplier_id: invoiceForm.supplier_id,
        transaction_date: purchaseDate,
        type: "payment",
        amount: paid,
        notes: `Payment for invoice ${invoiceForm.invoice_no || ""}`,
      });
    }

    const supplier = supplierById(invoiceForm.supplier_id);

    await supabase
      .from("suppliers")
      .update({ balance: Number(supplier?.balance || 0) + balance })
      .eq("id", invoiceForm.supplier_id);

    const product = productById(invoiceForm.product_id);

    if (product) {
      await supabase
        .from("products")
        .update({
          stock: Number(product.stock || 0) + qty,
          purchase_price: unitCost,
        })
        .eq("id", invoiceForm.product_id);
    }

    await supabase.from("stock_movements").insert({
      product_id: invoiceForm.product_id,
      movement_date: purchaseDate,
      type: "in",
      qty,
      reference_type: "purchase_invoice",
      reference_id: invoice?.id || null,
      notes: `Supplier invoice ${invoiceForm.invoice_no || ""}`,
    });

    setInvoiceForm({
      supplier_id: "",
      product_id: "",
      qty: "",
      unit_cost: "",
      invoice_no: "",
      purchase_date: today,
      total: "",
      paid: "",
      notes: "",
    });

    loadAll();
  }

  function createPdf(title, lines = [], table = [], totals = []) {
    const doc = new jsPDF();
    let y = 14;

    doc.setFontSize(16);
    doc.text("BOUSHAHRI MEDICAL STORE", 14, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(title, 14, y);
    y += 10;

    doc.setFontSize(10);

    lines.forEach((line) => {
      doc.text(String(line), 14, y);
      y += 7;
    });

    y += 3;

    table.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 14;
      }

      doc.text(String(row).slice(0, 105), 14, y);
      y += 7;
    });

    y += 5;
    doc.setFontSize(11);

    totals.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 14;
      }

      doc.text(String(line), 14, y);
      y += 8;
    });

    doc.save(`${title.replaceAll(" ", "_")}.pdf`);
  }

  function printHtml(title, body) {
    const win = window.open("", "", "width=900,height=700");

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial; padding: 25px; color: #111; }
            h1, h2 { color: #0f4c81; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #eef5ff; }
            .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>${body}</body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  }

  function printRequest(requestId) {
    const req = requests.find((r) => r.id === requestId);
    const items = requestItems.filter((i) => i.request_id === requestId);

    const rows = items
      .map((item) => {
        const product = productById(item.product_id);
        const price = productPrice(item.product_id);
        const lineTotal = Number(item.qty || 0) * price;

        return `
          <tr>
            <td>${product?.name || ""}</td>
            <td>${product?.category || ""}</td>
            <td>${item.qty}</td>
            <td>${price.toFixed(3)}</td>
            <td>${lineTotal.toFixed(3)}</td>
          </tr>
        `;
      })
      .join("");

    printHtml(
      "Clinic Request",
      `
        <h1>BOUSHAHRI MEDICAL STORE</h1>
        <h2>Clinic Request</h2>
        <p><b>Date:</b> ${formatDate(requestDate(req))}</p>
        <p><b>Status:</b> ${req?.status || ""}</p>
        <p><b>Clinic ID:</b> ${req?.clinic_id || "N/A"}</p>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total">Grand Total: ${requestTotal(requestId).toFixed(
          3
        )} KWD</div>
      `
    );
  }

  function exportRequestPDF(requestId) {
    const req = requests.find((r) => r.id === requestId);

    const table = requestItems
      .filter((i) => i.request_id === requestId)
      .map((item) => {
        const product = productById(item.product_id);
        const price = productPrice(item.product_id);
        const lineTotal = Number(item.qty || 0) * price;

        return `${product?.name || ""} | Qty: ${
          item.qty
        } | Price: ${price.toFixed(3)} | Total: ${lineTotal.toFixed(3)} KWD`;
      });

    createPdf(
      "Clinic Request",
      [
        `Date: ${formatDate(requestDate(req))}`,
        `Status: ${req?.status || ""}`,
        `Clinic ID: ${req?.clinic_id || "N/A"}`,
      ],
      table,
      [`Grand Total: ${requestTotal(requestId).toFixed(3)} KWD`]
    );
  }

  function exportRequestsReportPDF() {
    const table = filteredRequests.map(
      (r) =>
        `${formatDate(requestDate(r))} | ${r.status} | ${requestDetails(
          r.id
        )} | ${requestTotal(r.id).toFixed(3)} KWD`
    );

    const total = filteredRequests.reduce(
      (sum, r) => sum + requestTotal(r.id),
      0
    );

    createPdf(
      "Requests Report",
      [`From: ${fromDate || "All"}`, `To: ${toDate || "All"}`],
      table,
      [`Total: ${total.toFixed(3)} KWD`]
    );
  }

  function printRequestsReport() {
    const rows = filteredRequests
      .map(
        (r) => `
        <tr>
          <td>${formatDate(requestDate(r))}</td>
          <td>${requestDetails(r.id)}</td>
          <td>${r.status}</td>
          <td>${requestTotal(r.id).toFixed(3)} KWD</td>
        </tr>
      `
      )
      .join("");

    const total = filteredRequests.reduce(
      (sum, r) => sum + requestTotal(r.id),
      0
    );

    printHtml(
      "Requests Report",
      `
        <h1>Requests Report</h1>
        <p><b>From:</b> ${fromDate || "All"} - <b>To:</b> ${
        toDate || "All"
      }</p>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total">Total: ${total.toFixed(3)} KWD</div>
      `
    );
  }

  function exportPurchaseReportPDF() {
    const table = filteredPurchaseInvoices.map((inv) => {
      const supplier = supplierById(inv.supplier_id);

      return `${formatDate(invoiceDate(inv))} | ${
        supplier?.name || ""
      } | Invoice: ${inv.invoice_no || ""} | Total: ${Number(
        inv.total || 0
      ).toFixed(3)} | Paid: ${Number(inv.paid || 0).toFixed(
        3
      )} | Balance: ${Number(inv.balance || 0).toFixed(3)} KWD`;
    });

    createPdf(
      "Purchase Invoices Report",
      [`From: ${fromDate || "All"}`, `To: ${toDate || "All"}`],
      table,
      [
        `Invoices Count: ${purchaseReport.count}`,
        `Total Purchases: ${purchaseReport.total.toFixed(3)} KWD`,
        `Total Paid: ${purchaseReport.paid.toFixed(3)} KWD`,
        `Total Balance: ${purchaseReport.balance.toFixed(3)} KWD`,
      ]
    );
  }

  function printPurchaseReport() {
    const rows = filteredPurchaseInvoices
      .map((inv) => {
        const supplier = supplierById(inv.supplier_id);

        return `
          <tr>
            <td>${formatDate(invoiceDate(inv))}</td>
            <td>${supplier?.name || ""}</td>
            <td>${inv.invoice_no || ""}</td>
            <td>${Number(inv.total || 0).toFixed(3)}</td>
            <td>${Number(inv.paid || 0).toFixed(3)}</td>
            <td>${Number(inv.balance || 0).toFixed(3)}</td>
          </tr>
        `;
      })
      .join("");

    printHtml(
      "Purchase Report",
      `
        <h1>Purchase Invoices Report</h1>
        <p><b>From:</b> ${fromDate || "All"} - <b>To:</b> ${
        toDate || "All"
      }</p>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Invoice No</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total">Total Purchases: ${purchaseReport.total.toFixed(
          3
        )} KWD</div>
        <div class="total">Total Paid: ${purchaseReport.paid.toFixed(
          3
        )} KWD</div>
        <div class="total">Total Balance: ${purchaseReport.balance.toFixed(
          3
        )} KWD</div>
      `
    );
  }

  function printInvoice(inv) {
    const supplier = supplierById(inv.supplier_id);

    printHtml(
      "Supplier Invoice",
      `
        <h1>BOUSHAHRI MEDICAL STORE</h1>
        <h2>Supplier Invoice</h2>

        <p><b>Supplier:</b> ${supplier?.name || ""}</p>
        <p><b>Date:</b> ${formatDate(invoiceDate(inv))}</p>
        <p><b>Invoice No:</b> ${inv.invoice_no || ""}</p>

        <table>
          <thead>
            <tr>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${Number(inv.total || 0).toFixed(3)}</td>
              <td>${Number(inv.paid || 0).toFixed(3)}</td>
              <td>${Number(inv.balance || 0).toFixed(3)}</td>
              <td>${inv.status || ""}</td>
            </tr>
          </tbody>
        </table>
      `
    );
  }

  function exportInvoicePDF(inv) {
    const supplier = supplierById(inv.supplier_id);

    createPdf(
      "Supplier Invoice",
      [
        `Supplier: ${supplier?.name || ""}`,
        `Date: ${formatDate(invoiceDate(inv))}`,
        `Invoice No: ${inv.invoice_no || ""}`,
      ],
      [
        `Total: ${Number(inv.total || 0).toFixed(3)} KWD`,
        `Paid: ${Number(inv.paid || 0).toFixed(3)} KWD`,
        `Balance: ${Number(inv.balance || 0).toFixed(3)} KWD`,
        `Status: ${inv.status || ""}`,
      ],
      []
    );
  }

  function exportSupplierStatementPDF() {
    const supplier = supplierById(selectedSupplier);

    const table = supplierAccounts
      .filter((a) => a.supplier_id === selectedSupplier)
      .map(
        (a) =>
          `${formatDate(a.transaction_date)} | ${a.type} | ${Number(
            a.amount || 0
          ).toFixed(3)} KWD | ${a.notes || ""}`
      );

    createPdf(
      "Supplier Statement",
      [`Supplier: ${supplier?.name || ""}`],
      table,
      [
        `Invoices: ${supplierReport.totalInvoices.toFixed(3)} KWD`,
        `Paid: ${supplierReport.totalPaid.toFixed(3)} KWD`,
        `Balance: ${supplierReport.balance.toFixed(3)} KWD`,
      ]
    );
  }

  function printSupplierStatement() {
    const supplier = supplierById(selectedSupplier);

    const rows = supplierAccounts
      .filter((a) => a.supplier_id === selectedSupplier)
      .map(
        (a) => `
        <tr>
          <td>${formatDate(a.transaction_date)}</td>
          <td>${a.type}</td>
          <td>${Number(a.amount || 0).toFixed(3)}</td>
          <td>${a.notes || ""}</td>
        </tr>
      `
      )
      .join("");

    printHtml(
      "Supplier Statement",
      `
        <h1>Supplier Statement</h1>
        <h2>${supplier?.name || ""}</h2>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="total">Invoices: ${supplierReport.totalInvoices.toFixed(
          3
        )} KWD</div>
        <div class="total">Paid: ${supplierReport.totalPaid.toFixed(
          3
        )} KWD</div>
        <div class="total">Balance: ${supplierReport.balance.toFixed(
          3
        )} KWD</div>
      `
    );
  }

  function exportStockMovementsPDF() {
    const list = selectedProduct
      ? stockMovements.filter((m) => m.product_id === selectedProduct)
      : stockMovements;

    const table = list.map(
      (m) =>
        `${formatDate(m.movement_date)} | ${
          productById(m.product_id)?.name || ""
        } | ${m.type} | Qty: ${m.qty} | ${m.notes || ""}`
    );

    createPdf(
      "Stock Movements",
      selectedProduct
        ? [`Product: ${productById(selectedProduct)?.name || ""}`]
        : ["All Products"],
      table,
      []
    );
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
        <ReportBox title="Pending Requests" value={reports.pendingRequests} />
        <ReportBox
          title="Approved Requests Total"
          value={`${reports.approvedRequestsTotal.toFixed(3)} KWD`}
        />
        <ReportBox
          title="Stock Value"
          value={`${reports.totalStockValue.toFixed(3)} KWD`}
        />
        <ReportBox
          title="Supplier Balance"
          value={`${reports.supplierBalance.toFixed(3)} KWD`}
        />
      </div>

      {lowStockProducts.length > 0 && (
        <section style={styles.warningCard}>
          <h2>Low Stock Alerts</h2>
          {lowStockProducts.map((p) => (
            <div key={p.id}>
              {p.name}: Stock {p.stock} / Min {p.min_stock}
            </div>
          ))}
        </section>
      )}

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

      <div style={styles.grid2}>
        <section style={styles.card}>
          <h2>Add Supplier</h2>

          <input
            style={styles.input}
            placeholder="Supplier name"
            value={supplierForm.name}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Phone"
            value={supplierForm.phone}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, phone: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Email"
            value={supplierForm.email}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Address"
            value={supplierForm.address}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, address: e.target.value })
            }
          />

          <button style={styles.primary} onClick={addSupplier}>
            Add Supplier
          </button>
        </section>

        <section style={styles.card}>
          <h2>Add Supplier Invoice + Stock In</h2>

          <select
            style={styles.input}
            value={invoiceForm.supplier_id}
            onChange={(e) =>
              setInvoiceForm({
                ...invoiceForm,
                supplier_id: e.target.value,
              })
            }
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={invoiceForm.product_id}
            onChange={(e) => {
              const product = productById(e.target.value);
              setInvoiceForm({
                ...invoiceForm,
                product_id: e.target.value,
                unit_cost: product?.purchase_price || "",
              });
            }}
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            style={styles.input}
            type="date"
            value={invoiceForm.purchase_date}
            onChange={(e) =>
              setInvoiceForm({
                ...invoiceForm,
                purchase_date: e.target.value,
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Qty"
            value={invoiceForm.qty}
            onChange={(e) => {
              const qty = Number(e.target.value || 0);
              const unit = Number(invoiceForm.unit_cost || 0);
              setInvoiceForm({
                ...invoiceForm,
                qty: e.target.value,
                total: qty && unit ? String(qty * unit) : invoiceForm.total,
              });
            }}
          />

          <input
            style={styles.input}
            placeholder="Unit Cost"
            value={invoiceForm.unit_cost}
            onChange={(e) => {
              const unit = Number(e.target.value || 0);
              const qty = Number(invoiceForm.qty || 0);
              setInvoiceForm({
                ...invoiceForm,
                unit_cost: e.target.value,
                total: qty && unit ? String(qty * unit) : invoiceForm.total,
              });
            }}
          />

          <input
            style={styles.input}
            placeholder="Invoice No"
            value={invoiceForm.invoice_no}
            onChange={(e) =>
              setInvoiceForm({
                ...invoiceForm,
                invoice_no: e.target.value,
              })
            }
          />

          <input
            style={styles.input}
            placeholder="Total"
            value={invoiceForm.total}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, total: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Paid"
            value={invoiceForm.paid}
            onChange={(e) =>
              setInvoiceForm({ ...invoiceForm, paid: e.target.value })
            }
          />

          <button style={styles.primary} onClick={addPurchaseInvoice}>
            Add Invoice
          </button>
        </section>
      </div>

      <section style={styles.card}>
        <h2>Reports & PDF</h2>

        <div style={styles.grid4}>
          <input
            style={styles.input}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            style={styles.input}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <button style={styles.primary} onClick={printRequestsReport}>
            Print Requests
          </button>

          <button style={styles.primary} onClick={exportRequestsReportPDF}>
            PDF Requests
          </button>
        </div>

        <div style={styles.grid4}>
          <button style={styles.primary} onClick={printPurchaseReport}>
            Print Purchases
          </button>

          <button style={styles.primary} onClick={exportPurchaseReportPDF}>
            PDF Purchases
          </button>

          <div style={styles.miniReport}>
            Purchases: <b>{purchaseReport.total.toFixed(3)} KWD</b>
          </div>

          <div style={styles.miniReport}>
            Balance: <b>{purchaseReport.balance.toFixed(3)} KWD</b>
          </div>
        </div>

        <div style={styles.grid4}>
          <select
            style={styles.input}
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select Product Report</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div style={styles.miniReport}>
            Qty Used: <b>{productReport.qty}</b>
          </div>

          <div style={styles.miniReport}>
            Value: <b>{productReport.value.toFixed(3)} KWD</b>
          </div>

          <div style={styles.miniReport}>
            Stock Balance: <b>{stockReport.balance}</b>
          </div>
        </div>

        <div style={styles.grid4}>
          <div style={styles.miniReport}>
            Stock In: <b>{stockReport.inQty}</b>
          </div>

          <div style={styles.miniReport}>
            Stock Out: <b>{stockReport.outQty}</b>
          </div>

          <button style={styles.primary} onClick={exportStockMovementsPDF}>
            PDF Stock Movements
          </button>
        </div>

        <div style={styles.grid4}>
          <input
            style={styles.input}
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
          />

          <div style={styles.miniReport}>
            Monthly Requests: <b>{monthlyReport.count}</b>
          </div>

          <div style={styles.miniReport}>
            Monthly Total: <b>{monthlyReport.total.toFixed(3)} KWD</b>
          </div>
        </div>

        <div style={styles.grid4}>
          <input
            style={styles.input}
            type="number"
            value={reportYear}
            onChange={(e) => setReportYear(e.target.value)}
          />

          <div style={styles.miniReport}>
            Annual Requests: <b>{annualReport.count}</b>
          </div>

          <div style={styles.miniReport}>
            Annual Total: <b>{annualReport.total.toFixed(3)} KWD</b>
          </div>
        </div>

        <div style={styles.grid4}>
          <select
            style={styles.input}
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Select Supplier Statement</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={styles.miniReport}>
            Invoices: <b>{supplierReport.totalInvoices.toFixed(3)}</b>
          </div>

          <div style={styles.miniReport}>
            Paid: <b>{supplierReport.totalPaid.toFixed(3)}</b>
          </div>

          <div style={styles.miniReport}>
            Balance: <b>{supplierReport.balance.toFixed(3)}</b>
          </div>

          <button
            style={styles.primary}
            onClick={printSupplierStatement}
            disabled={!selectedSupplier}
          >
            Print Supplier
          </button>

          <button
            style={styles.primary}
            onClick={exportSupplierStatementPDF}
            disabled={!selectedSupplier}
          >
            PDF Supplier
          </button>
        </div>
      </section>

      <Table
        title="Products"
        headers={["Name", "Category", "Purchase", "Sell", "Stock", "Min"]}
      >
        {products.map((p) => (
          <tr key={p.id}>
            <td style={styles.td}>{p.name}</td>
            <td style={styles.td}>{p.category}</td>
            <td style={styles.td}>
              {Number(p.purchase_price || 0).toFixed(3)}
            </td>
            <td style={styles.td}>{Number(p.sell_price || 0).toFixed(3)}</td>
            <td style={styles.td}>{p.stock}</td>
            <td style={styles.td}>{p.min_stock}</td>
          </tr>
        ))}
      </Table>

      <Table
        title="Clinic Users"
        headers={["Username", "Clinic", "Doctor", "Role", "Active"]}
      >
        {users.map((u) => (
          <tr key={u.id}>
            <td style={styles.td}>{u.username}</td>
            <td style={styles.td}>{u.clinic_name}</td>
            <td style={styles.td}>{u.doctor_name}</td>
            <td style={styles.td}>{u.role}</td>
            <td style={styles.td}>{u.active ? "Yes" : "No"}</td>
          </tr>
        ))}
      </Table>

      <Table
        title="Clinic Requests"
        headers={["Date", "Details", "Status", "Total", "Actions"]}
      >
        {filteredRequests.map((r) => (
          <tr key={r.id}>
            <td style={styles.td}>{formatDate(requestDate(r))}</td>
            <td style={styles.td}>{requestDetails(r.id)}</td>
            <td style={styles.td}>{r.status}</td>
            <td style={styles.td}>{requestTotal(r.id).toFixed(3)} KWD</td>
            <td style={styles.td}>
              <button style={styles.print} onClick={() => printRequest(r.id)}>
                Print
              </button>

              <button
                style={styles.print}
                onClick={() => exportRequestPDF(r.id)}
              >
                PDF
              </button>

              {r.status === "Pending" && (
                <>
                  <button
                    style={styles.approve}
                    onClick={() => approveRequest(r.id)}
                  >
                    Approve
                  </button>

                  <button
                    style={styles.reject}
                    onClick={() => rejectRequest(r.id)}
                  >
                    Reject
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </Table>

      <Table title="Suppliers" headers={["Name", "Phone", "Email", "Balance"]}>
        {suppliers.map((s) => (
          <tr key={s.id}>
            <td style={styles.td}>{s.name}</td>
            <td style={styles.td}>{s.phone}</td>
            <td style={styles.td}>{s.email}</td>
            <td style={styles.td}>{Number(s.balance || 0).toFixed(3)} KWD</td>
          </tr>
        ))}
      </Table>

      <Table
        title="Purchase Invoices"
        headers={[
          "Date",
          "Invoice",
          "Supplier",
          "Total",
          "Paid",
          "Balance",
          "Status",
          "Actions",
        ]}
      >
        {purchaseInvoices.map((inv) => {
          const supplier = supplierById(inv.supplier_id);

          return (
            <tr key={inv.id}>
              <td style={styles.td}>{formatDate(invoiceDate(inv))}</td>
              <td style={styles.td}>{inv.invoice_no}</td>
              <td style={styles.td}>{supplier?.name || ""}</td>
              <td style={styles.td}>{Number(inv.total || 0).toFixed(3)}</td>
              <td style={styles.td}>{Number(inv.paid || 0).toFixed(3)}</td>
              <td style={styles.td}>{Number(inv.balance || 0).toFixed(3)}</td>
              <td style={styles.td}>{inv.status}</td>
              <td style={styles.td}>
                <button style={styles.print} onClick={() => printInvoice(inv)}>
                  Print
                </button>

                <button
                  style={styles.print}
                  onClick={() => exportInvoicePDF(inv)}
                >
                  PDF
                </button>
              </td>
            </tr>
          );
        })}
      </Table>

      <Table
        title="Stock Movements"
        headers={["Date", "Product", "Type", "Qty", "Reference", "Notes"]}
      >
        {stockMovements.map((m) => {
          const product = productById(m.product_id);

          return (
            <tr key={m.id}>
              <td style={styles.td}>{formatDate(m.movement_date)}</td>
              <td style={styles.td}>{product?.name || ""}</td>
              <td style={styles.td}>{m.type}</td>
              <td style={styles.td}>{m.qty}</td>
              <td style={styles.td}>{m.reference_type}</td>
              <td style={styles.td}>{m.notes}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

function ReportBox({ title, value }) {
  return (
    <div style={styles.reportBox}>
      <span>{title}</span>
      <b>{value}</b>
    </div>
  );
}

function Table({ title, headers, children }) {
  return (
    <section style={styles.card}>
      <h2>{title}</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th style={styles.th} key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7fb",
    padding: 30,
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  logout: {
    background: "#0f766e",
    color: "#fff",
    border: 0,
    padding: "12px 20px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 15,
  },

  reportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 15,
    marginBottom: 20,
  },

  reportBox: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
    display: "flex",
    justifyContent: "space-between",
  },

  warningCard: {
    background: "#fff7ed",
    color: "#9a3412",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid #fed7aa",
  },

  miniReport: {
    background: "#eef5ff",
    padding: 12,
    borderRadius: 10,
  },

  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 18,
    marginBottom: 22,
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
    overflowX: "auto",
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
  },

  primary: {
    background: "#2563eb",
    color: "#fff",
    border: 0,
    padding: "12px 18px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    padding: 10,
    background: "#f8fafc",
  },

  td: {
    borderBottom: "1px solid #eee",
    padding: 10,
    verticalAlign: "top",
  },

  print: {
    background: "#0f4c81",
    color: "#fff",
    border: 0,
    padding: "8px 12px",
    borderRadius: 8,
    marginRight: 6,
    cursor: "pointer",
  },

  approve: {
    background: "#16a34a",
    color: "#fff",
    border: 0,
    padding: "8px 12px",
    borderRadius: 8,
    marginRight: 6,
    cursor: "pointer",
  },

  reject: {
    background: "#dc2626",
    color: "#fff",
    border: 0,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
};