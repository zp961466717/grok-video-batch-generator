# Grok 视频批量生成器 Chrome 扩展

<div align="center">

🎬 一个强大的 Chrome 浏览器扩展，用于在 grok.com 网站上批量生成视频

[安装指南](#安装) • [使用说明](#使用说明) • [功能特性](#功能特性)

</div>

---

## 📋 目录

- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [安装](#安装)
- [使用说明](#使用说明)
- [文件格式](#文件格式)
- [故障排除](#故障排除)
- [开发说明](#开发说明)
- [更新日志](#更新日志)
- [许可证](#许可证)

---

## ✨ 功能特性

### 核心功能
- 📸 **批量图片上传** - 一次性选择多张图片（支持 JPG、PNG、WebP 等格式）
- 📝 **批量提示词管理** - 从文本文件读取提示词，自动匹配图片
- 🤖 **自动化处理** - 全自动上传、生成、下载流程
- 💾 **智能下载** - 视频生成完成后自动下载，支持自定义命名
- ⏸️ **暂停/继续** - 支持暂停和恢复批量处理
- 📊 **实时进度** - 显示处理进度和详细状态
- 📋 **操作日志** - 完整记录所有操作和错误信息

### 用户体验
- 🎨 **现代化界面** - 简洁美观的用户界面
- 🔄 **状态同步** - 自动保存进度，刷新后可恢复
- 🛡️ **错误处理** - 完善的错误提示和重试机制
- 📱 **响应式设计** - 适配不同屏幕尺寸

---

## 📸 界面展示

<div align="center">

![扩展界面](screenshots/extension_interface.png)

*Grok 视频批量生成器 - 现代化的暗色主题界面*

</div>

---

## �💻 系统要求

- Google Chrome 浏览器 88 或更高版本
- 在 grok.com 网站已登录的账户
- 稳定的网络连接

---

## 🚀 安装

### 方法一：从源码安装（开发者模式）

1. **下载源码**
   ```bash
   git clone https://github.com/zp961466717/grok-video-batch-generator.git
   cd grok-video-batch-generator
   ```

2. **打开 Chrome 扩展管理页面**
   - 在 Chrome 地址栏输入 `chrome://extensions/`
   - 或者点击 菜单 → 更多工具 → 扩展程序

3. **启用开发者模式**
   - 打开右上角的"开发者模式"开关

4. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录（包含 manifest.json 的文件夹）

5. **确认安装**
   - 扩展图标应该出现在 Chrome 工具栏中
   - 点击图标即可打开控制面板

### 方法二：从 Chrome 网上应用店安装（即将推出）

敬请期待...

---

## 📖 使用说明

### 快速开始

1. **准备工作**
   - 准备要处理的图片文件（JPG、PNG、WebP 等）
   - 准备提示词文本文件（每行一个提示词）
   - 登录 https://grok.com

2. **打开扩展**
   - 在 grok.com 页面上，点击浏览器工具栏中的扩展图标
   - 弹出控制面板

3. **选择文件**
   - 点击"选择图片文件"按钮，选择一张或多张图片
   - 点击"选择TXT文件"按钮，选择提示词文件
   - 扩展会自动显示预览和配对关系

4. **开始处理**
   - 确认配对无误后，点击"开始生成视频"按钮
   - 扩展将自动执行以下操作：
     * 上传第一张图片
     * 填入对应的提示词
     * 点击生成按钮
     * 等待视频生成完成
     * 自动下载视频
     * 继续处理下一张图片

5. **监控进度**
   - 实时查看进度条和状态信息
   - 查看操作日志了解详细过程
   - 如需暂停，点击"暂停"按钮
   - 点击"继续"可恢复处理

6. **完成**
   - 所有视频生成并下载完成后，会显示完成提示
   - 视频文件保存在浏览器默认下载文件夹中

### 详细操作流程图

```
┌─────────────────┐
│  准备图片和提示词  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   打开 grok.com  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   点击扩展图标    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   选择图片文件    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  选择提示词文件   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   预览确认配对    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  开始批量处理     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  自动生成和下载   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    处理完成      │
└─────────────────┘
```

---

## 📄 文件格式

### 图片文件

支持的格式：
- JPG / JPEG
- PNG
- WebP
- GIF
- BMP

建议：
- 分辨率：1920x1080 或更高
- 文件大小：每张不超过 10MB
- 数量：建议单次不超过 50 张

### 提示词文件

格式要求：
- 文件类型：纯文本文件 (.txt)
- 编码：UTF-8
- 每行一个提示词
- 空行会被自动忽略

示例文件 (`prompts.txt`)：
```text
A beautiful sunset over the ocean with flying birds
A futuristic city with neon lights at night
A peaceful forest with sunlight filtering through trees
An astronaut floating in space with Earth in the background
A cozy coffee shop on a rainy day
```

---

## 🛠️ 故障排除

### 常见问题

#### 1. 扩展无法加载

**问题**：点击扩展图标没有反应

**解决方案**：
- 确保在 grok.com 网站上使用扩展
- 刷新页面后重试
- 检查是否已启用扩展（chrome://extensions/）
- 查看浏览器控制台是否有错误信息

#### 2. 无法找到上传按钮

**问题**：提示"未找到图片上传按钮"

**解决方案**：
- 确认在正确的 grok.com 页面上
- 检查页面是否完全加载
- 可能是页面结构更新，需要更新扩展
- 尝试手动点击上传按钮后再使用扩展

#### 3. 视频生成失败

**问题**：某些视频生成失败

**解决方案**：
- 检查网络连接
- 确认 grok.com 账户状态正常
- 检查图片格式和大小
- 查看操作日志中的错误信息
- 减少单次处理的图片数量

#### 4. 下载失败

**问题**：视频无法自动下载

**解决方案**：
- 检查浏览器下载权限
- 确认下载文件夹有足够空间
- 查看浏览器下载历史
- 手动点击下载按钮

#### 5. 图片和提示词数量不匹配

**问题**：警告显示数量不一致

**解决方案**：
- 检查提示词文件中的空行
- 确保每张图片都有对应的提示词
- 扩展会按最小数量处理（多余的会被忽略）

### 调试模式

如需查看详细的调试信息：

1. 打开 Chrome 开发者工具（F12）
2. 切换到 Console 标签
3. 筛选包含 "Grok Video" 的消息
4. 查看详细的错误和状态信息

---

## 👨‍💻 开发说明

### 项目结构

```
grok-video-batch-generator/
├── manifest.json           # 扩展配置文件
├── popup/
│   ├── popup.html         # 弹出窗口界面
│   ├── popup.css          # 样式文件
│   └── popup.js           # 弹出窗口逻辑
├── content/
│   └── content.js         # 内容脚本（页面注入）
├── background/
│   └── background.js      # 后台服务工作进程
├── icons/
│   ├── icon16.png         # 16x16 图标
│   ├── icon48.png         # 48x48 图标
│   └── icon128.png        # 128x128 图标
├── examples/
│   └── prompts.txt        # 示例提示词文件
└── README.md              # 说明文档
```

### 技术栈

- **Manifest V3** - Chrome 扩展最新规范
- **Vanilla JavaScript** - 无依赖纯 JS 实现
- **Chrome APIs**:
  - `chrome.storage` - 数据持久化
  - `chrome.downloads` - 文件下载
  - `chrome.tabs` - 标签页操作
  - `chrome.runtime` - 消息传递

### 核心模块

#### 1. Popup（popup.js）
- 用户界面控制
- 文件选择和解析
- 任务调度和进度管理
- 状态同步

#### 2. Content Script（content.js）
- DOM 操作和元素查找
- 图片上传自动化
- 提示词填写
- 视频生成监控
- 下载触发

#### 3. Background Service Worker（background.js）
- 消息路由
- 文件下载管理
- 扩展生命周期管理

### 自定义和扩展

#### 修改选择器

如果 grok.com 页面结构发生变化，可以在 `content.js` 中修改选择器：

```javascript
// 图片上传按钮选择器
const selectors = [
  'input[type="file"][accept*="image"]',
  // 添加新的选择器
  '.your-custom-selector',
];
```

#### 调整等待时间

```javascript
// 在 content.js 中修改
const maxWaitTime = 300000; // 最大等待时间（毫秒）
const checkInterval = 3000;  // 检查间隔（毫秒）
```

#### 修改文件命名规则

在 `content.js` 的 `downloadVideo` 函数中：

```javascript
const filename = `grok_video_${index + 1}_${Date.now()}.mp4`;
// 修改为自定义格式
const filename = `custom_name_${index + 1}.mp4`;
```

---

## 📝 更新日志

### v1.0.0 (2026-01-22)

**初始版本发布**

- ✅ 批量图片上传功能
- ✅ 提示词文本文件导入
- ✅ 自动化视频生成流程
- ✅ 自动下载管理
- ✅ 暂停/继续/停止控制
- ✅ 进度显示和日志记录
- ✅ 现代化用户界面
- ✅ 错误处理和重试机制

---

## 🤝 贡献

欢迎提交问题和拉取请求！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启拉取请求

---

## ⚠️ 免责声明

- 本扩展仅供学习和研究使用
- 使用本扩展时请遵守 grok.com 的服务条款
- 请勿过度频繁使用，以免对服务器造成压力
- 开发者不对使用本扩展产生的任何后果负责

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue: [GitHub Issues](https://github.com/zp961466717/grok-video-batch-generator/issues)
- GitHub: [@zp961466717](https://github.com/zp961466717)

---

## 📜 许可证

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️**

Made with ❤️ by [@zp961466717](https://github.com/zp961466717)

</div>
