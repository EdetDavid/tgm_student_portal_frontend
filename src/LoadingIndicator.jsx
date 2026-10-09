import { GraduationCap } from "lucide-react";

export default function LoadingIndicator({ label = "Loading" }) {
  return (
    <div className="brand-loader" role="status" aria-live="polite">
      <span className="brand-loader-mark" aria-hidden="true">
        <GraduationCap size={25} strokeWidth={1.9} />
      </span>
      <span className="brand-loader-label">{label}</span>
    </div>
  );
}
