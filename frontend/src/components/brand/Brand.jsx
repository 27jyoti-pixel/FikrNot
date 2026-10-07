import { Link } from "react-router-dom";

export default function Brand({ className = "brand" }) {
  return (
    <Link to="/" className={className} aria-label="FikrNot home">
      <svg
        className="brand-mark"
        viewBox="0 0 36 36"
        role="img"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="34" height="34" rx="10" fill="currentColor" />
        <path
          d="M12 26V10h11.5M12 17h9m-1 9 4.2-4.2a4.1 4.1 0 0 0-5.8-5.8L15 19.4"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.3"
        />
        <circle cx="25.5" cy="10.5" r="1.5" fill="#fbbf24" />
      </svg>
      <span>FikrNot</span>
    </Link>
  );
}
