"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/** Curated list of commonly useful Font Awesome solid icons */
const SOLID_ICONS = [
  // Communication
  "fa-bullhorn", "fa-bell", "fa-envelope", "fa-comment", "fa-comments", "fa-message",
  "fa-phone", "fa-paper-plane", "fa-inbox", "fa-at",
  // Status / Alerts
  "fa-circle-info", "fa-triangle-exclamation", "fa-circle-check", "fa-circle-xmark",
  "fa-shield-halved", "fa-lock", "fa-unlock", "fa-eye", "fa-eye-slash",
  // Actions
  "fa-rocket", "fa-bolt", "fa-fire", "fa-star", "fa-heart", "fa-thumbs-up",
  "fa-gift", "fa-trophy", "fa-medal", "fa-award", "fa-crown",
  // Business
  "fa-building", "fa-briefcase", "fa-chart-line", "fa-chart-pie", "fa-chart-bar",
  "fa-credit-card", "fa-money-bill-wave", "fa-coins", "fa-piggy-bank",
  "fa-receipt", "fa-file-invoice-dollar", "fa-wallet", "fa-hand-holding-dollar",
  // Commerce / Shopping
  "fa-cart-shopping", "fa-bag-shopping", "fa-store", "fa-shop", "fa-basket-shopping",
  "fa-box", "fa-boxes-stacked", "fa-truck", "fa-barcode",
  // Tech / Web
  "fa-code", "fa-bug", "fa-wrench", "fa-screwdriver-wrench", "fa-gear", "fa-gears",
  "fa-server", "fa-database", "fa-cloud", "fa-wifi", "fa-microchip",
  "fa-laptop", "fa-desktop", "fa-mobile-screen", "fa-tablet-screen-button",
  // Web Design
  "fa-paintbrush", "fa-pen-ruler", "fa-swatchbook", "fa-object-group",
  "fa-layer-group", "fa-sitemap", "fa-table-columns", "fa-window-maximize",
  "fa-display", "fa-file-code",
  // People
  "fa-user", "fa-users", "fa-user-plus", "fa-user-check", "fa-people-group",
  "fa-handshake", "fa-hands-clapping", "fa-user-tie", "fa-person",
  // Media
  "fa-image", "fa-camera", "fa-video", "fa-music", "fa-palette",
  "fa-film", "fa-photo-film", "fa-play", "fa-headphones",
  // Content / Blog
  "fa-newspaper", "fa-blog", "fa-pen-to-square", "fa-file-lines",
  "fa-quote-left", "fa-rss", "fa-scroll",
  // Navigation
  "fa-house", "fa-map-pin", "fa-globe", "fa-plane", "fa-car",
  "fa-location-dot", "fa-compass", "fa-map",
  // Calendar / Time
  "fa-calendar", "fa-clock", "fa-hourglass-half", "fa-stopwatch",
  "fa-calendar-check", "fa-calendar-days",
  // Objects
  "fa-book", "fa-graduation-cap", "fa-lightbulb", "fa-magnifying-glass",
  "fa-tag", "fa-tags", "fa-bookmark", "fa-flag", "fa-puzzle-piece",
  "fa-key", "fa-dice", "fa-flask", "fa-microscope",
  // Files / Docs
  "fa-file", "fa-folder", "fa-folder-open", "fa-file-pdf", "fa-file-image",
  "fa-clipboard", "fa-clipboard-list", "fa-list-check",
  // Nature
  "fa-sun", "fa-moon", "fa-leaf", "fa-seedling", "fa-tree",
  // Social / Marketing
  "fa-share-nodes", "fa-thumbs-up", "fa-hand-pointer", "fa-bullseye",
  "fa-chart-simple", "fa-filter", "fa-ranking-star",
  // Misc
  "fa-wand-magic-sparkles", "fa-sparkles", "fa-hand-sparkles",
  "fa-circle-exclamation", "fa-info", "fa-question",
  "fa-check", "fa-xmark", "fa-plus", "fa-minus",
  "fa-arrow-up", "fa-arrow-right", "fa-arrow-down", "fa-arrow-left",
  "fa-link", "fa-paperclip", "fa-download", "fa-upload",
  "fa-sliders", "fa-toggle-on", "fa-circle", "fa-square",
];

/** Free Font Awesome brand icons */
const BRAND_ICONS = [
  // Social Media
  "fa-facebook", "fa-facebook-f", "fa-instagram", "fa-x-twitter", "fa-twitter",
  "fa-linkedin", "fa-linkedin-in", "fa-tiktok", "fa-youtube", "fa-pinterest",
  "fa-pinterest-p", "fa-threads", "fa-snapchat", "fa-reddit", "fa-reddit-alien",
  "fa-tumblr", "fa-mastodon", "fa-bluesky",
  // Messaging
  "fa-whatsapp", "fa-telegram", "fa-discord", "fa-slack", "fa-skype",
  "fa-facebook-messenger", "fa-viber", "fa-signal-messenger",
  // Streaming / Gaming
  "fa-twitch", "fa-youtube", "fa-spotify", "fa-soundcloud", "fa-bandcamp",
  "fa-steam", "fa-xbox", "fa-playstation", "fa-itch-io",
  // Dev / Tech
  "fa-github", "fa-gitlab", "fa-bitbucket", "fa-stack-overflow",
  "fa-dev", "fa-npm", "fa-node-js", "fa-js", "fa-python", "fa-php",
  "fa-java", "fa-rust", "fa-golang", "fa-swift", "fa-react", "fa-vuejs",
  "fa-angular", "fa-sass", "fa-less", "fa-html5", "fa-css3-alt",
  "fa-docker", "fa-linux", "fa-ubuntu", "fa-windows", "fa-apple",
  "fa-android", "fa-git-alt", "fa-markdown",
  // Design
  "fa-figma", "fa-dribbble", "fa-behance", "fa-sketch", "fa-invision",
  "fa-adobe", "fa-wordpress", "fa-squarespace", "fa-wix", "fa-shopify",
  // Cloud / Services
  "fa-aws", "fa-google", "fa-microsoft", "fa-digital-ocean", "fa-cloudflare",
  "fa-stripe", "fa-paypal", "fa-bitcoin", "fa-ethereum", "fa-cc-visa",
  "fa-cc-mastercard", "fa-cc-amex", "fa-cc-apple-pay", "fa-google-pay",
  // Media / Content
  "fa-medium", "fa-blogger", "fa-vimeo-v", "fa-dailymotion", "fa-unsplash",
  "fa-flickr", "fa-pexels",
  // Business
  "fa-google-drive", "fa-dropbox", "fa-trello", "fa-jira", "fa-confluence",
  "fa-hubspot", "fa-mailchimp", "fa-intercom",
  // Other
  "fa-chrome", "fa-firefox-browser", "fa-safari", "fa-edge", "fa-opera",
  "fa-app-store", "fa-google-play", "fa-product-hunt", "fa-kickstarter",
  "fa-patreon", "fa-etsy", "fa-amazon", "fa-ebay", "fa-airbnb",
  "fa-uber", "fa-lyft", "fa-yelp", "fa-tripadvisor",
];

type IconTab = "solid" | "brands";

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<IconTab>(() => {
    // Default to brands tab if current value is a brand icon
    if (value && value.includes("fa-brands")) return "brands";
    return "solid";
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position the dropdown relative to the button using a portal
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    const dropdownHeight = 380;

    let top = rect.bottom + 8;
    let left = rect.left;

    // Keep within viewport horizontally
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    if (left < 8) left = 8;

    // If it would overflow bottom, show above the button
    if (top + dropdownHeight > window.innerHeight - 8) {
      top = rect.top - dropdownHeight - 8;
    }

    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    function handleScroll() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const icons = tab === "brands" ? BRAND_ICONS : SOLID_ICONS;
  const prefix = tab === "brands" ? "fa-brands" : "fa-solid";

  const filtered = useMemo(() => {
    if (!search) return icons;
    const q = search.toLowerCase().replace("fa-", "").replace("fa-brands ", "").replace("fa-solid ", "");
    return icons.filter((icon) => icon.replace("fa-", "").includes(q));
  }, [search, icons]);

  // Determine the display class for the button preview
  const displayClass = useMemo(() => {
    if (!value) return "fa-solid fa-bullhorn";
    if (value.startsWith("fa-brands") || value.startsWith("fa-solid") || value.startsWith("fa-regular")) {
      return value;
    }
    return `fa-solid ${value}`;
  }, [value]);

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed w-80 bg-surface-container rounded-2xl border border-outline-variant/15 shadow-2xl shadow-black/30 z-[9999] p-3"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-surface-container-highest/40 rounded-xl p-1">
        <button
          type="button"
          onClick={() => { setTab("solid"); setSearch(""); }}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${tab === "solid" ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          <i className="fa-solid fa-shapes mr-1.5 text-[10px]" />Solid
        </button>
        <button
          type="button"
          onClick={() => { setTab("brands"); setSearch(""); }}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${tab === "brands" ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          <i className="fa-brands fa-font-awesome mr-1.5 text-[10px]" />Brands
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/40" />
        <input
          type="text"
          placeholder={tab === "brands" ? "Search brands..." : "Search icons..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm bg-surface-container-lowest rounded-lg text-on-surface placeholder:text-on-surface-variant/40 border-0 focus:ring-1 focus:ring-primary/40 outline-none"
          autoFocus
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {filtered.map((icon) => {
          const fullClass = `${prefix} ${icon}`;
          const isSelected = value === fullClass || value === icon;
          return (
            <button
              key={icon}
              type="button"
              onClick={() => {
                onChange(fullClass);
                setOpen(false);
                setSearch("");
              }}
              title={icon.replace("fa-", "")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                isSelected
                  ? "bg-primary text-on-primary"
                  : "hover:bg-primary/10 text-on-surface-variant hover:text-primary"
              }`}
            >
              <i className={`${prefix} ${icon} text-sm`} />
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-on-surface-variant/60 text-center py-4">No icons found</p>
      )}

      {/* Custom input */}
      <div className="mt-3 pt-3 border-t border-outline-variant/10">
        <label className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest shrink-0">Custom:</span>
          <input
            type="text"
            placeholder="fa-brands fa-custom"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2 py-1 text-xs bg-surface-container-lowest rounded-lg text-on-surface border-0 focus:ring-1 focus:ring-primary/40 outline-none"
          />
        </label>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest rounded-xl border-0 text-on-surface hover:ring-1 hover:ring-primary/40 transition-all"
      >
        <i className={`${displayClass} text-primary text-base`} />
        <i className="fa-solid fa-chevron-down text-[8px] text-on-surface-variant/40 ml-0.5" />
      </button>

      {dropdown}
    </div>
  );
}
