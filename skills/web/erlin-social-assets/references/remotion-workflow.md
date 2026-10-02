# Remotion 宣传视频工作流

> 动画写法遵循本文件的 `interpolate` / `Easing.bezier` / 内联 style 约束；如环境中另有 Remotion 规范技能，可叠加读取，但本流程不依赖仓库外技能。

## 脚手架

空目录 / 无工程时：

```bash
npx create-video@latest --yes --blank --no-tailwind promos
```

## 工程组织（宣传视频惯用）

```text
promos/
├── src/
│   ├── index.ts            # registerRoot()
│   ├── Root.tsx            # 注册 Compositions（竖/横各一）
│   ├── PromoCard.tsx       # 宣传片组件：组装 scenes
│   └── scenes/             # 分场景：opening（logo 入场）/ showcase（截图展示）/ message（卖点文案）/ cta（收尾）
└── package.json
```

## 常用骨架

- **规格**：竖 1080×1920 / 横 1920×1080，fps 30，总长 15-30s。
- **节奏**：0-2s 入场（logo / 标题淡入）→ 中段 2-3 组截图或卖点逐段（每段约 5s：引入 + 停留 + 换场）→ 末尾 2-3s CTA（App 名称回归 / 下载提示）。
- **截图素材**：先裁进设备圆角卡（CSS `border-radius` + `box-shadow`），别裸图堆叠。
- **动画**：`interpolate` + `Easing.bezier`（入场淡入位移、换场交叉淡入）；文字避免 spring 过冲；跑分/打点类元素可逐帧闪烁。
- **字体**：系统字体栈（与品牌"不引入自定义字体"一致）；竖屏大字标题 ≤ 屏宽 16%，副文案 ≤ 8%。

## 导出

```bash
npx remotion render PromoVertical out/promo-vertical.mp4
```

- 默认 H.264 MP4；时长/分辨率以 Composition 配置为准。
- 单帧预览：`npx remotion still PromoVertical out/preview.png --frame 60`（改稿快速预览用）。
