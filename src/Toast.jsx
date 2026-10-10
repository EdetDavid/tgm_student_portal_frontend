import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, type === "error" ? 6500 : 4200);
    return () => window.clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) return null;
  const Icon = icons[type] || icons.info;
  return <div className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"}>
    <Icon className="toast-icon" size={19} aria-hidden="true" />
    <span className="toast-message">{message}</span>
    <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification"><X size={17}/></button>
  </div>;
}
