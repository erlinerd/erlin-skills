/* Warm Terminal — full page skeleton (React + client component).
   Class names pair 1:1 with references/tokens.css.
   Default copy = the personOS reference site's copy, with the brand swapped to placeholder acmeOS. Rebrand by replacing every acmeOS/ACMEOS string — most of them (navWhy, wordmark, aria-label, footer ©) carry no // SLOT mark, so search, don't rely on the marks.
   Requirements: html { scroll-behavior: smooth }, Space Grotesk + JetBrains Mono loaded. */

'use client'

import { useEffect, useState } from 'react'

type Locale = 'en' | 'zh'

// ===== Content slots — replace brand/copy here, keep the shape intact =====
const copy = {
  en: {
    docLang: 'en',
    locale: '中文',
    navHow: 'How it works',
    navWhy: 'Why acmeOS',
    navWorkspace: 'Open workspace',
    eyebrow: 'PERSONAL CONTENT OPERATING SYSTEM', // SLOT: category eyebrow
    title: 'From a source to something worth publishing.', // SLOT: ≤ 11ch per line break target
    intro: 'Bring together the links, ideas, and voice that make your work yours.',
    primary: 'Open the workspace',
    secondary: 'See the workflow',
    proof: 'For indie makers, solo creators, and people building in public.',
    demoEyebrow: 'SOURCE  →  VOICE  →  DRAFT',
    demoAction: 'Play sample',
    demoReplay: 'Replay sample',
    demoReady: 'Watch one source become a publishable draft.',
    demoSourceStatus: 'Source captured.',
    demoVoiceStatus: 'Voice preset applied.',
    demoResultStatus: 'Sample draft ready — no account needed.',
    sourceLabel: 'SOURCE NOTE',
    sourceTitle: 'The product is ready for its first public release.',
    sourceMeta: 'product update · 3 min read',
    voiceLabel: 'VOICE PRESET',
    voiceName: 'Clear, useful, a little human',
    resultLabel: 'PUBLISHABLE DRAFT · V3',
    resultTitle: 'A launch note that sounds like you.',
    resultBody: 'The first version is rarely the one you publish.',
    resultVersion: 'v3',
    howEyebrow: 'A SMALLER LOOP',
    howTitle: 'The work stays in one place.',
    howIntro: 'Context stays attached to the output.',
    steps: [
      { n: '01', title: 'Bring the signal', body: 'Paste a link, capture a thought, or pick a live topic.' },
      { n: '02', title: 'Shape the voice', body: 'Choose a channel and a voice preset.' },
      { n: '03', title: 'Keep the thread', body: 'Edit, regenerate, compare, and export.' },
    ],
    whyEyebrow: 'WHY ACMEOS',
    whyTitle: 'A content workspace with memory.',
    whyBody: 'Built for the work around the answer.',
    stampLetter: 'a', // SLOT: single lowercase brand letter (big circle)
    stampCaption: ['KEEP', 'THE', 'THREAD'], // SLOT: 3 stacked mono words
    tags: ['Sources stay attached', 'Your voice stays reusable', 'Every draft stays recoverable'],
    ctaEyebrow: 'ACMEOS / 01', // SLOT: "BRAND / NN" pattern
    ctaTitle: 'Start with the thing you already want to say.',
    ctaBody: 'Open the workspace and turn one source into a first draft.',
    footer: 'A focused workspace for making the next thing clear.',
    footerTag: '中文界面',
  },
  zh: {
    docLang: 'zh-CN',
    locale: 'EN',
    navHow: '怎么工作',
    navWhy: '为什么是 acmeOS',
    navWorkspace: '打开工作台',
    eyebrow: '个人内容操作系统',
    title: '从一条素材，到值得发布的内容。',
    intro: '把链接、想法和属于你的表达方式放在一起。',
    primary: '打开工作台',
    secondary: '看看怎么工作',
    proof: '为独立创作者、独立开发者和持续公开创作的人准备。',
    demoEyebrow: '素材  →  口吻  →  成稿',
    demoAction: '播放示例',
    demoReplay: '重新播放',
    demoReady: '看一条素材如何变成可发布的成稿。',
    demoSourceStatus: '素材已带入。',
    demoVoiceStatus: '口吻预设已应用。',
    demoResultStatus: '示例成稿已准备好，不需要注册。',
    sourceLabel: '素材摘要',
    sourceTitle: '产品已经准备好第一次公开发布。',
    sourceMeta: '产品更新 · 阅读 3 分钟',
    voiceLabel: '口吻预设',
    voiceName: '清楚、有用，保留一点人味',
    resultLabel: '可发布成稿 · V3',
    resultTitle: '一条听起来像你写的发布文案。',
    resultBody: '第一版通常不是最终版。',
    resultVersion: 'v3',
    howEyebrow: '更短的工作回路',
    howTitle: '让创作留在一个地方。',
    howIntro: '把有用的上下文和产出放在一起。',
    steps: [
      { n: '01', title: '带入信号', body: '粘贴链接、记录想法，或挑一条正在发生的热点。' },
      { n: '02', title: '确定口吻', body: '选择渠道和人设，默认值替你完成大部分配置。' },
      { n: '03', title: '保留过程', body: '编辑、重生成、对比和导出，不丢掉好想法。' },
    ],
    whyEyebrow: '为什么是 ACMEOS',
    whyTitle: '一个记得住上下文的内容工作区。',
    whyBody: '关心回答周围的工作，而不只是下一次回答。',
    stampLetter: 'a',
    stampCaption: ['KEEP', 'THE', 'THREAD'],
    tags: ['素材始终可追溯', '口吻可以反复使用', '每一版都可以找回'],
    ctaEyebrow: 'ACMEOS / 01',
    ctaTitle: '从你已经想表达的那件事开始。',
    ctaBody: '打开工作台，把一条素材变成第一版成稿。',
    footer: '为下一件清楚的事准备的专注工作区。',
    footerTag: '中文界面',
  },
} as const

const WORKSPACE_HREF = '/workspace' // SLOT: primary CTA destination

export function DccLanding() {
  const [locale, setLocale] = useState<Locale>('en')
  // Demo state machine: 0 idle → 1 source → 2 voice → 3 result → wrap to 0.
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0)
  const t = copy[locale]

  useEffect(() => {
    // SLOT: analytics — page view
  }, [])

  const advanceDemo = () => {
    const next = stage === 3 ? 0 : ((stage + 1) as 1 | 2 | 3)
    // SLOT: analytics — demo_started when leaving 0, demo_completed at 3
    setStage(next)
  }

  // Contextual CTA: deep-link once the visitor finished the demo
  const workspaceHref = stage === 3 ? `${WORKSPACE_HREF}?demo=1` : WORKSPACE_HREF
  const demoStatus =
    stage === 0
      ? t.demoReady
      : stage === 1
        ? t.demoSourceStatus
        : stage === 2
          ? t.demoVoiceStatus
          : t.demoResultStatus

  return (
    <main className="dcc" lang={t.docLang}>
      <header className="dcc-container">
        <nav className="dcc-nav" aria-label="Primary navigation">
          <a className="dcc-wordmark" href="/" aria-label="acmeOS home">
            <span className="dcc-mark" aria-hidden>
              a
            </span>
            <span className="dcc-wordmark-text">
              <strong>acmeOS</strong>
              <small>content workspace</small>
            </span>
          </a>
          <div className="dcc-links">
            <a href="#how">{t.navHow}</a>
            <a href="#why">{t.navWhy}</a>
            <button
              type="button"
              className="dcc-locale"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              aria-label={`Switch language to ${t.locale}`}
            >
              {t.locale}
            </button>
            <a className="dcc-nav-cta" href={workspaceHref}>
              {t.navWorkspace}
            </a>
          </div>
        </nav>
      </header>

      {/* Hero: copy left, interactive demo panel right */}
      <section className="dcc-container">
        <div className="dcc-hero">
          <div className="dcc-hero-copy">
            <p className="dcc-eyebrow">{t.eyebrow}</p>
            <h1 className="dcc-h1">{t.title}</h1>
            <p className="dcc-intro">{t.intro}</p>
            <div className="dcc-actions">
              <a className="dcc-btn-primary" href={workspaceHref}>
                {t.primary}
                <span aria-hidden>↗</span>
              </a>
              <a className="dcc-btn-secondary" href="#how">
                {t.secondary}
                <span aria-hidden>↓</span>
              </a>
            </div>
            <p className="dcc-proof">{t.proof}</p>
          </div>

          <div className="dcc-demo" data-stage={stage} aria-label="Product workflow preview">
            <div className="dcc-demo-topline">
              <span>{t.demoEyebrow}</span>
              <div className="dcc-demo-controls">
                <span className="dcc-demo-status" aria-live="polite">
                  {demoStatus}
                </span>
                <button
                  type="button"
                  className="dcc-demo-replay"
                  onClick={advanceDemo}
                  aria-label={stage === 0 ? 'Play sample workflow' : 'Replay sample workflow'}
                >
                  {stage === 0 ? t.demoAction : t.demoReplay}
                  <span aria-hidden>↻</span>
                </button>
                <span className="dcc-dot" aria-hidden />
              </div>
            </div>
            <div className="dcc-demo-grid">
              <article className="dcc-demo-card" data-active={stage === 1}>
                <p className="dcc-card-label">{t.sourceLabel}</p>
                <h2 className="dcc-card-title">{t.sourceTitle}</h2>
                <p className="dcc-card-meta">{t.sourceMeta}</p>
                <span className="dcc-card-arrow" aria-hidden>
                  ↗
                </span>
              </article>
              <div className="dcc-connector" data-active={stage === 2} aria-hidden>
                <span>+</span>
              </div>
              <article className="dcc-demo-card" data-active={stage === 2}>
                <p className="dcc-card-label">{t.voiceLabel}</p>
                <p className="dcc-voice-name">{t.voiceName}</p>
                <div className="dcc-voice-lines" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            </div>
            <article className="dcc-demo-result" data-active={stage === 3}>
              <div>
                <p className="dcc-card-label">{t.resultLabel}</p>
                <h2 className="dcc-card-title">{t.resultTitle}</h2>
                <p className="dcc-card-meta">{t.resultBody}</p>
              </div>
              <span className="dcc-chip">{t.resultVersion}</span>
            </article>
          </div>
        </div>
      </section>

      {/* How: small intro + 3 numbered steps */}
      <section className="dcc-container" id="how" aria-labelledby="how-title">
        <div className="dcc-section dcc-how">
          <div className="dcc-section-intro">
            <p className="dcc-eyebrow">{t.howEyebrow}</p>
            <h2 className="dcc-h2" id="how-title">
              {t.howTitle}
            </h2>
            <p className="dcc-section-body">{t.howIntro}</p>
          </div>
          <ol className="dcc-steps">
            {t.steps.map((step) => (
              <li key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why: circular stamp + statement + ↳ tag list */}
      <section className="dcc-container" id="why" aria-labelledby="why-title">
        <div className="dcc-section dcc-why">
          <div className="dcc-stamp" aria-hidden>
            <span className="dcc-stamp-circle">{t.stampLetter}</span>
            <small className="dcc-stamp-caption">
              {t.stampCaption.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </small>
          </div>
          <div className="dcc-why-copy">
            <p className="dcc-eyebrow">{t.whyEyebrow}</p>
            <h2 className="dcc-h2" id="why-title">
              {t.whyTitle}
            </h2>
            <p className="dcc-section-body">{t.whyBody}</p>
            <ul className="dcc-taglist">
              {t.tags.map((tag) => (
                <li key={tag}>
                  <span aria-hidden>↳</span>
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA: the page's single full-color band */}
      <section className="dcc-container">
        <div className="dcc-cta">
          <div>
            <p className="dcc-eyebrow">{t.ctaEyebrow}</p>
            <h2 className="dcc-h2">{t.ctaTitle}</h2>
            <p className="dcc-section-body">{t.ctaBody}</p>
          </div>
          <a className="dcc-btn-dark" href={workspaceHref}>
            {t.primary}
            <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      <footer className="dcc-container">
        <div className="dcc-footer">
          <p>© 2026 acmeOS. {t.footer}</p>
          <div className="dcc-footer-links">
            <span>{t.footerTag}</span>
            <a href={workspaceHref}>{t.navWorkspace}</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
