export default function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">
        <Icon size={18} />
      </span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
