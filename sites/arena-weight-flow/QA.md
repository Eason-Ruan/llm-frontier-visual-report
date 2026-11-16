# 验证记录 · 2026-11-05

## 2026-11-13: D3 core rendering and reproducible report build

- D3 now owns month/position/gap scales, tied-rank grouping, stacked stepped-area paths, frontier line paths, object/number interpolation and animation scheduling. Canvas still draws the existing annotation and hit layers; SVG still supplies the non-intercepting monthly ruler. `data-renderer="d3-canvas"` identifies the renderer for integration checks.
- Existing flow/story/composition checks passed: 29 boards, 1,282 populations, 153,156 geometry blocks; missing/zero, ties, outside-Top10 frontier, signed peaks and original narrative figures remain covered. Composition checks retain 721 of 1,262 candidates under the rolling six-month rule.
- `npm run build` and `npm run build:report` passed. The latter installs a separate English dashboard-only build and checksummed build information into the team report; there are no hand-edited minified bundles. The standalone build retains Storyboard and language controls.
- Palette: open `#26846c`, closed `#bd6250`, unknown `#84928d`; license detail uses Apache/MIT `#176d59` and other-open `#85bfaa`. Monthly source JSON was copied without recomputation.
- This record covers source tests and builds only. The parent task performs the browser interaction and responsive checks.

## 2026-11-06: Story-first navigation, collapsible sidebar, portable archive

- Navigation is 01 Storyboard / 02 Dashboard. Missing or unknown view defaults to Storyboard; view=dashboard remains explicit. Direct entry, refresh, category changes, Back and Forward passed.
- Hidden sidebar releases its full width. The header toggle stays accessible and uses aria-expanded / aria-controls. Collapse preference persists; English / Chinese labels and existing month/stack selections survive toggles.
- Browser checks at 1044 x 781 and 390 x 844 passed; no mobile page overflow. Desktop and mobile screenshots inspected.
- Vite base is ./ and src/assets.js resolves all runtime JSON and local source links relative to the app. Original catalog paths and data bytes remain unchanged.
- Bundled baseline fixtures preserve 29 categories, 58 arrays and 1,282 monthly shares with original file hashes. Tests no longer require the sibling site.
- Full checks passed: 1,282 populations, 153,156 geometry blocks, 41-month story facts, composition conservation and rolling six-month annotations (1,262 candidates to 721 retained).
- Candidate ZIP extracted to a new unrelated directory; all 93 payload hashes verified. npm ci --offline installed 57 packages from the existing local cache, npm test and npm run build passed. Every rebuilt dist file matched the original byte-for-byte. A new machine still needs network access or a populated npm cache for source installation; the bundled dist needs neither.
- The included dependency-free Node server worked on port 5180. A separate static server served /arena-fieldnotes/dist/ on port 5181. All four Storyboard charts, Dashboard, category selection, composition mode and local data links loaded with zero page errors and zero failed HTTP responses; 29 category options were available.
- The first subdirectory-link assertion mistakenly included the external Hugging Face datasets citation; restricting it to local data links passed without changing application code.
- ZIP includes source, all 31 runtime JSON files, fixtures, lockfile, dist, running instructions and file checksums. It excludes credentials, Site identity and node_modules. Upstream parquet processing remains a separate provenance reference, not a dependency for reproducing the page.

## Earlier checks

- 本地 Vite 页面 HTTP 200。
- `node tests/flow.mjs`：29 子榜 / 1,282 组月度组成，与原站逐类数量完全一致；检查 76,578 个几何方块（两个宽度）；覆盖 9 组并列超额、9 组不足额名单。
- Playwright 本地 Chrome 实机检查：Top50 排名 → 450ms 动画中间帧 → 面积终态；Top10 切换；2023-11 Top10 保留 11 个模型；月份选择。
- 编程相关快速切换用 math → chinese，随后浏览器返回 math；图表及选择器一致。
- 390×844 窄屏：页面本身不横溢，只有图表区域横向滚动。
- `prefers-reduced-motion: reduce` 下切换面积图，100ms 与 350ms 的画布快照相同。
- 页内品牌链接跳转后画布保留；动画终态连续面积填色已检查。
- 运行中未触发 pageerror；首次 favicon 404 已补充 SVG 图标。

截图与浏览器执行记录保存在外层项目 `output/playwright/weight-flow-*.png` 与 `.playwright-cli/`。
内置浏览器 CUA 两次连接超时，以上视觉检查使用本地 Playwright 完成。

## 连续色块、并列灰框与分区更新

- 排名色块无间隙拼接；并列模型各占一个等大完整单元，同组灰框；原始排名在提示和明细中保留。
- 分区以原始名次判定，分界 10/11、20/21、30/31、40/41 无重叠。边界并列完整保留。
- 扩展数据与几何校验：29 子榜 / 1,282 组组成 / 三种堆叠 / 两种宽度，共 229,734 个几何方块；分区人数守恒、按类别面积比例、模型不越区、连续色块边界和默认颜色检查通过。
- 保持仅本地预览，未部署。
- 浏览器实机：三区、每十名以及分区转换中间帧已查看；默认画布深绿像素为 0，开启后深浅绿同时存在；颜色开关可双向点击；Top10 只保留 1–10 分区；390px 页面无横向溢出。未捕获 pageerror。构建通过。

## 统一时间轴与前沿差距

- 29 子榜各 41 个月（2023-05 至 2026-09），补齐位置但不伪造快照、排名或零值。
- 前沿由完整月度快照计算，不受 Top10 / Top50 色块截断；来源哈希见 provenance.json。
- 全部子榜的前沿最小名次与可见源模型一致；合成样例验证 +16、-3、0、前期不计算和缺失不计算。
- Playwright 检查：Top10 前沿及差距动画中间／终态；综合榜最新 +16 = 开权重第17 − 闭权重第1；编程榜早期灰色斜线，缺失明细不显示0占比；41个月下拉；390px无页面溢出；无 pageerror。
- 早期历史文案使用官方2023-05-10参评证据纠正为“本数据集闭源模型覆盖不完整”，未写成未参评。
- 差距填充在正负转换处按线性交点分段，正红负绿；差值曲线紫色，闭权重零基准灰色。

## 内联峰值标注 · 最终样式

- 用户要求取消常驻卡片；已恢复 Top10 490px 画布，移除编号、连到下方卡片的引导线与卡片布局。
- 峰值显示 gap 数字，上下两端显示模型短名；彩色 gap 斜线保留。
- 纯函数验证局部峰值、负向领先峰值、持平峰顶、缺失断段、末端待确认与完整模型信息保留；29 子榜原有数据测试通过。
- 浏览器检查：无常驻卡片；悬浮综合榜2024-03的 Gap +8 显示 qwen1.5-72b-chat 第9与 claude-3-opus-20240229 第1，移出后卡片消失；差距视图与390px窄屏正常；未捕获 pageerror。

## 主 Dashboard + 两节 Storyboard（2026-11-06）

- `npm run build` 通过；`node tests/flow.mjs` 通过 29 子榜 / 1,282 月度组成 / 153,156 方块检查。
- `node tests/story.mjs` 验证 41 个月的整体／三区人数守恒与叙事结论：80% → 18%、2025 年初 -1、最新 +16、最新 0 / 4 / 5、连续 7 个月 Top10 无开权重；合成并列、缺失和未知样例通过。
- Playwright 1440px 实机：两组各两列（557px / 557px），四张画布；2025-01 下拉同步两节月份与 -1 差距；悬浮 2024-03 同步四图和两个读数，峰值提示保留 Qwen 1.5 72B 第9与 Claude 3 Opus 第1的完整标识；点击后移出仍固定该月。
- 第二节左图可在整体面积／排名方块切换，右图维持三区面积。2023-05 不计算前沿差距，避免把覆盖缺口标为零。
- 从数学榜 Top10、深绿开启、2025-06 月份进入故事，故事仍使用综合榜；返回主 Dashboard 后上述设置全部保留，Top10 没有堆叠选择器。浏览器返回可恢复故事页。
- 390×844：页面无横向溢出，左右图上下排列，月份选择继续联动。截图已实看，半宽图的时间标签和早期注记作了紧凑处理。
- 未捕获 pageerror。数据源 JSON、原始排名与发布状态不变。
- 截图：外层 `output/playwright/story-frontier-desktop.png`、`story-distribution-desktop.png`、`story-mobile.png`、`story-frontier-mobile.png`。

## 组成峰谷百分比与金色参考线

- 构建及已有 flow/story 检查通过；新增 `tests/composition.mjs` 验证 1,262 个标注和特殊边界，含未知权重导致的非互补占比与末端混合确认。
- Playwright：整体图 2025-04 峰谷提示为开权重 26%（13/50）、闭权重 74%（37/50），点击后两节固定到同月；三区保持独立分母。Top10 2024-10 提示为开 0/10、闭 10/10。
- 主 Dashboard 整体、三区、Top10 面积和深绿开关实机通过；390px 页面无横向溢出。未捕获 pageerror。
- 最终金色检查：两种堆叠都有金色参考线，整体图纵轴 25% / 50% / 75% 数字为金色；三区每区的三组数字也共用同一金色。50%实线较粗，25%和75%虚线。
- 截图：外层 `output/playwright/composition-gold-story.png`、`composition-labels-mobile.png`、`composition-dashboard-whole.png`、`composition-dashboard-tiers.png`、`composition-dashboard-top10.png`。后四张为金色调整前的布局／交互记录。
- 保持本地预览，未发布；原始排名与数据不变。


## 深灰参考线、六个月筛选与悬浮取值线（2026-11-06）

- 构建通过，flow/story 现有数据检查通过；composition 检查全部 1,262 个候选及筛选后的 721 个标注，保证每区任意滚动六个月内最多一个峰、一个谷。Jan–Jun 同类只能保留一个，Jan–Jul 可保留两个，跨年不重置窗口。
- 参考线与数字统一深灰 #495057；整体保留 25/50/75，三区仅保留 50。Playwright 对三区首区的像素验证：25%、75% 横向位置无参考线灰色像素，50% 处有 298 个（排除纵轴区域）。
- Storyboard 悬浮 2024-08：整体开 52%、闭 48%；三区开权重分别 10%、55%、70%，闭权重分别 90%、45%、30%；两条同月取值线同步。无 `.hover-card`，点击固定月份，移出后取值线消失并恢复静态峰谷。
- 主 Dashboard Top10 2024-10 悬浮为开 0%、闭 100%；数学榜 2023-05 显示“无数据”而非 0%。排名视图保留前沿及模型名称提示。未捕获 pageerror。
- 1440px 双列及 390px 单列取值线检查通过，页面无横向溢出。浏览器像素读取产生的 Canvas2D readback 性能提示来自 QA 读取，不是页面异常。
- 最终截图：外层 `output/playwright/composition-gray-sparse.png`、`composition-floating-ruler.png`；`composition-floating-mobile.png` 为静态标注悬浮隐藏调整前的手机布局记录。
- 本地构建与预览，未发布；原始排名、面积值和 gap 标注未更改。


## 纯百分比、小箭头与简化三区（2026-11-06）

- 构建通过；悬浮值不再显示“开／闭”，ARIA 描述仍保留权重状态。
- 悬浮线和整体峰谷线共用 `shareBoundaryArrows` 几何，在红绿交界处向两侧区域分别画红、绿箭头。占比为零的一侧不画箭头，避免指向相邻分区。
- 三区静态峰谷层及静态选中月份竖线关闭；保留 1.6px 深灰 50% 参考线、月份下划线与悬浮取值线。
- Playwright：2024-08 整体悬浮值为 48% / 52%，有两个箭头；三区悬浮值为 90/10、45/55、30/70，有六个箭头。无模型卡片；最新 Top10 开权重为 0%，只画一个红箭头。
- 静态像素检查确认整体有红绿箭头，三区没有静态箭头／峰谷标注；1440px、390px 页面无横向溢出，无 pageerror。
- 已查看最终静态与悬浮截图：外层 `output/playwright/composition-arrows-static.png`、`composition-arrows-hover.png`；手机记录 `composition-arrows-mobile.png`。本地预览，未发布。


## 默认英文与中英切换（2026-11-06）

- 全站通过共享 LanguageProvider 切换，默认英文；右上角 EN / 中文按钮包含可访问标签和选中状态。语言保存在 localStorage，HTML lang、title、description 同步。
- 三路并行完成 Dashboard、Storyboard、图表翻译后独立复核；将方块轴的“序位”译为 Position，保留展示顺序与并列原始排名的区别。统一使用 open-weight / closed-weight。
- 构建与 flow/story/composition 现有检查通过：29 子榜、1,282 组组成、153,156 几何方块及峰谷算法无变化。
- 英文模式扫描全部页面文字节点（包括折叠内容）、ARIA/选项标签、Canvas fillText：Dashboard 和 Storyboard 均无遗漏中文；仅中文切换按钮按设计保留。模型 ID / 机构 / 许可原文已扫描，不含待翻译中文。
- Dashboard 在 math / 三区 / 2025-06 / 深绿开启状态下，中英往返保留全部设置，切换期间没有数据请求。Story 在 2025-04 / 左图排名方块下往返同样保留月份与模式，切换期间 0 次数据请求。
- 中文选择后刷新仍为 zh-CN；切回英文后文案、标题和画布回到英文。峰值提示和悬浮取值线的无障碍说明均使用英文，数值不变。
- 1440px 两组并排图的画布顶端偏差均为 0；390px 的 Dashboard 和 Storyboard 无页面横向溢出，语言按钮可用。已实看桌面、手机截图。
- 截图：外层 `output/playwright/english-dashboard-desktop.png`、`english-dashboard-area.png`、`english-story-desktop.png`、`english-story-frontier.png`、`english-story-distribution.png`、`english-story-mobile.png`、`english-frontier-mobile.png`、`english-dashboard-mobile.png`。
- 未捕获 pageerror。初次 QA 等待将画布独立文字数量门槛设为 20，但实际排名画布只有 18 个独立文本，已确认该超时属于检查条件而非页面加载故障。未发布。
