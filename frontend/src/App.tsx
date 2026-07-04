import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          ChainView<span>.network</span>
        </Link>
        <span className="tagline">Institutional Portfolio Replication Engine</span>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
