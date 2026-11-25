# WIN CROWN Workspace UI (Static Pages Edition)

中缅双语、手机优先的 **WIN CROWN** 纯静态前端工作台与工程算量展示站（适配 Cloudflare Pages / Windows / Android / iPad 浏览器）。

> **FOR DISCUSSION ONLY — NOT FOR CONSTRUCTION**  
> **ဆွေးနွေးရန်သာ — ဆောက်လုပ်ရန်မဟုတ်ပါ**

## 包含页面与纯静态能力

- `index.html`：中缅双语移动优先工作台总览
  - 支持 **双语 / 中文 / မြန်မာ** 一键切换，防缅甸语上下标重叠排版（`Noto Sans Myanmar` / `Padauk` / `PingFang SC` / `Microsoft YaHei`，正文 16px / 行高 1.85）
  - **REV B03** 横向现场基准展示（`38′9″` = `2 ft + 32′9″ + 4 ft`，21 个 F1 基础与短柱，14 根主钢柱，约 39 ft 不等长屋檐屋盖）
  - 浏览器端实时钢筋重量试算器（`d² / 162.198`）
  - 浏览器端离线演练草稿记录（仅存当前设备 `localStorage`）与 UTF-8 BOM CSV 导出
  - 6 套《WIN_CROWN 钢结构厂房工业风概念图》中英对照提示词一键复制库
- `boq.html`：**ALAN SMART BOQ & ESTIMATING V1.0**（纯静态脱敏版）
  - 完整保留图纸两点比例校准、STAGE4 vs GB24 双基准切换、钢筋 BBS 实时公式算量、本地 `localStorage` 保存与 JSON 备份恢复、UTF-8 BOM CSV / SheetJS XLSX 导出及打印水印报告。

## 安全与脱敏边界

- 本仓库仅包含纯前端静态文件，无任何后端脚本、API 密钥、本地磁盘路径、内网地址、正式财务账本或未经脱敏的内部业务流水。
- **Cloudflare Pages 构建设置**：Framework preset 选 `None`，Build command 留空，Build output directory 填 `.`（根目录）。
