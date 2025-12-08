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
      hide: "Ẩn menu",
    },
    auth: {
      promptTitle: "Cần đăng nhập",
      promptDescription: "Bạn cần đăng nhập để truy cập",
      signInCta: "Đăng nhập ngay",
      cancel: "Để sau",
      welcomeBack: "Chào mừng trở lại, Raider",
      resumeRun: "Đăng nhập và tiếp tục hành trình on-chain.",
      email: "Email",
      password: "Mật khẩu",
      showPass: "Hiện mật khẩu",
      hidePass: "Ẩn mật khẩu",
      rememberDevice: "Ghi nhớ thiết bị",
      forgotPass: "Quên mật khẩu?",
      signIn: "Đăng nhập",
      signingIn: "Đang đăng nhập...",
      createAccount: "Tạo tài khoản",
      socialLogin: "Đăng nhập bằng mạng xã hội?",
      continueWith: "Tiếp tục với {provider}",
      newPilot: "Phi công mới?",
      forgeIdentity: "Tạo danh tính mới trong vài giây.",
      preview1: "Nhận hangar NFT khởi đầu và trang phục.",
      preview2: "Liên kết ví an toàn & bảo mật sinh trắc học.",
      preview3: "Lưu trữ đám mây đa thiết bị được hỗ trợ bởi dữ liệu chuỗi.",
      slideToSignUp: "Trượt để đăng ký",
      joinRanks: "Gia nhập hàng ngũ",
      startJourney: "Bắt đầu hành trình xuyên qua các vì sao.",
      fullName: "Họ và tên",
      confirmPassword: "Xác nhận mật khẩu",
      slideToSignIn: "Trượt để đăng nhập",
      alreadyHaveAccount: "Đã có tài khoản?",
      signInHere: "Đăng nhập tại đây.",
      signingUp: "Đang đăng ký...",
      signUp: "Đăng ký",
      verifyEmail: "Xác thực Email",
      verifyDesc: "Chúng tôi đã gửi mã xác thực đến {email}",
      resend: "Gửi lại",
      verify: "Xác thực",
      enterCode: "Nhập mã xác thực",
      backToLogin: "Quay lại đăng nhập",
      codeExpired: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.",
      codeSent: "Mã xác thực đã được gửi đến email của bạn!",
      verifying: "Đang xác thực...",
      resending: "Đang gửi lại...",
      resendSuccess: "Đã gửi lại mã mới!",
      resendError: "Không thể gửi lại mã",
      verifySuccess: "Xác thực thành công!",
      verifyError: "Mã xác thực không đúng",
      close: "Đóng",
      codeExpiresIn: "Mã hết hạn sau: {time}",
      notReceived: "Chưa nhận được mã?",
      resendIn: "Gửi lại sau"
    },
    shop: {
      title: "Cửa hàng",
      subtitle: "Săn vật phẩm giới hạn trên chuỗi.",
      description: "Kết hợp NFT và item in-game để nâng cấp tàu chiến. Mỗi vật phẩm đều có chỉ số thực, có thể giao dịch trực tiếp trên blockchain và mang vào trận chiến ngay lập tức.",
      buyNow: "Mua ngay",
      learnContract: "Tìm hiểu smart contract",
      walletConnected: "Đã kết nối ví! Giao dịch của bạn sẽ được ghi lại trên blockchain với địa chỉ: {address}",
      marketplaceTitle: "Chợ",
      marketplaceDesc: "Mua đồ người chơi khác rao bán.",
      loading: "Đang tải...",
      noListings: "Không có vật phẩm đang bán",
      sellerNoWallet: "Người bán chưa kết nối ví",
      wanted: "Muốn đổi",
      view: "Xem",
      trade: "Trao đổi",
      onChainActivity: "Hoạt động on-chain",
      onChainDesc: "Giao dịch mới nhất từ cộng đồng.",
      player: "Người chơi",
      item: "Vật phẩm",
      time: "Thời gian",
      tx: "Tx",
      itemDetails: "Chi tiết vật phẩm",
      fullHash: "Mã hash đầy đủ (sao chép vào clipboard):",
      close: "Đóng",
      copy: "Sao chép",
      copied: "Đã sao chép!",
      chooseTradeItem: "Chọn vật phẩm để đổi",
      selectOffer: "{item} — chọn một vật phẩm của bạn để đổi.",
      loadingInventory: "Đang tải kho đồ...",
      noEligibleItems: "Không tìm thấy vật phẩm phù hợp trong kho đồ.",
      gasFeeNotice: "Lưu ý phí Gas",
      gasFeeDesc: "Bạn sẽ trả phí gas blockchain cho giao dịch này từ ví MetaMask của bạn. Ước tính: ~0.001-0.003 ETH",
      cancel: "Hủy",
      confirmTrade: "Xác nhận đổi",
      any: "Bất kỳ",
      tier: "Phẩm chất"
    },
    settings: {
      controlCenter: "Trung tâm điều khiển",
      title: "Tuỳ chỉnh trải nghiệm.",
      description: "Đồng bộ ví, cập nhật hồ sơ và chọn thông báo mong muốn. Mọi thay đổi được ký và áp dụng ngay trên backend chuỗi.",
      profile: "Hồ sơ",
      nickname: "Biệt danh",
      notSet: "Chưa đặt tên",
      edit: "Chỉnh sửa",
      password: "Mật khẩu",
      changePassword: "Đổi mật khẩu",
      linkedWallet: "Ví liên kết",
      notConnected: "Chưa kết nối",
      disconnect: "Ngắt kết nối",
      connect: "Kết nối ví",
      details: "Thông tin chi tiết",
      username: "Tên đăng nhập",
      email: "Email",
      role: "Vai trò",
      highScore: "Điểm cao nhất",
      joinedDate: "Ngày tham gia",
      editNameTitle: "Đổi tên hiển thị",
      enterNewName: "Nhập tên mới",
      saveChanges: "Lưu thay đổi",
      saving: "Đang lưu...",
      changePassTitle: "Đổi mật khẩu",
      currentPass: "Mật khẩu hiện tại",
      newPass: "Mật khẩu mới",
      confirmPass: "Xác nhận mật khẩu mới",
      processing: "Đang xử lý...",
      cancel: "Hủy",
      successName: "Cập nhật tên hiển thị thành công",
      successPass: "Đổi mật khẩu thành công",
      errorFillAll: "Vui lòng điền đầy đủ thông tin",
      errorPassMismatch: "Mật khẩu mới không khớp"
    },
    game: {
      statsTitle: "Chỉ số hiện tại",
      score: "Điểm",
      level: "Cấp",
      lives: "Mạng",
      combo: "Số mạng hạ gục hiện tại",
      recentDrops: "Vật phẩm mới",
      noDrops: "Chưa có vật phẩm. Tiêu diệt kẻ thù để nhận!",
      hash: "Mã Hash",
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
    inventory: {
      title: "Kho đồ",
      subtitle: "Chiến lợi phẩm thiên hà",
      description: "Quản lý vật phẩm, đăng bán và theo dõi NFT blockchain của bạn.",
      walletHint: "🎨 Vật phẩm của bạn có thể được mint thành NFT khi đăng bán!",
      totalItems: "Tổng vật phẩm",
      collectedFromDrops: "Thu thập từ trận đấu",
      totalValue: "Tổng giá trị",
      inCollection: "Trong bộ sưu tập",
      rarestItem: "Loại vật phẩm hiếm nhất",
      keepCollecting: "Tiếp tục thu thập!",
      yourItems: "Vật phẩm của bạn",
      noItems: "Chưa có vật phẩm nào!",
      playToCollect: "Chơi Space Raiders để nhận vật phẩm",
      startPlaying: "Chơi ngay",
      refresh: "Làm mới",
      acquired: "Nhận lúc",
      listOnShop: "Đăng bán",
      unlistFromShop: "Gỡ khỏi Shop",
      processing: "Đang xử lý...",
      listing: "Đang đăng...",
      listModalTitle: "Đăng bán vật phẩm",
      listModalDesc: "Chọn vật phẩm bạn muốn đổi lấy (vật phẩm mong muốn).",
      wantedItem: "Vật phẩm mong muốn",
      noWantedItems: "Không có vật phẩm mong muốn nào",
      cancel: "Hủy",
      confirmList: "Xác nhận đăng",
      collectionByRarity: "Bộ sưu tập theo độ hiếm",
      rarity: {
        Legendary: "Huyền thoại",
        Rare: "Hiếm",
        Common: "Thường",
        None: "Chưa có"
      },
      sort: {
        newest: "Mới nhất",
        oldest: "Cũ nhất",
        tierHighLow: "Phẩm chất: Cao → Thấp",
        tierLowHigh: "Phẩm chất: Thấp → Cao"
      }
    },
    leaderboard: {
      title: "Bảng xếp hạng",
      subtitle: "Các phi công đứng đầu chuỗi.",
      description: "Theo dõi realtime điểm Space Raiders. Bảng xếp hạng được cập nhật sau mỗi trận đấu.",
      rank: "Hạng",
      player: "Người chơi",
      score: "Điểm",
      action: "Hành động",
      loading: "Đang tải...",
      noData: "Chưa có điểm cao nào.",
      viewProfile: "Xem hồ sơ",
      yourRank: "Thứ hạng của bạn",
      congrats: "Xin chúc mừng! Bạn đang đứng thứ {rank} trên bảng xếp hạng.",
      notRanked: "Bạn chưa có tên trong Top 50. Hãy chơi ngay để ghi danh!",
      highestScore: "Điểm cao nhất",
      playNow: "Chơi ngay"
    }
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
      hide: "Hide menu",
    },
    auth: {
      promptTitle: "Sign in required",
      promptDescription: "You need to sign in to view",
      signInCta: "Go to sign in",
      cancel: "Maybe later",
      welcomeBack: "Welcome back, Raider",
      resumeRun: "Plug in and resume your on-chain run.",
      email: "Email",
      password: "Password",
      showPass: "Show password",
      hidePass: "Hide password",
      rememberDevice: "Remember device",
      forgotPass: "Forgot password?",
      signIn: "Sign in",
      signingIn: "Signing in...",
      createAccount: "Create account",
      socialLogin: "Prefer social login?",
      continueWith: "Continue with {provider}",
      newPilot: "New pilot?",
      forgeIdentity: "Forge a new identity in seconds.",
      preview1: "Receive a starter NFT hangar and cosmetics.",
      preview2: "Secure wallet linkage & biometric prompts.",
      preview3: "Cross-device cloud saves backed by chain data.",
      slideToSignUp: "Slide to sign up",
      joinRanks: "Join the ranks",
      startJourney: "Start your journey across the stars.",
      fullName: "Full Name",
      confirmPassword: "Confirm Password",
      slideToSignIn: "Slide to sign in",
      alreadyHaveAccount: "Already have an account?",
      signInHere: "Sign in here.",
      signingUp: "Signing up...",
      signUp: "Sign up",
      verifyEmail: "Verify Email",
      verifyDesc: "We sent a verification code to {email}",
      resend: "Resend",
      verify: "Verify",
      enterCode: "Enter verification code",
      backToLogin: "Back to Login",
      codeExpired: "Verification code has expired. Please request a new code.",
      codeSent: "Verification code sent to your email!",
      verifying: "Verifying...",
      resending: "Resending...",
      resendSuccess: "New code sent!",
      resendError: "Failed to resend code",
      verifySuccess: "Verification successful!",
      verifyError: "Invalid verification code",
      close: "Close",
      codeExpiresIn: "Code expires in {time}",
      notReceived: "Didn't receive the code?",
      resendIn: "Resend in"
    },
    shop: {
      title: "Marketplace",
      subtitle: "Hunt limited items on-chain.",
      description: "Combine NFTs and in-game items to upgrade your ship. Each item has real stats, can be traded directly on blockchain and used in battle immediately.",
      buyNow: "Buy Now",
      learnContract: "Learn Smart Contract",
      walletConnected: "Wallet connected! Your trades will be recorded on blockchain with address: {address}",
      marketplaceTitle: "Marketplace",
      marketplaceDesc: "Buy items listed by other players.",
      loading: "Loading...",
      noListings: "No active listings",
      sellerNoWallet: "Seller wallet not connected",
      wanted: "Wanted",
      view: "View",
      trade: "Trade",
      onChainActivity: "On-chain Activity",
      onChainDesc: "Latest community transactions.",
      player: "Player",
      item: "Item",
      time: "Time",
      tx: "Tx",
      itemDetails: "Item details",
      fullHash: "Full item hash (copy to clipboard):",
      close: "Close",
      copy: "Copy",
      copied: "Copied!",
      chooseTradeItem: "Choose an item to trade",
      selectOffer: "{item} — select one of your items to offer in exchange.",
      loadingInventory: "Loading your inventory...",
      noEligibleItems: "No eligible items found in your inventory.",
      gasFeeNotice: "Gas Fee Notice",
      gasFeeDesc: "You will pay the blockchain gas fee for this transaction from your MetaMask wallet. Estimated: ~0.001-0.003 ETH",
      cancel: "Cancel",
      confirmTrade: "Confirm trade",
      any: "Any",
      tier: "Tier"
    },
    settings: {
      controlCenter: "Control Center",
      title: "Customize your experience.",
      description: "Sync wallet, update profile and choose notifications. All changes are signed and applied immediately on chain backend.",
      profile: "Profile",
      nickname: "Nickname",
      notSet: "Not set",
      edit: "Edit",
      password: "Password",
      changePassword: "Change password",
      linkedWallet: "Linked Wallet",
      notConnected: "Not connected",
      disconnect: "Disconnect",
      connect: "Connect Wallet",
      details: "Details",
      username: "Username",
      email: "Email",
      role: "Role",
      highScore: "High Score",
      joinedDate: "Joined Date",
      editNameTitle: "Change Display Name",
      enterNewName: "Enter new name",
      saveChanges: "Save Changes",
      saving: "Saving...",
      changePassTitle: "Change Password",
      currentPass: "Current Password",
      newPass: "New Password",
      confirmPass: "Confirm New Password",
      processing: "Processing...",
      cancel: "Cancel",
      successName: "Display name updated successfully",
      successPass: "Password changed successfully",
      errorFillAll: "Please fill in all fields",
      errorPassMismatch: "New passwords do not match"
    },
    game: {
      statsTitle: "Live Scoreboard",
      score: "Score",
      level: "Level",
      lives: "Lives",
      combo: "Current kills",
      recentDrops: "Recent Drops",
      noDrops: "No drops yet. Destroy enemies to get loot!",
      hash: "Hash",
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
    inventory: {
      title: "Inventory",
      subtitle: "Your Galactic Loot",
      description: "Manage your collected items, list them for trade, and track your blockchain NFTs.",
      walletHint: "🎨 Your items can be minted as NFTs on blockchain when listed for trade!",
      totalItems: "Total Items",
      collectedFromDrops: "Collected from drops",
      totalValue: "Total Value",
      inCollection: "In your collection",
      rarestItem: "Rarest Item",
      keepCollecting: "Keep collecting!",
      yourItems: "Your Items",
      noItems: "No items yet!",
      playToCollect: "Play Space Raiders to collect loot drops",
      startPlaying: "Start Playing",
      refresh: "Refresh",
      acquired: "Acquired",
      listOnShop: "List on Shop",
      unlistFromShop: "Unlist from Shop",
      processing: "Processing...",
      listing: "Listing...",
      listModalTitle: "List item on Shop",
      listModalDesc: "Choose the item you want in exchange (wanted item).",
      wantedItem: "Wanted item",
      noWantedItems: "No wanted items available",
      cancel: "Cancel",
      confirmList: "Confirm List",
      collectionByRarity: "Collection by Rarity",
      rarity: {
        Legendary: "Legendary",
        Rare: "Rare",
        Common: "Common",
        None: "None yet"
      },
      sort: {
        newest: "Newest first",
        oldest: "Oldest first",
        tierHighLow: "Tier: High → Low",
        tierLowHigh: "Tier: Low → High"
      }
    },
    leaderboard: {
      title: "Leaderboards",
      subtitle: "Top Pilots of the Chain",
      description: "Realtime Space Raiders tracking. Leaderboard updates after every match.",
      rank: "Rank",
      player: "Player",
      score: "Score",
      action: "Action",
      loading: "Loading...",
      noData: "No high scores yet.",
      viewProfile: "View Profile",
      yourRank: "Your Rank",
      congrats: "Congratulations! You are ranked {rank} on the leaderboard.",
      notRanked: "You are not in the Top 50 yet. Play now to make your mark!",
      highestScore: "Highest Score",
      playNow: "Play Now"
    }
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
      // translation helper with fallback to English and interpolation support
      t: (path, replacements = {}) => {
        let found = getByPath(dictionaries[lang], path);
        if (found === undefined) {
          // fallback to English if missing in current language
          found = getByPath(dictionaries['en'], path);
        }
        
        let result = found !== undefined ? found : path;
        
        // Perform replacements if result is a string
        if (typeof result === 'string' && replacements) {
          Object.keys(replacements).forEach(key => {
            result = result.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
          });
        }
        
        return result;
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
