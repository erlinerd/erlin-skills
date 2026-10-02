# ASO 生图提示词模板（逐字版）

供 `gen_image.mjs --prompt` 使用的完整提示词。保持英文原文——生图模型对英文提示词遵循度更高。`[PRIMARY BREAKOUT …]`、`[SECONDARY ELEMENTS …]`、`[USER'S REQUESTED CHANGES]` 为占位符，按当张截图实际情况填写。

## 首图提示词模板

首图只传 scaffold（不传风格模板）：

```text
This is a SCAFFOLD for an App Store screenshot — a rough layout showing the correct text, device frame position, and app screenshot placement. Your job is to transform this into a polished, professional App Store marketing screenshot that would make someone tap Download.

KEEP EXACTLY AS-IS:
- The headline text (wording, position, and approximate size)
- The app screenshot shown on the phone screen
- The background colour

ENHANCE AND POLISH:
- Replace the placeholder device frame with a photorealistic iPhone 15 Pro mockup — sleek, modern, with accurate proportions, reflections, and subtle shadows. The phone should look like a real device, not a flat rectangle. Keep the same position and size as the scaffold.
- Refine the overall visual quality to look like a professional, high-budget App Store screenshot
- OPTIONALLY add a PRIMARY breakout element — but ONLY if there is an obvious, visually compelling UI panel on the app screen that directly relates to the benefit headline. If nothing on screen clearly reinforces the headline, skip the breakout entirely — a clean screenshot with no breakout is better than a forced one. When you DO add a breakout, it MUST be an entire UI panel or grouped section (e.g., a complete card with its title and content, a full list section, a complete dialog/sheet) — never individual small elements like a single button, icon, or colour dot. IMPORTANT: The panel must stay at the SAME vertical position and orientation as where it appears on screen — do NOT rotate or angle it. The panel must be SCALED UP significantly — rendered much larger than it appears on the phone screen — so that it extends dramatically beyond BOTH left and right edges of the device frame, clearly overlapping the phone bezel on both sides, expanding to nearly the full width of the screenshot canvas. Do NOT keep the panel at its original on-screen size with just padding added around it. The panel itself must be enlarged. It should appear to float in front of the device at this larger scale — add a soft drop shadow beneath it to create depth and sell the hovering effect. The panel must look like it came from the app — same colours, same style, same content. Do NOT invent new elements.
[PRIMARY BREAKOUT — 若屏幕上有明确相关的面板，具体描述它并要求其带投影冲出设备框两侧；没有就写 "No breakout — the app screen speaks for itself."]
- Optionally add 1-2 secondary elements that reinforce the benefit and message of the screenshot — the kind of enhancements a professional graphic designer would add for impact. These are NOT from the app UI; they are creative additions that help clearly communicate what the screenshot is trying to portray to the user browsing the App Store. They should carry the message and support ASO conversion, but never at the cost of the overall design aesthetic. They must not compete with the primary breakout for attention.
[SECONDARY ELEMENTS — 描述 0-2 个辅助元素，或 "None needed"]
- The background should be a clean, solid brand colour. Do NOT add glows, gradients, radial patterns, or light effects to the background. Keep it flat and bold.
- Ensure the text is crisp, bold, and highly readable

The final result should look like it was designed by a professional App Store screenshot agency — polished, high-converting, and visually striking. No watermarks, no extra text, no app store UI chrome.
```

## 后续图提示词模板

`--input-image` 依次传：本图 scaffold + 风格模板（第一张批准图）：

```text
You are creating the next screenshot in an App Store screenshot SET. It must look like it belongs to the same series as the style reference.

TWO REFERENCE IMAGES:
- FIRST image: The SCAFFOLD — use this as the definitive guide for layout: headline text wording/position, device frame placement, and the app screenshot on screen. This defines WHAT this screenshot shows.
- SECOND image: The STYLE TEMPLATE — this is an already-approved screenshot from the same set. Match its visual style EXACTLY: same device frame rendering (this is critical — the phone must look identical), same text treatment, same background style/accents, same level of polish, same overall aesthetic. This defines HOW this screenshot should look. When in doubt, copy the style template more closely rather than less.

REQUIREMENTS:
- CRITICAL: The device frame MUST match the style template EXACTLY — same photorealistic iPhone rendering, same size, same position, same shadows, same reflections, same edge treatment. Do NOT reinvent or reimagine the device frame. Reproduce it as closely as possible from the style template, only changing the screen contents.
- Match the style template's text rendering style (same font treatment, same crispness, same visual weight)
- Match the style template's background — clean, solid brand colour. No glows, gradients, radial patterns, or light effects.
- Use the scaffold's layout for positioning (text, device, screenshot placement)
- OPTIONALLY add a PRIMARY breakout element — but ONLY if there is an obvious, visually compelling UI panel on the app screen that directly relates to the benefit headline. If nothing clearly reinforces the headline, skip the breakout entirely. When used, it MUST be an entire UI panel or grouped section (NOT individual small elements like a single button or icon). The panel must stay at the SAME vertical position and orientation as on screen — do NOT rotate or angle it. The panel must be SCALED UP significantly — rendered much larger than it appears on the phone screen — so that it extends dramatically beyond BOTH left and right edges of the device frame, clearly overlapping the phone bezel on both sides, expanding to nearly the full width of the screenshot canvas. Do NOT keep the panel at its original on-screen size. The panel itself must be enlarged. It should appear to float in front of the device at this larger scale — add a soft drop shadow beneath it to create depth. The panel MUST come from the app screenshot — same colours, same style, same content. Do NOT invent new elements.
[PRIMARY BREAKOUT — 同首图模板]
- Optionally add 1-2 secondary elements that reinforce the benefit and message of the screenshot. [SECONDARY ELEMENTS — 同首图模板]
- The breakout elements should match the style and energy level of those in the style template

The result must look like it was designed alongside the style template as part of the same professional set. When placed side-by-side in the App Store, they should be visually cohesive — same quality, same aesthetic, same design language, just different content.

No watermarks, no extra text, no app store UI chrome.
```

## 迭代提示词模板

用户对选中版本提修改意见时使用；`--input-image` 传三张：scaffold + 风格模板 + 用户选中版本：

```text
Here are three reference images, each with a distinct purpose:

- FIRST image: The SCAFFOLD — use this as the definitive guide for layout: text position, device frame placement, and the app screenshot on screen. This defines WHERE everything goes.
- SECOND image: The STYLE TEMPLATE — this is the first approved screenshot in the set. The device frame rendering, text treatment, and overall visual style MUST match this exactly. This defines HOW this screenshot should look to maintain consistency across the set.
- THIRD image: The APPROVED DESIGN DIRECTION — this is the version the user liked best for this specific screenshot. Match its creative direction, breakout element approach, and secondary elements.

Generate a new version that keeps the layout from the scaffold, the device frame and visual style from the style template, and the creative direction from the approved design, with these changes:
[USER'S REQUESTED CHANGES]
```
