import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "app.language";

const dictionaries = {
  vi: {
    brand: {
      tagline: "Chuỗi game đa vũ trụ",
    },
    nav: {
      home: { label: "Trang chủ", hint: "Khởi động Space Raiders" },
      shop: { label: "Cửa hàng", hint: "Drop NFT & vật phẩm" },
      inventory: { label: "Kho đồ", hint: "Skin & booster" },
      leaderboards: { label: "Bảng xếp hạng", hint: "Top phi công" },
      settings: { label: "Cài đặt", hint: "Hồ sơ & ưu tiên" },
    },
    menu: {
      locked: "Đăng nhập để mở Shop, Kho đồ và Cài đặt.",
      signIn: "Đăng nhập",
      signUp: "Tạo tài khoản",
      signOut: "Đăng xuất",
      backHome: "Về Home",
      guest: "Chưa đăng nhập",
      signedInAs: "Đang đăng nhập",
      language: "Đổi ngôn ngữ",
      theme: "Đổi chế độ",
    },
    auth: {
      promptTitle: "Cần đăng nhập",
      promptDescription: "Bạn cần đăng nhập để truy cập",
      signInCta: "Đăng nhập ngay",
      cancel: "Để sau",
    },
    game: {
      statsTitle: "Chỉ số hiện tại",
      score: "Điểm",
      level: "Cấp",
      lives: "Mạng",
      combo: "Chuỗi hạ gục",
      overlayTitle: "Mẹo & Điều khiển",
      overlayHide: "Ẩn",
      overlayShow: "Hiện",
      overlayShowHint: "Nhấn T để hiện/ẩn",
      controls: {
        move: "Di chuyển: ← / → hoặc A / D",
        shoot: "Bắn: Space (đồng thời bắt đầu)",
        pause: "Tạm dừng / Tiếp tục: P",
        defense: "Địch bắn trả — ẩn sau tường chắn",
      },
      missionsTitle: "Nhiệm vụ trong trận",
      missions: [
        { label: "Giữ combo trên 3x", reward: "+120 XP" },
        { label: "Không mất mạng ở cấp hiện tại", reward: "+80 XP" },
        { label: "Phá 10 invader trong 30s", reward: "+60 XP" },
      ],
      boostsTitle: "Hỗ trợ nhanh",
      boosts: [
        { label: "Khiên lượng tử", status: "Sẵn sàng" },
        { label: "Drone do thám", status: "Đang nạp" },
      ],
    },
  },
  en: {
    brand: {
      tagline: "Multiverse gaming network",
    },
    nav: {
      home: { label: "Home", hint: "Launch Space Raiders" },
      shop: { label: "Shop", hint: "NFT drops & items" },
      inventory: { label: "Inventory", hint: "Skins & boosters" },
      leaderboards: { label: "Leaderboards", hint: "Top pilots" },
      settings: { label: "Settings", hint: "Profile & preferences" },
    },
    menu: {
      locked: "Sign in to unlock Shop, Inventory and Settings.",
      signIn: "Sign in",
      signUp: "Create account",
      signOut: "Sign out",
      backHome: "Back Home",
      guest: "Not signed in",
      signedInAs: "Signed in as",
      language: "Toggle language",
      theme: "Toggle theme",
    },
    auth: {
      promptTitle: "Sign in required",
      promptDescription: "You need to sign in to view",
      signInCta: "Go to sign in",
      cancel: "Maybe later",
    },
    game: {
      statsTitle: "Live Scoreboard",
      score: "Score",
      level: "Level",
      lives: "Lives",
      combo: "Combo streak",
      overlayTitle: "Tips & Controls",
      overlayHide: "Hide",
      overlayShow: "Show",
      overlayShowHint: "Press T to show/hide",
      controls: {
        move: "Move: ← / → or A / D",
        shoot: "Shoot: Space (also starts)",
        pause: "Pause / Resume: P",
        defense: "Enemies shoot back — use blockades",
      },
      missionsTitle: "In-match missions",
      missions: [
        { label: "Keep combo above 3x", reward: "+120 XP" },
        { label: "No deaths this level", reward: "+80 XP" },
        { label: "Clear 10 invaders in 30s", reward: "+60 XP" },
      ],
      boostsTitle: "Quick assists",
      boosts: [
        { label: "Quantum shield", status: "Ready" },
        { label: "Recon drone", status: "Charging" },
      ],
    },
  },
};

const LanguageContext = createContext(null);

function readInitialLanguage() {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && dictionaries[stored]) return stored;
  const prefersEn = window.navigator.language?.startsWith("en");
  return prefersEn ? "en" : "vi";
}

function getByPath(source, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLanguage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const availableLanguages = useMemo(() => [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' }
  ], []);

  const value = useMemo(
    () => ({
      lang,
      // safe setter (only valid codes)
      setLanguage: (code) => { if (dictionaries[code]) setLang(code); },
      toggleLanguage: () => setLang((prev) => (prev === "vi" ? "en" : "vi")),
      // translation helper with fallback to English
      t: (path) => {
        const found = getByPath(dictionaries[lang], path);
        if (found !== undefined) return found;
        // fallback to English if missing in current language
        const fallback = getByPath(dictionaries['en'], path);
        return fallback !== undefined ? fallback : path;
      },
      dictionary: dictionaries[lang],
      availableLanguages,
      getAvailableLanguages: () => availableLanguages,
    }),
    [lang, availableLanguages]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
