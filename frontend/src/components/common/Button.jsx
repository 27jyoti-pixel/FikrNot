export default function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  return <button className={`button ${variant} ${className}`} {...props} />;
}
