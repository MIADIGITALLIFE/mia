# Mia 内容更新指南

所有空间的主要文案集中在根目录的 content.json。修改后提交到默认分支，GitHub Pages 会按仓库部署设置自动更新。

## 可以编辑哪些内容

- daily_philosophy：哲思吧台随机抽取的哲学签。
- mia_response：迷雾大厅显示的开场短句。
- music_playlist：音乐室的三个情绪入口。当前三个入口共用 mia-background.mp3；philosophy 控制对应文案，color 控制氛围色。
- echo_wall：馆藏回声。请只放 Mia 创作或明确获准公开的内容；这里不会自动收集访客输入。
- greenhouse_notes：森林温室的听雨、看光、深呼吸提示。
- archive_notes：梦的档案馆留白卡。

## 编辑时请注意

1. 保留 JSON 的双引号、逗号和方括号。
2. music_playlist 里的 id 必须分别为 blue、gold、green，以对应页面的三个情绪按钮。
3. 如果新增音乐文件，请先把文件上传到仓库，再把对应 track 路径改为实际存在的文件；当前页面不会假装播放尚未上传的音轨。
4. last_updated 使用 YYYY-MM-DD 格式。更新文案时建议同步更新日期。
5. 内容文件加载失败时，content.js 会使用内置备用文案。

## 建议的更新流程

先在本地或 GitHub 编辑 content.json，检查 JSON 格式，再提交。修改后打开网站并强制刷新，检查五个空间的文案和交互。
