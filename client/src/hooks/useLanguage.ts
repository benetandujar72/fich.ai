import { create } from "zustand";

interface LanguageState {
  language: "ca" | "es";
  setLanguage: (lang: "ca" | "es") => void;
}

export const useLanguage = create<LanguageState>((set) => ({
  language: "ca",
  setLanguage: (lang) => set({ language: lang }),
}));
