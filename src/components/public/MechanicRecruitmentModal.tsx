import { ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MECHANIC_RECRUITMENT_DELAY_MS,
  MECHANIC_RECRUITMENT_DISMISSED_KEY,
  MECHANIC_RECRUITMENT_SESSION_KEY,
  isMechanicRecruitmentEligible,
  isMechanicRecruitmentInCooldown,
} from "../../lib/mechanicRecruitment";
import { navigateTo } from "../../lib/navigation";
import { resolveSiteMode, type SiteMode } from "../../lib/siteMode";
import { useCookieConsent } from "../privacy/CookieConsentContext";

interface MechanicRecruitmentModalProps {
  delayMs?: number;
  hostname?: string;
  pathname?: string;
  siteMode?: SiteMode;
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function safelyReadStorage(type: "localStorage" | "sessionStorage", key: string) {
  try {
    return window[type].getItem(key);
  } catch {
    return null;
  }
}

function safelyWriteStorage(
  type: "localStorage" | "sessionStorage",
  key: string,
  value: string,
) {
  try {
    window[type].setItem(key, value);
  } catch {
    // The modal still works when storage is unavailable or blocked.
  }
}

function MechanicRecruitmentModal({
  delayMs = MECHANIC_RECRUITMENT_DELAY_MS,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
  pathname = typeof window === "undefined" ? "/" : window.location.pathname,
  siteMode = resolveSiteMode(),
}: MechanicRecruitmentModalProps) {
  const { isConsentResolved, isConsentUiVisible } = useCookieConsent();
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isConsentResolved || isConsentUiVisible) return;
    if (!isMechanicRecruitmentEligible(siteMode, pathname, hostname)) return;

    const dismissedValue = safelyReadStorage(
      "localStorage",
      MECHANIC_RECRUITMENT_DISMISSED_KEY,
    );
    const shownThisSession =
      safelyReadStorage("sessionStorage", MECHANIC_RECRUITMENT_SESSION_KEY) ===
      "true";

    if (
      shownThisSession ||
      isMechanicRecruitmentInCooldown(dismissedValue)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      safelyWriteStorage(
        "sessionStorage",
        MECHANIC_RECRUITMENT_SESSION_KEY,
        "true",
      );
      setIsOpen(true);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, hostname, isConsentResolved, isConsentUiVisible, pathname, siteMode]);

  useEffect(() => {
    if (isConsentUiVisible) setIsOpen(false);
  }, [isConsentUiVisible]);

  const dismiss = useCallback(() => {
    safelyWriteStorage(
      "localStorage",
      MECHANIC_RECRUITMENT_DISMISSED_KEY,
      String(Date.now()),
    );
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      closeButtonRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [dismiss, isOpen]);

  if (!isOpen) return null;

  const apply = () => {
    dismiss();
    navigateTo("/mechanic/apply");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 px-4 py-5 backdrop-blur-[2px] sm:items-center sm:p-6 motion-reduce:transition-none">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mechanic-recruitment-title"
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2.5rem)] min-w-0 w-[calc(100vw-2rem)] max-w-3xl overflow-x-hidden overflow-y-auto rounded-[1.75rem] border border-white/40 bg-white p-2 text-left shadow-[0_32px_90px_-24px_rgba(15,23,42,0.6)] sm:w-[calc(100vw-3rem)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="Close mechanic recruitment message"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-600 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="grid min-w-0 md:min-h-[30rem] md:grid-cols-[45fr_55fr]">
          <div className="h-40 min-w-0 overflow-hidden rounded-[1.25rem] bg-slate-100 sm:h-44 md:h-auto">
            <img
              src="/images/mechanic-recruitment.jpg"
              alt="STM Motors mobile mechanic working beside a customer vehicle"
              width="1200"
              height="600"
              loading="eager"
              className="block h-full w-full max-w-full object-cover object-[58%_center]"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-7 sm:py-8 md:px-8 md:py-10">
            <p className="pr-12 text-[0.7rem] font-bold uppercase tracking-[.2em] text-[#1c69d4] sm:text-xs">
              Join the STM Motors network
            </p>
            <h2
              id="mechanic-recruitment-title"
              className="mt-3 text-[1.75rem] leading-[1.08] font-bold tracking-tight text-slate-950 sm:text-3xl md:text-[2rem]"
            >
              Mechanics wanted in your area
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
              STM Motors is looking for experienced and qualified mechanics to
              join our growing network. Work locally, choose suitable jobs and
              earn competitive rates.
            </p>
            <div className="mt-6 grid gap-2.5">
            <button
              type="button"
              onClick={apply}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1c69d4] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(28,105,212,0.9)] transition hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-2"
            >
              Apply to join STM Motors <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={dismiss}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-2"
            >
              Maybe later
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MechanicRecruitmentModal;
