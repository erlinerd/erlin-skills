# 截图审核工具（macOS 本机）

判断以工具输出为准，视觉模型只做粗评。

## 尺寸批量核对

```sh
sips -g pixelWidth -g pixelHeight <dir>/*.png | grep -E "pixel|:"
```

逐张对照目标规格；规格图与 `_raw` 原图成对存在。

## OCR 核验（Vision 框架，Swift 脚本）

识别截图文字 + 包围盒坐标，核验表盘数字/界面文案是否完整、时间是否与状态栏一致。脚本遇到图片读取、OCR 执行或空结果时返回非零：

```sh
SKILL_DIR="$HOME/.agents/skills/erlin-app-store-marketing"
swift "$SKILL_DIR/scripts/ocr_screens.swift" <image_path> ...
```

核验点：

- 时钟类 App 的状态栏文本含 "10:08"（与表盘一致）；
- 表盘数字/日期行齐全无乱码（OCR 把细字 `l` 读成 `I`/`0` 是常见误读，需结合像素区确认，勿单独下"内容错"结论）；
- 设置页所有 Section 文案在。

## 像素/色调核验

平均 RGB + 采样区颜色，核验皮肤色调（暗底/暖白/琥珀）。脚本遇到图片读取、像素缓冲区或空采样时返回非零：

```sh
SKILL_DIR="$HOME/.agents/skills/erlin-app-store-marketing"
swift "$SKILL_DIR/scripts/avg_color.swift" <image_path> ...
```

核验点：暗底类截图平均 RGB 应接近 (8-20, 8-20, 10-25)（黑底暖白字）；数值异常（如偏蓝/偏灰大范围）说明皮肤或状态栏渲染不对。

## 时间一致性推算（仅时钟类 App）

注入 `-time 10:07:55` + 等待 5 秒 → 截图时 app 内为 10:08:00；状态栏 override `--time "10:08"`。核对截图 OCR 两者均为 10:08。其他 App 使用自身测试数据，不执行表盘时间检查。
