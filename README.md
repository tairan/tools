# 太然工具箱

浏览器里的日常工具，正式域名 **https://tools.tairan.org/**。主站位于 [tairan.org](https://tairan.org/)。

## 工具目录

| 分类 | 工具 |
| --- | --- |
| 生成与校验 | [随机字符串／临时密码](https://tools.tairan.org/random-string/)、[UUID](https://tools.tairan.org/uuid/)、[哈希计算](https://tools.tairan.org/hash/) |
| 编码与数据 | [Base64](https://tools.tairan.org/base64/)、[URL 编解码](https://tools.tairan.org/url-codec/)、[JSON 格式化](https://tools.tairan.org/json/) |
| 文本处理 | [文本统计与清理](https://tools.tairan.org/text/) |
| 时间与日期 | [时间戳转换](https://tools.tairan.org/timestamp/) |
| 图片与文档 | [二维码](https://tools.tairan.org/qrcode/)、[图片压缩与缩放](https://tools.tairan.org/image/)、[PDF 转 JPG](https://tools.tairan.org/pdf2jpg/) |

新增 10 个工具，另保留 PDF 转 JPG，共 11 个。目录和新增工具使用中文；PDF 保留中、英、日、德、法。品牌统一为太然、方庭标志和景泰蓝。

选型依据和后续候选见 [调研记录](docs/tool-research.md)。

## 本地处理与限制

输入、文件和结果只存在于当前页面内存，不上传、不写入日志、URL、localStorage 或 sessionStorage。主题和 PDF 语言沿用 `pdf2img:theme-mode`、`pdf2img:locale` 两个非内容偏好键。没有 GTM、第三方字体或远程工具 API；PDF 字体、字符映射和 WASM 随构建发布。复制仅由用户按钮触发。

页面所需资源加载完成后可以断网计算；首版没有 Service Worker，不承诺断网首次打开、离线刷新或安装。工具仅从自身域名加载资源。

- 文本上限 5 MiB；Base64 处理 UTF-8 文本，不把编码称为加密。
- 随机字符串长 1–256、数量 1–1,000，所选字符类型至少各出现一次。密码到期时间在目标系统设置。
- JSON 不接受注释和尾随逗号；格式化和压缩保留大整数、数字原文、字段顺序与重复字段。
- 哈希支持文本和文件；文件按 1 MiB 分块。MD5、SHA-1 用于兼容校验，不用于密码存储。
- 文本字符数按 Unicode grapheme 统计；去重区分大小写，保留第一次出现的完整行。
- 图片每批 20 张，每张 30 MiB；默认 WebP、质量 80%、保留尺寸。等比缩小、不放大，JPEG 透明背景填白；PNG 无损编码，不保留原图元数据，动画只输出静态画面。体积有可能增加，会显示实际变化。
- PDF 保留逐页 ZIP 与长图；画布过大时降低清晰度或选择逐页导出。加密 PDF 需先在本地解除保护。
- Worker 计算、图片转换、PDF 转换和 ZIP 打包提供取消与失败恢复。取消时丢弃未完成结果；文件对象、画布和下载对象 URL 会释放。

## 开发与验证

使用 Node.js 22（至少 22.13.0），版本约定见 `.nvmrc`。

```bash
npm ci
npm run dev
npm test
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run preview
```

`npm run test:all` 依次运行单元测试、生产构建和跨浏览器测试。浏览器测试针对生产预览，包含真实 PDF、二维码解码、ZIP 内容、像素与尺寸、取消恢复和网络／存储边界。测试结果与截图不提交。当前验证范围见 [验收记录](docs/verification.md)。

## 新增工具

1. 在 `src/catalog.js` 登记 `slug`、`title`、`description`、`categoryId`、`keywords`、`order`。需要新分类时更新同文件的 `categories`。
2. 新建 `<slug>/index.html`，按已有工具页保留页面元信息及 `theme-boot`、`site-header`、`tool-content`、`site-footer` 占位符，引入 `/src/tools/<slug>/main.js`。
3. 新建 `src/tools/<slug>/template.js`，默认导出返回工作区 HTML 的函数。可复用 `build/fields.js`、`build/text-workspace.js` 或 `build/generator-workspace.js` 的控件；不需要改 Vite 入口或公共模板分支。
4. 将业务计算放入 `logic.js`，交互放入 `main.js`。复用共享主题、复制／下载、状态和 Worker 支持；专用依赖仅从该工具导入。新增 Worker 任务时补充显式任务分发，避免执行任意代码。
5. 补充算法边界及浏览器交互测试，运行生产构建，验证独立地址、刷新、搜索、手机和浅深主题。

模板在构建阶段渲染，不将其他工具代码带入页面。开发时修改构建模板后重启 Vite。构建会拒绝重复 slug、未知分类、缺失入口或模板。目录只列可用工具；分类与网址分离，移动分类不改书签。PDF 的原生独立页面作为既有工具保留。

## 部署

仓库 `tairan/tools`，沿用 Netlify 项目 `tairans-tools.netlify.app`、`main` 分支和 `tools.tairan.org`。构建命令 `npm run build`，输出 `dist/`。保持多页与真实 404，不添加全站 SPA 回退。带内容指纹的资源长缓存，HTML 使用平台默认重新验证策略。

DNS 和域名保持原配置，不需要新增后端、函数或环境密钥。软件工程定律继续位于主站[手册栏目](https://tairan.org/guides/software-engineering-laws/)。
