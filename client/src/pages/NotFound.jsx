import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 800 }}>404</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
