# 首批工具调研与选型

调研日期：2026-09-14。目标：开发与日常兼顾、使用浏览器计算、便于持续扩展。用户确认新增 10 项，PDF 转 JPG 单独保留，总计 11 项。

## 方法与证据边界

查看国内综合工具站、国际开发工具集和代表性单项工具的实际目录与功能说明。按用户明确需求、多站共同覆盖、日常适用范围、浏览器独立运行可行性确定优先级。未取得统一口径的全网使用量或搜索量数据，因此这里是首批产品优先级，不是声称全网流量前十。站点目录收录和社区关注度不等于单项工具使用量。

| 参考来源 | 观察及用途 |
| --- | --- |
| [Browserling 开发工具](https://www.browserling.com/tools) | 编解码、格式化、随机生成、哈希、文本、时间与图片的分类和能力对照。 |
| [DevToys 官方项目](https://github.com/DevToys-app/DevToys) | 日常开发工具组合及本地处理理念；涵盖密码、Base64、JSON、日期、哈希、二维码和文本。它是桌面工具集，用于需求交叉参考。 |
| [IT Tools 官方项目](https://github.com/CorentinTh/it-tools) | 可持续扩展的工具目录、搜索和独立工具模块组织参考。 |
| [10015](https://10015.io/) | 编码、文本、二维码、密码、图像等跨场景工具组合。 |
| [Tool.lu 工具目录](https://tool.lu/tool/) | 中文工具命名、文本／文档／图像／开发分类及 PDF 功能对照。 |
| [UU 热门工具](https://uutool.cn/type/hot/) | 国内综合站的热门入口，体现文本与图片处理需求；热门清单随时间变化。 |
| [Epoch Converter](https://www.epochconverter.com/) | 时间戳单位与日期时区展示的操作参考。 |
| [CyberChef](https://gchq.github.io/CyberChef/) | 浏览器内处理、多种编码转换和客户端运行边界参考。 |

## 入选清单

| 工具 | 入选原因 | 首版边界 |
| --- | --- | --- |
| 随机字符串／临时密码 | 用户明确指定；密码与随机标识生成跨工具集常见。 | 安全随机、批量、字符组合；有效期由目标系统管理。 |
| Base64 | 用户明确指定；多家目录共同覆盖。 | UTF-8 文本和 URL-safe 编码；不处理二进制文件转换。 |
| UUID | 用户明确指定；开发标识的直接需求。 | UUID v4；其他 UUID 版本后续补充。 |
| JSON | 开发工具集反复覆盖的基础数据处理场景。 | 严格 JSON 校验、格式化、压缩；不做 Schema 校验。 |
| URL 编解码 | 与 Base64 一起覆盖常用传输编码。 | 区分参数和完整 URL；不请求输入网址。 |
| 时间戳 | 中文开发目录和专门工具均有成熟使用场景。 | 秒、毫秒、本地与 UTC；不做任意时区排程。 |
| 哈希 | 文本校验和文件完整性检查共用。 | MD5、SHA-1、SHA-256、SHA-512；不做密码哈希存储。 |
| 二维码 | 连接开发与日常分享场景。 | 文字／链接，PNG／SVG；不建短网址服务。 |
| 文本处理 | 多站提供统计、大小写和清理，适合中文日常使用。 | 合并相关操作为一个工具，避免用子功能凑数量。 |
| 图片压缩与缩放 | 国内综合站和跨场景工具集均覆盖，平衡开发工具比重。 | JPG／PNG／WebP、静态输出、批量；不做 AI 图片处理。 |
| PDF 转 JPG（保留） | 用户明确要求，已有可用工具和稳定地址。 | 保留逐页 ZIP 与长图、清晰度、质量、间距和五种语言。 |

## 分类与后续

五个稳定类别为生成与校验、编码与数据、文本处理、时间与日期、图片与文档。每个工具有一个主分类和多个搜索关键词；网址仅由 slug 决定。未来拆分图片与文档类别时不改已有工具网址。

后续候选：JWT 解析、文本对比、正则测试、JSON／CSV／YAML 转换、日期间隔与时区换算、颜色转换、PDF 合并和拆分。候选只记录在文档中，未实现前不进入正式目录。

## 技术依据

- [Web Crypto 安全随机](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)及 [UUID v4](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)。
- [jsonc-parser](https://github.com/microsoft/node-jsonc-parser)：严格校验与文本编辑式格式化，保留原始数字文本。
- [hash-wasm](https://github.com/Daninet/hash-wasm)：在 Worker 中分块计算文件哈希。
- [node-qrcode](https://github.com/soldair/node-qrcode)：浏览器内生成二维码。
- [PDF.js 官方示例](https://mozilla.github.io/pdf.js/examples/)；此次升级至 6.3.289，覆盖 [GHSA-hq66-cqwq-w95j](https://github.com/advisories/GHSA-hq66-cqwq-w95j) 修复版本范围。
