# 泰然工具箱

常用在线工具，部署于 **https://tools.tairan.org/**。博客与参考手册位于 [tairan.org](https://tairan.org/)。

## 现有工具

- [PDF 转 JPG](https://tools.tairan.org/pdf2jpg/)：浏览器本地转换，支持逐页 ZIP、长图拼接、清晰度、JPEG 质量和页间距设置。PDF 文件不上传；保留中文、英文、日文、德文、法文及浅色、深色、跟随系统外观。

本次由原 `pdf2jpg` 仓库重构，保留 Git 历史。随机数和 UUID 生成等工具尚未实现。

## 开发与构建

使用 Node.js 22（至少 22.13.0），版本约定见 `.nvmrc`。

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Vite 多页构建输出到 `dist/`，首页 `/` 与 `/pdf2jpg/` 均有独立 HTML。`netlify.toml` 配置 Node 22、构建命令和发布目录。不配置全站 SPA 回退，未知路径应返回 404。

## 代码组织与扩展

- `src/catalog.js`：工具清单，仅保存 `slug`、`title`、`description`；`getToolPath` 生成访问路径。
- `index.html`、`src/home.*`：中文目录首页，工具卡片在开发及构建时由 Vite 注入，首页不加载 PDF 转换依赖。
- `<slug>/index.html`：各工具的独立 HTML 入口；Vite 根据清单自动收集入口。
- `src/tools/<slug>/`：各工具的业务代码、语言文案和专用样式。
- `src/shared/`：共用基础样式和偏好存储；沿用原 `pdf2img:*` 存储键。
- `public/`：静态资源。

新增工具：在 `src/catalog.js` 添加一个条目，新建对应 `<slug>/index.html` 与 `src/tools/<slug>/` 模块，页面引入自己的模块和样式，并提供返回 `/` 的链接。不要从目录首页引入工具业务模块。运行生产构建，验证独立地址、刷新、手机布局和实际工具操作。

## 部署

GitHub 仓库为 `tairan/tools`。沿用 Netlify 项目 `tairans-tools.netlify.app`，构建分支为 `main`，正式域名为 `tools.tairan.org`。

在 Netlify 绑定正式域名；Cloudflare 的 `tools` CNAME 指向 `tairans-tools.netlify.app`，使用 DNS only，由 Netlify 提供 HTTPS。DNS 操作凭据通过环境变量 `CF_TOKEN` 提供，不写入仓库。

不维护旧 `pdf2jpg.tairan.org` 的 301。跨域偏好不迁移，首次打开新域名使用原默认设置。软件工程定律已归入博客[手册栏目](https://tairan.org/guides/software-engineering-laws/)。
