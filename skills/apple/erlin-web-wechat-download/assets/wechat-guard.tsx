"use client";

import { useEffect, useState } from "react";

/**
 * 微信内 App Store 链接跳转拦截的引导浮层(通用版,源自 demo clock 官网)。
 * 用法:
 *   1) 在所有 App Store CTA 的 onClick 里:
 *        if (userAgent.includes('MicroMessenger')) { e.preventDefault(); window.dispatchEvent(new Event('erlin:wechat-open')) }
 *   2) 在页面根渲染 <WeChatGuard eventName="erlin:wechat-open" enPathPrefix="/en" />
 *
 * 事件名用命名空间前缀;语言按 pathname 前缀区分(勿为浮层开一组 i18n key)。
 * 品牌 token 占位(---amber / paper / graphite / ink ---):换成站点自己的主题色变量。
 */
export function WeChatGuard({
  eventName = "erlin:wechat-open",
  enPathPrefix = "/en",
}: {
  eventName?: string;
  enPathPrefix?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [isEn, setIsEn] = useState(false);

  useEffect(() => {
    setIsEn(window.location.pathname.startsWith(enPathPrefix));
    const open = () => setVisible(true);
    window.addEventListener(eventName, open);
    return () => window.removeEventListener(eventName, open);
  }, [eventName, enPathPrefix]);

  if (!visible) return null;

  const copy = isEn
    ? {
        title: "Open in Safari",
        body: 'The App Store link cannot open inside WeChat. Tap the "···" menu at the top right and choose "Open in Safari".',
        ok: "Got it",
      }
    : {
        title: "在 Safari 中打开",
        body: "微信内无法跳转 App Store。点击右上角「···」，选择「在 Safari 中打开」。",
        ok: "知道了",
      };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-8"
      style={{ background: "oklch(0 0 0 / 0.78)", backdropFilter: "blur(8px)" }}
      onClick={() => setVisible(false)}
      role="alertdialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{
          borderColor: "oklch(1 0 0 / 0.1)",
          background: "oklch(0.08 0.005 285)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 右上角方位指示:点哪里选 Safari */}
        <div className="flex justify-end">
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            style={{ color: "var(--amber)" }}
            fill="currentColor"
            aria-hidden
          >
            <path
              d="M5 14.5l5-2 6.5-6.5-3-3L7 9.5l-2 5zM4 20l3.5-1.5L5 16 4 20z"
              opacity="0.9"
            />
          </svg>
        </div>
        <h2
          className="mt-3 text-lg font-normal"
          style={{ color: "var(--paper)" }}
        >
          {copy.title}
        </h2>
        <p
          className="mt-3 text-sm font-light leading-relaxed"
          style={{ color: "var(--graphite)" }}
        >
          {copy.body}
        </p>
        <button
          className="mt-6 h-11 w-full rounded-xl text-sm font-medium transition-opacity hover:opacity-85"
          style={{ background: "var(--amber)", color: "var(--ink)" }}
          onClick={() => setVisible(false)}
        >
          {copy.ok}
        </button>
      </div>
    </div>
  );
}
