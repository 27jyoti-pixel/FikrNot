import Brand from "../brand/Brand";

export default function AuthPanel({
  eyebrow = "CAMPUS LOST & FOUND",
  title,
  description,
  children,
}) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Brand className="brand auth-brand" />
        <div className="eyebrow auth-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
