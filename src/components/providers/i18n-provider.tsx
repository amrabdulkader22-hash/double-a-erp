"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = (lng: string) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    };
    apply(i18n.language || "en");
    i18n.on("languageChanged", apply);
    return () => i18n.off("languageChanged", apply);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}