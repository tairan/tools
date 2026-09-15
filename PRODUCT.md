# 太然工具箱

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

浏览器中的轻量工具集合，服务开发与日常任务。使用者通过分类目录或关键词寻找工具，在独立页面输入内容、处理、复制或下载结果。

## Users

用户已确认：开发与日常兼顾。首批新增随机字符串、UUID、哈希、Base64、URL 编解码、JSON、文本处理、时间戳、二维码、图片处理，另保留 PDF 转 JPG，共 11 项。

## Capabilities and Constraints

- Node 22、Vite 多页构建、原生 JavaScript，部署在 tools.tairan.org。
- 五类目录加独立工具页；普通页面导航、未知路径 404。分类不改变工具的稳定地址。
- 全部计算在浏览器完成；内容与文件不上传、不持久化。仅主题和全站语言偏好存入 localStorage。
- 目录与全部工具统一支持简体中文、英语和日文，切换语言保留当前输入和结果；PDF 保留逐页 ZIP、长图拼接、分辨率、质量和间距设置。
- 目录只展示可用工具；首版没有账号、云同步或离线安装功能。

## Brand Commitments

- 用户指定名称「太然」、方庭标志、景泰蓝 #2775B6。
- 继承主站沉静文气，工具控件以清晰和效率为先。
- 用户已选择「分类目录＋独立工具页」；不增加常驻侧栏。

## Evidence on Hand

本次用户确认的实施计划、src/catalog.js、现有 PDF 代码、主站 PRODUCT.md/DESIGN.md 和方庭 SVG。调研来源与具体入选理由见 docs/tool-research.md。
