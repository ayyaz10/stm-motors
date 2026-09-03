import { useEffect, useRef, useState } from "react";

interface RecaptchaRenderParameters {
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  sitekey: string;
  theme?: "light" | "dark";
}

interface GrecaptchaApi {
  ready(callback: () => void): void;
  render(
    container: HTMLElement,
    parameters: RecaptchaRenderParameters,
  ): number;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
    __stmRecaptchaLoader__?: Promise<void>;
  }
}

interface GoogleRecaptchaFieldProps {
  siteKey: string;
  onTokenChange: (token: string) => void;
  resetSignal: number;
}

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.__stmRecaptchaLoader__) {
    return window.__stmRecaptchaLoader__;
  }

  window.__stmRecaptchaLoader__ = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-stm-recaptcha="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google reCAPTCHA.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.stmRecaptcha = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google reCAPTCHA."));

    document.head.appendChild(script);
  });

  return window.__stmRecaptchaLoader__;
}

function GoogleRecaptchaField({
  siteKey,
  onTokenChange,
  resetSignal,
}: GoogleRecaptchaFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!siteKey || !containerRef.current) {
      return () => {
        isMounted = false;
      };
    }

    loadRecaptchaScript()
      .then(() => {
        if (
          !isMounted ||
          !window.grecaptcha ||
          !containerRef.current ||
          widgetIdRef.current !== null
        ) {
          return;
        }

        window.grecaptcha.ready(() => {
          if (
            !isMounted ||
            !window.grecaptcha ||
            !containerRef.current ||
            widgetIdRef.current !== null
          ) {
            return;
          }

          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: "light",
            callback: (token: string) => {
              onTokenChange(token);
              setLoadError("");
            },
            "expired-callback": () => {
              onTokenChange("");
            },
            "error-callback": () => {
              onTokenChange("");
              setLoadError(
                "Spam protection could not load. Refresh the page and try again.",
              );
            },
          });
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        onTokenChange("");
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load Google reCAPTCHA.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (
      resetSignal <= 0 ||
      widgetIdRef.current === null ||
      !window.grecaptcha
    ) {
      return;
    }

    window.grecaptcha.reset(widgetIdRef.current);
    onTokenChange("");
  }, [onTokenChange, resetSignal]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Confirm you are not a robot
        </p>
        <div ref={containerRef} />
      </div>

      {loadError ? (
        <p className="public-field-error" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}

export default GoogleRecaptchaField;
