import { useEffect, useState } from "react";

export interface Platform {
  /** 觸控裝置（iPad / iPhone / Android）*/
  isTouch: boolean;
  /** 螢幕寬度 < 768px */
  isMobile: boolean;
  /** 螢幕寬度介於 768-1024px（平板）*/
  isTablet: boolean;
  /** 螢幕寬度 >= 1024px（桌機）*/
  isDesktop: boolean;
  /** iOS 系列裝置（用於部分 iOS 專屬處理）*/
  isIOS: boolean;
}

function detect(): Platform {
  if (typeof window === "undefined") {
    return {
      isTouch: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
    };
  }

  const ua = navigator.userAgent;
  const isTouch =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia("(pointer: coarse)").matches;
  const w = window.innerWidth;
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;
  const isDesktop = w >= 1024;
  // iPadOS 13+ 的 navigator.userAgent 偽裝成 macOS，要靠 maxTouchPoints 判斷
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && (navigator.maxTouchPoints ?? 0) > 1);

  return { isTouch, isMobile, isTablet, isDesktop, isIOS };
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(detect);

  useEffect(() => {
    const onResize = () => setPlatform(detect());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return platform;
}
