import { createContext, useContext } from "react";
import { defaultCookiePreferences, type CookiePreferences } from "../../lib/cookieConsent";

export interface CookieConsentContextValue {
  preferences: CookiePreferences;
  isConsentResolved: boolean;
  isConsentUiVisible: boolean;
  acceptOptional: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  allowFunctional: () => void;
  openPreferences: () => void;
}

const fallbackContext: CookieConsentContextValue = {
  preferences: defaultCookiePreferences,
  isConsentResolved: true,
  isConsentUiVisible: false,
  acceptOptional: () => undefined,
  rejectOptional: () => undefined,
  savePreferences: () => undefined,
  allowFunctional: () => undefined,
  openPreferences: () => undefined,
};

export const CookieConsentContext = createContext<CookieConsentContextValue>(fallbackContext);

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}
