import SwiftUI

/// 引导页插画通用骨架 —— "旅程轴进入主卡" 迷你场景（siflo 2026-08 蒸馏）。
///
/// 用宿主产品自己的视觉语言替换抽象图标：一条细轴 + 轴上的语义标记（起点 /
/// 断点 / 等待点 / 提醒 chip）+ 一张"正在进行"的主卡 + 弱化的幽灵卡。
/// 全部形状构成、零文案,天然支持本地化。
///
/// 用法（适配任意宿主）：
///   - `marker`：按你的步骤语义构造标记（墨块 / 反转墨块 / 空心点 / 通知 chip）。
///   - `tint` / `capsuleFill` / `capsuleInk`：映射宿主设计 token,
///     不要硬编码颜色。语义色沿用产品既有（如"重归"用警告色）。
///   - `entered`：由宿主步骤切换时置位，驱动一次性入场。
///   - reduced-motion 下传入 `motion = nil` → 直接落定。
///
/// 动效顺序：标记现(0.06) → 线画下(0.1) → 卡落位(0.16)；文字 stagger 由宿主负责。
struct OnboardingVignette<Marker: View>: View {
  let marker: Marker
  var markerSize: CGFloat = 9
  var tint: Color                  // 状态点 / 光晕
  var capsuleFill: Color           // "下一步"实色条
  var capsuleInk: Color = .white
  var ghostCount: Int = 1
  var entered: Bool = true
  var motion: Animation?           // reduce-motion 时传 nil

  // 几何常量（240×180 画布,坐标以中心为原点）——可按宿主调整。
  private let cardY: CGFloat = 26      // 主卡中心纵坐标
  private let axisX: CGFloat = -84     // 轴横坐标（主卡头部内）
  var body: some View {
    ZStack {
      glow
      thread
      ghosts
      heroCard
    }
    .frame(width: 240, height: 180)
    .accessibilityHidden(true)
  }

  // MARK: - 背景光晕（tint 柔化）
  private var glow: some View {
    Circle()
      .fill(
        RadialGradient(
          colors: [tint.opacity(0.18), tint.opacity(0)],
          center: .center,
          startRadius: 4,
          endRadius: 130
        )
      )
      .frame(width: 300, height: 300)
      .blur(radius: 6)
  }

  // MARK: - 旅程轴（标记 + 向下活线,线自上而下画下）
  private var thread: some View {
    VStack(spacing: 0) {
      marker
        .frame(width: markerSize, height: markerSize)
        .opacity(entered ? 1 : 0)
        .scaleEffect(entered ? 1 : 0.82)
      Rectangle()
        .fill(Color.primary.opacity(0.3))
        .frame(width: 1.5, height: 26)
        .scaleEffect(x: 1, y: entered ? 1 : 0, anchor: .top)
        .animation(motion?.delay(0.1), value: entered)
    }
    .frame(width: 16, alignment: .center)
    .offset(x: axisX, y: -58)
    .animation(motion?.delay(0.06), value: entered)
  }

  // MARK: - 幽灵卡（其他事情的记忆,弱化垫后）
  private var ghosts: some View {
    ForEach(0..<max(ghostCount, 0), id: \.self) { i in
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(Color.primary.opacity(0.05))
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .strokeBorder(Color.primary.opacity(0.08), lineWidth: 1)
        )
        .frame(width: 86, height: 56)
        .rotationEffect(.degrees(i == 0 ? -3 : 3))
        .offset(x: CGFloat(-26 + i * 60), y: -48)
        .opacity(entered ? 1 : 0)
        .animation(motion?.delay(0.05), value: entered)
    }
  }

  // MARK: - 主卡（一张"正在进行"的卡片:卡头条 + 实色下一步条）
  private var heroCard: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 6) {
        Circle().fill(tint).frame(width: 5, height: 5)
        RoundedRectangle(cornerRadius: 2)
          .fill(Color.primary.opacity(0.28))
          .frame(width: 26, height: 5)
      }
      .padding(.bottom, 10)

      RoundedRectangle(cornerRadius: 4)
        .fill(Color.primary.opacity(0.92))
        .frame(width: 118, height: 9)
        .padding(.bottom, 8)

      RoundedRectangle(cornerRadius: 3)
        .fill(Color.primary.opacity(0.4))
        .frame(width: 150, height: 5)

      Spacer(minLength: 0)

      // 「下一步」实色条 —— 用宿主动作按钮语义色,白/深墨配字
      HStack(spacing: 7) {
        RoundedRectangle(cornerRadius: 3)
          .fill(capsuleInk.opacity(0.85))
          .frame(width: 40, height: 6)
        Spacer(minLength: 0)
        Image(systemName: "arrow.right")
          .font(.system(size: 11, weight: .bold))
          .foregroundStyle(capsuleInk)
      }
      .padding(.horizontal, 11)
      .frame(width: 96, height: 26)
      .background(Capsule().fill(capsuleFill))
    }
    .padding(14)
    .frame(width: 186, height: 112, alignment: .topLeading)
    .background(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .fill(Color.primary.opacity(0.06))
    )
    .overlay(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .strokeBorder(Color.primary.opacity(0.1), lineWidth: 1)
    )
    .offset(y: cardY)
    .opacity(entered ? 1 : 0)
    .scaleEffect(entered ? 1 : 0.96)
    .animation(motion?.delay(0.16), value: entered)
  }
}
