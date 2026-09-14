---
"name": "太然工具箱"
"description": "沉静文气的品牌，清楚顺手的浏览器工具。"
"colors":
  "accent": "#2775b6"
  "accent-strong": "#1e5f95"
  "accent-soft": "#e8f2fa"
  "bg": "#fcfdfe"
  "surface": "#fff"
  "surface-alt": "#f0f6fb"
  "border": "#d9e4ec"
  "border-strong": "#8fb8da"
  "text": "#152b3a"
  "text-muted": "#596f80"
  "danger": "#ad3434"
  "success": "#286343"
  "dark-accent": "#8fbddf"
  "dark-accent-strong": "#b3d3e9"
  "dark-accent-soft": "#1c3648"
  "dark-bg": "#101c25"
  "dark-surface": "#14232e"
  "dark-surface-alt": "#172935"
  "dark-border": "#304958"
  "dark-border-strong": "#648da9"
  "dark-text": "#ecf3f8"
  "dark-text-muted": "#9fb5c6"
  "dark-danger": "#ffb4ab"
  "dark-success": "#98d6b1"
"typography":
  "display":
    "fontFamily": "'Tairan Serif','Songti SC',serif"
    "fontSize": "36px"
    "fontWeight": 400
    "lineHeight": 1.5
  "brand":
    "fontFamily": "'Tairan Serif','Songti SC',serif"
    "fontSize": "25px"
    "fontWeight": 400
    "lineHeight": 1.4
    "letterSpacing": ".05em"
  "headline":
    "fontFamily": "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif"
    "fontSize": "30px"
    "fontWeight": 600
    "lineHeight": 1.4
  "section-title":
    "fontFamily": "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif"
    "fontSize": "19px"
    "fontWeight": 600
    "lineHeight": 1.5
  "body":
    "fontFamily": "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif"
    "fontSize": "16px"
    "fontWeight": 400
    "lineHeight": 1.65
  "label":
    "fontFamily": "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif"
    "fontSize": "14px"
    "fontWeight": 400
    "lineHeight": 1.65
  "caption":
    "fontFamily": "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif"
    "fontSize": "13px"
    "fontWeight": 400
    "lineHeight": 1.65
  "data":
    "fontFamily": "'SFMono-Regular',Consolas,'Liberation Mono',monospace"
    "fontSize": "14px"
    "fontWeight": 400
    "lineHeight": 1.8
"rounded":
  "control": "4px"
  "panel": "8px"
"spacing":
  "4": "4px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "56": "56px"
  "64": "64px"
"components":
  "button-primary":
    "backgroundColor": "{colors.accent-strong}"
    "textColor": "{colors.bg}"
    "rounded": "{rounded.control}"
    "padding": "8px 16px"
  "button-primary-hover":
    "backgroundColor": "{colors.accent}"
  "button-secondary":
    "backgroundColor": "{colors.surface}"
    "textColor": "{colors.text}"
    "rounded": "{rounded.control}"
    "padding": "8px 16px"
  "input":
    "backgroundColor": "{colors.surface}"
    "textColor": "{colors.text}"
    "rounded": "{rounded.control}"
    "padding": "8px 12px"
  "category-navigation":
    "textColor": "{colors.text-muted}"
    "typography": "{typography.label}"
  "catalog-entry":
    "textColor": "{colors.text}"
    "padding": "4px 0 14px"
  "settings-panel":
    "backgroundColor": "{colors.surface-alt}"
    "rounded": "{rounded.panel}"
    "padding": "24px"
  "file-zone":
    "backgroundColor": "{colors.surface-alt}"
    "rounded": "{rounded.panel}"
    "padding": "24px"
---

# Design System: 太然工具箱

## Overview

**Creative North Star:「沉静文气，清晰和效率为先」**

沿用已确认的「沉静文气，清晰和效率为先」方向。方庭 SVG、太然字样与景泰蓝构成品牌识别；宋体只承担品牌和目录引言，操作区域采用熟悉的系统控件与等宽数据。

界面以细分隔线、低饱和背景和清楚的输入／结果层级组织任务。本文记录完成后的实现，不提出新的视觉方向；页面策略与质量约定仍以 `.impeccable/surfaces/tools.md` 为准。

**Key Characteristics:**

- 文气品牌，常规操作。
- 平面细线与克制蓝色。
- 浅深主题和完整手机工作区。

## Colors

前置 token 是颜色权威，名称对应共享 CSS 自定义属性；`dark-` 前缀记录深色主题对同名属性的替换。组件 token 描述浅色默认，运行时通过 CSS 语义变量切换。

### Primary

景泰蓝 `accent` 承担品牌标志、焦点、选中线和箭头；`accent-strong` 承担链接、主按钮及状态文本；`accent-soft` 用于文字选择、按下和拖入状态。深色采用对应的浅蓝色系，以保持可读性。

### Neutral

`bg` 是页面底色；`surface` 是按钮和可编辑字段；`surface-alt` 是只读结果、设置区和预览区。`border` 组织分组及页头页尾，`border-strong` 标明可操作字段边界。`text` 和 `text-muted` 区分正文与解释。

`danger` 表示错误；`success` 已在源文件定义，当前通用完成状态实际使用 `accent-strong`，不要把它记成全局成功反馈配色。

主题选择支持跟随系统、浅色、深色。首屏脚本在绘制前应用保存的偏好；未指定主题时 CSS 同样响应系统深色。

## Typography

字体堆栈与桌面角色见前置 token。Tairan Serif 由本站 `/fonts/tairan-serif.woff` 加载，使用 `font-display: swap`，声明字重范围 400–600。工具标题采用系统无衬线，而目录引言采用宋体。没有统一等比字号阶梯。

目录引言在 800px 以下改为 30px，640px 以下为 29px；品牌在手机为 23px；工具一级标题在手机为 26px。二级标题通常 19px，目录分类标题 17px，工具入口名称 16px／500。解释文本通常 13px 或 14px；目录副文案为 15px，手机为 14px。

数据文本框采用等宽字体和 1.8 行高，手机字号升为 16px。统计数字和时钟使用等宽字体及表格数字。工具说明最大宽度 68ch，补充注释最大宽度 76ch。

**字体分工规则。** 宋体传达身份；系统字体承载操作；等宽字体承载待处理内容与结果。

## Layout

共用容器最大宽度 1184px，居中且包含两侧内边距。桌面左右内边距 32px，800px 以下 24px，640px 以下 20px。页头默认最低 88px，手机最低 80px 且可换行；页尾自然换行。

目录桌面分组为 160px 分类列加剩余内容列，间距 32px，组内两列入口。800px 以下分类列为 130px、间距 24px，入口单列；640px 以下分类和入口上下排列。目录顶部留白桌面 48px、手机 30px。

工作页顶部 30px、底部 64px，手机分别为 22px、40px。双编辑器和时间表单采用等宽两列、24px 间距；生成器默认 0.85fr／1.15fr、48px 间距，800px 以下等宽且间距 24px，640px 以下全部单列。设置面板内边距 24px，手机 20px。操作行可换行。

文本框默认最小高度 180px，可纵向调整；手机最小高度 220px、初始高度 240px。PDF 缩略图使用自动填充列，最小列宽 140px，间距 20px；长图预览最高 640px、内部滚动。PDF 设置和进度区最大宽度 800px，手机设置字段单列。

## Elevation & Depth

没有阴影。深度来自背景分层、细边框和分隔线；工具入口保持平面。焦点使用 2px 实线轮廓与 4px 外偏移，不以阴影模拟。

## Shapes

按钮和字段采用轻微圆角（control）；设置面板、文件选择区和二维码结果采用稍柔和圆角（panel）。普通边界为 1px 实线，文件选择区为 1px 虚线；选中分类下划线为 2px。方庭标志直接复用现有 SVG，不重绘或替换为字体图标。品牌标志桌面 44px、手机 38px。

## Components

### Buttons

默认按钮最低 44px，主按钮使用强调色实底及页面底色文字；次按钮采用表面底色和强边框。悬停改变背景和边框，默认按下使用浅强调色；主按钮的更高优先级背景规则在按下时仍生效。禁用状态使用次级文字、0.55 透明度和不可用指针。

编辑器标题区和清空筛选使用最低 36px 的紧凑按钮；页头选择器最低 40px。不是所有交互元素都声明 44px 最小高度。

### Inputs / Fields

原生输入框与选择器最低 44px；文本框全宽，内边距 16px，只读区域使用备用表面。搜索框最低 52px、内边距 12px 16px。复选框为 18px，标签行最低 44px。保留可见标签、原生键盘操作和全局焦点轮廓。

### Navigation

页头提供品牌主页链接、博客链接和外观选择；PDF 另有语言选择。手机隐藏页头博客链接，页尾仍有主站入口。分类筛选是带计数的普通文字链接，当前项以强调色文字与底线表示；它们不是胶囊标签。工作页面包屑和相关工具均为真实链接。

### Catalog entries / Containers

工具入口由名称、箭头、说明与底部分隔线构成，无外层卡片底色或阴影。悬停时名称变为强强调色，箭头水平移动 3px。设置和结果面板使用备用表面与 panel 圆角。

### File selection / Progress / Feedback

文件区保留原生文件选择器和拖入说明，拖入时改为强调边框与浅强调底色。进度条高 8px；长任务提供取消。结果就绪后才启用复制或下载，字段改变会使旧结果失效；错误以文字说明并保留输入。状态区域保留至少 28px 高度，正常反馈使用强强调色，错误使用 danger。

按钮背景、边框和目录箭头采用 0.18s ease 过渡。减少动态效果偏好下关闭过渡并使用自动滚动；没有入场动画或装饰性持续动画。

## Do's and Don'ts

### Do:

- Do 保留太然名称、方庭 SVG 和已确认的景泰蓝品牌。
- Do 让操作标题、标签和按钮使用系统无衬线字体，数据使用等宽字体。
- Do 保留可见标签、键盘焦点、跳转正文链接和明确的结果反馈。
- Do 使用语义主题变量，检查浅深主题与窄屏下的可读性。

### Don't:

- Don’t 把品牌宋体扩展到输入框、操作标签和数据。
- Don’t 添加渐变、装饰网格或加载表演。
- Don’t 用浮起的营销卡片替换当前平面工具入口。
- Don’t 隐藏手机的核心操作或用颜色作为错误的唯一提示。
