import type { PropsWithChildren } from "react";
import { useActions, useHaptics, useTranslation } from "superwall/hooks";
import "./theme.css";

export default function Layout({ children }: PropsWithChildren) {
  const { close } = useActions();
  const { t } = useTranslation();
  const haptics = useHaptics();

  return (
    <div className="shell">
      <button
        type="button"
        className="close"
        aria-label={t("paywall.close")}
        onClick={() => {
          haptics.light();
          close();
        }}
      >
        <svg viewBox="0 0 16 16" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4 12 12M12 4 4 12" />
        </svg>
      </button>
      {children}
    </div>
  );
}
