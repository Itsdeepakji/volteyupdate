import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Facebook, Linkedin, Youtube, Instagram } from "lucide-react";

import appStoreSvg   from "@assets/app-store_1781450235986.svg";
import googlePlaySvg from "@assets/google-play_1781450235984.svg";
import applePaySvg   from "@assets/apple-pay_1781450235978.svg";
import googlePaySvg  from "@assets/google-pay_1781450235978.svg";
import visaSvg       from "@assets/visa_1781450235971.svg";
import mastercardSvg from "@assets/mastercard_1781450235969.svg";
import amexSvg       from "@assets/amex_1781450235968.svg";
import discoverSvg   from "@assets/16_1781450235966.svg";
import unionpaySvg   from "@assets/Group_1781450235961.svg";
import jcbSvg        from "@assets/jcb_1781450235957.svg";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type FooterLink   = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };
type SocialLink   = { platform: string; href: string };

type FooterData = {
  copyright: string;
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  appStoreHref?: string;
  googlePlayHref?: string;
  socialHeading?: string;
  legalLinks?: FooterLink[];
};

const DEFAULT: FooterData = {
  copyright: `© ${new Date().getFullYear()} Voltey. All rights reserved.`,
  appStoreHref: "#",
  googlePlayHref: "#",
  socialHeading: "Follow Us",
  columns: [
    { heading: "Popular Destinations", links: [
      { label: "Spain",          href: "/destinations" },
      { label: "Greece",         href: "/destinations" },
      { label: "Italy",          href: "/destinations" },
      { label: "Turkey",         href: "/destinations" },
      { label: "United Kingdom", href: "/destinations" },
      { label: "Portugal",       href: "/destinations" },
      { label: "France",         href: "/destinations" },
      { label: "Germany",        href: "/destinations" },
      { label: "Netherlands",    href: "/destinations" },
      { label: "Canada",         href: "/destinations" },
    ]},
    { heading: "Voltey", links: [
      { label: "Business",                     href: "#" },
      { label: "About Us",                     href: "#" },
      { label: "Careers",                      href: "#" },
      { label: "Refer a Friend",               href: "#" },
      { label: "Become an Affiliate",          href: "#" },
      { label: "eSIM for Travel Partners",     href: "#" },
      { label: "Creators Program",             href: "#" },
      { label: "Student Discount",             href: "#" },
      { label: "Voltey for Nonprofit",         href: "#" },
      { label: "Press Area",                   href: "#" },
      { label: "Football tournament eSIM deal",href: "#" },
    ]},
    { heading: "eSIM", links: [
      { label: "What is an eSIM",       href: "#" },
      { label: "Supported Devices",     href: "#" },
      { label: "Download App",          href: "#" },
      { label: "Security Features",     href: "#" },
      { label: "Data Usage Calculator", href: "#" },
      { label: "Blog",                  href: "#" },
    ]},
    { heading: "Help", links: [
      { label: "Help Center",       href: "#" },
      { label: "Getting Started",   href: "#" },
      { label: "Plans and Payments",href: "#" },
      { label: "Troubleshooting",   href: "#" },
      { label: "FAQ",               href: "#" },
    ]},
  ],
  socialLinks: [
    { platform: "facebook",  href: "#" },
    { platform: "twitter",   href: "#" },
    { platform: "linkedin",  href: "#" },
    { platform: "youtube",   href: "#" },
    { platform: "instagram", href: "#" },
    { platform: "reddit",    href: "#" },
  ],
  legalLinks: [
    { label: "Privacy Policy",    href: "#" },
    { label: "Terms of Service",  href: "#" },
    { label: "Cookie Preference", href: "#" },
  ],
};

function RedditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function XTwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook:  <Facebook size={16} />,
  twitter:   <XTwitterIcon />,
  x:         <XTwitterIcon />,
  linkedin:  <Linkedin size={16} />,
  youtube:   <Youtube size={16} />,
  instagram: <Instagram size={16} />,
  reddit:    <RedditIcon />,
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook:  "Facebook",
  twitter:   "Twitter (now X)",
  x:         "X",
  linkedin:  "LinkedIn",
  youtube:   "YouTube",
  instagram: "Instagram",
  reddit:    "Reddit",
};

export function Footer() {
  const [data, setData] = useState<FooterData>(DEFAULT);

  useEffect(() => {
    fetch(`${BASE}/api/content/footer`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d === "object") setData({ ...DEFAULT, ...d }); })
      .catch(() => {});
  }, []);

  const cols = data.columns ?? DEFAULT.columns;
  const socials = data.socialLinks ?? DEFAULT.socialLinks;
  const legalLinks = data.legalLinks ?? DEFAULT.legalLinks ?? [];
  const socialHeading = data.socialHeading ?? "Follow Us";

  return (
    <footer className="bg-white border-t border-gray-200 pt-10 pb-0">

      {/* ── Top bar: logo + app store buttons ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8">
          <Link href="/">
            <img src="/logo-dark.png" alt="Voltey" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <a href={data.appStoreHref || "#"} className="block">
              <img src={appStoreSvg} alt="Download on the App Store" className="h-[38px] w-auto" />
            </a>
            <a href={data.googlePlayHref || "#"} className="block">
              <img src={googlePlaySvg} alt="Get it on Google Play" className="h-[38px] w-auto" />
            </a>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* ── Link columns grid + social column ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 py-10"
        >
          {/* Dynamic link columns */}
          {cols.map((col, ci) => (
            <div key={ci}>
              <h4 className="text-sm font-bold text-gray-900 mb-5">{col.heading}</h4>
              <ul className="space-y-[10px]">
                {col.links.map((lnk, li) => (
                  <li key={li}>
                    <a href={lnk.href || "#"} className="text-sm font-normal text-gray-700 hover:text-gray-900 transition-colors">
                      {lnk.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social links column */}
          {socials.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-5">{socialHeading}</h4>
              <ul className="space-y-[10px]">
                {socials.map((s, si) => {
                  const key = s.platform.toLowerCase();
                  const icon = SOCIAL_ICONS[key] ?? <span className="w-4 h-4 inline-block" />;
                  const label = SOCIAL_LABELS[key] ?? s.platform;
                  return (
                    <li key={si}>
                      <a href={s.href || "#"} className="flex items-center gap-2 text-sm font-normal text-gray-700 hover:text-gray-900 transition-colors">
                        <span className="text-gray-600 shrink-0">{icon}</span>
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />
      </div>

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
            <span>{data.copyright}</span>
            {legalLinks.map((l, i) => (
              <a key={i} href={l.href || "#"} className="hover:text-gray-800 transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <img src={applePaySvg}   alt="Apple Pay"   className="h-6 w-auto" />
            <img src={googlePaySvg}  alt="Google Pay"  className="h-6 w-auto" />
            <img src={visaSvg}       alt="Visa"        className="h-6 w-auto" />
            <img src={mastercardSvg} alt="Mastercard"  className="h-6 w-auto" />
            <img src={amexSvg}       alt="Amex"        className="h-6 w-auto" />
            <img src={discoverSvg}   alt="Discover"    className="h-6 w-auto" />
            <img src={unionpaySvg}   alt="UnionPay"    className="h-6 w-auto" />
            <img src={jcbSvg}        alt="JCB"         className="h-6 w-auto" />
          </div>
        </div>
      </div>

    </footer>
  );
}
