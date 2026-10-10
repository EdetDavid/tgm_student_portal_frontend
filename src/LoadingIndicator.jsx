import { GraduationCap } from "lucide-react";

export default function LoadingIndicator({ label = "Loading" }) {
  return (
    <div className="brand-loader-backdrop">
      <div className="brand-loader" role="status" aria-live="polite" aria-label={label}>
        <span className="brand-loader-mark" aria-hidden="true">
          <GraduationCap size={27} strokeWidth={2} />
        </span>
        <span className="brand-loader-label">{label}</span>
        <span className="brand-loader-dots" aria-hidden="true"><i/><i/><i/></span>
      </div>
    </div>
  );
}
