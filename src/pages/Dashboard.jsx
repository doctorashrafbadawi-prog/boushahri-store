import OrderForm from "./OrderForm";

export default function Dashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome BOUSHAHRI</h2>

      <button onClick={() => (window.location.href = "/")}>
        Logout
      </button>

      <hr />

      <OrderForm />
    </div>
  );
}