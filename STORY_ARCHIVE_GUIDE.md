# Mia 故事档案馆 · 新作品录入指南

本目录使用 `data/stories.json` 作为唯一作品目录。档案馆列表页和阅读页都会读取它；不要为每篇小说复制一套页面。

## 新增一篇小说

1. 复制 `data/story-template.json` 中的对象。
2. 为作品设置唯一的英文小写 `id`，例如 `the-silicon-letter`。
3. 按档案顺序分配唯一编号，例如 `NO.002`。
4. 填写标题、简介、分类、预计阅读时间。
5. 将正文拆成章节；每个章节的 `body` 是段落字符串数组。
6. 将对象追加到 `data/stories.json` 的 `stories` 数组。
7. 如有封面，将图片放在 `assets/stories/covers/<id>.svg`，并在 `cover` 字段填写相对路径。

## 字段约定

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| id | 是 | 稳定且唯一；用于阅读进度键和 URL |
| number | 是 | 馆藏编号，如 NO.002 |
| title | 是 | 中文标题 |
| englishTitle | 否 | 英文标题 |
| subtitle | 否 | 阅读页标题下方的短句 |
| description | 是 | 收藏列表简介 |
| category | 否 | 分类标签数组 |
| readingTime | 否 | 人工估算的阅读时间 |
| status | 否 | 草稿、首发收藏、连载中、完结等 |
| cover | 否 | 封面相对路径；未提供时使用页面的抽象封面样式 |
| chapters | 是 | 章节数组 |
| chapters[].title | 是 | 章节标题 |
| chapters[].body | 是 | 段落字符串数组 |

## 内容与安全约定

- 正文以纯文本段落保存；阅读页使用 `textContent` 渲染，不把小说内容当作 HTML 执行。
- 不在小说 JSON 中放 API 密钥、访问令牌或私人信息。
- 不修改 `story.html` 来添加单篇小说；优先只编辑目录数据。
- 阅读进度仅保存在读者当前浏览器的 localStorage，不上传服务器。
- 新增作品前检查 `id` 和 `number` 是否重复。

## 本地/发布前检查

- JSON 可被标准解析器解析。
- 每篇作品至少有一个章节。
- 每个章节至少有一个正文段落。
- 每个 `id` 唯一，每个馆藏编号唯一。
- 在手机宽度检查章节目录横向滚动、正文行距和按钮。
- GitHub Pages 发布后确认 `stories.html`、`story.html?id=<id>` 和 JSON 请求均返回成功。

## 当前首发作品

- NO.001《反向启蒙》：已录入 8 章。
