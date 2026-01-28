// 页面内固定面板
class GrokPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.init();
  }

  init() {
    // 检查是否已存在面板
    if (document.getElementById('grok-video-panel')) {
      this.panel = document.getElementById('grok-video-panel');
      return;
    }

    // 创建面板容器
    this.panel = document.createElement('div');
    this.panel.id = 'grok-video-panel';
    this.panel.innerHTML = `
      <div class="grok-panel-header">
        <h3>🎬 Grok 视频批量生成器</h3>
        <button class="grok-panel-close" id="grok-panel-close">×</button>
      </div>
      <div class="grok-panel-content" id="grok-panel-content">
        <p style="padding: 20px; text-align: center; color: #666;">
          正在加载控制面板...
        </p>
      </div>
    `;

    // 添加样式
    this.injectStyles();

    // 添加到页面
    document.body.appendChild(this.panel);

    // 绑定关闭按钮
    const closeBtn = this.panel.querySelector('#grok-panel-close');
    closeBtn.addEventListener('click', () => this.hide());

    // 阻止面板内的键盘事件冒泡到页面（防止触发 grok.com 的快捷键）
    this.panel.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    
    this.panel.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    
    this.panel.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    // 初始隐藏
    this.hide();
  }

  injectStyles() {
    if (document.getElementById('grok-panel-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'grok-panel-styles';
    style.textContent = `
      #grok-video-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 420px;
        height: 100vh;
        background: #1a1a2e;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      #grok-video-panel.hidden {
        transform: translateX(100%);
        pointer-events: none;
      }

      .grok-panel-header {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .grok-panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      .grok-panel-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .grok-panel-close:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: scale(1.1);
      }

      .grok-panel-content {
        flex: 1;
        overflow: hidden;
        padding: 0;
        position: relative;
        background: #0f0f1a;
      }

      #grok-panel-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
        background: #0f0f1a;
      }

      /* 确保面板在页面最上层 */
      #grok-video-panel * {
        box-sizing: border-box;
      }
      
      /* 加载动画 */
      .grok-panel-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #888;
      }
      
      .grok-panel-loading .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #333;
        border-top-color: #4ade80;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  show() {
    if (this.panel) {
      this.panel.classList.remove('hidden');
      this.isVisible = true;
      
      // 加载 popup 内容
      this.loadPanelContent();
    }
  }

  hide() {
    if (this.panel) {
      this.panel.classList.add('hidden');
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  async loadPanelContent() {
    const content = document.getElementById('grok-panel-content');
    if (!content) return;

    // 如果已经加载了 iframe，不重复加载
    if (content.querySelector('#grok-panel-iframe')) {
      return;
    }

    try {
      // 显示加载动画
      content.innerHTML = `
        <div class="grok-panel-loading">
          <div class="spinner"></div>
          <p>正在加载控制面板...</p>
        </div>
      `;
      
      // 使用 iframe 加载 popup 内容（支持文件选择器）
      const iframe = document.createElement('iframe');
      iframe.id = 'grok-panel-iframe';
      iframe.src = chrome.runtime.getURL('popup/popup.html');
      iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
      
      // 等待 iframe 加载完成
      iframe.onload = () => {
        console.log('面板内容加载完成');
        
        // 阻止 iframe 内的键盘事件冒泡
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            iframeDoc.addEventListener('keydown', (e) => e.stopPropagation(), true);
            iframeDoc.addEventListener('keyup', (e) => e.stopPropagation(), true);
            iframeDoc.addEventListener('keypress', (e) => e.stopPropagation(), true);
          }
        } catch (e) {
          // 跨域限制，可以忽略
          console.warn('无法访问 iframe 文档:', e.message);
        }
      };
      
      // 清空内容并添加 iframe
      content.innerHTML = '';
      content.appendChild(iframe);
      
    } catch (error) {
      console.error('加载面板内容失败:', error);
      content.innerHTML = `
        <div style="padding: 20px; color: #f44336; text-align: center;">
          <p>加载失败: ${error.message}</p>
          <p style="font-size: 12px; margin-top: 10px; color: #888;">请刷新页面后重试</p>
        </div>
      `;
    }
  }
}

// 创建全局面板实例
let grokPanel = null;

// 初始化面板
function initPanel() {
  if (!grokPanel) {
    grokPanel = new GrokPanel();
  }
  return grokPanel;
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'togglePanel') {
    const panel = initPanel();
    panel.toggle();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'showPanel') {
    const panel = initPanel();
    panel.show();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'hidePanel') {
    if (grokPanel) {
      grokPanel.hide();
    }
    sendResponse({ success: true });
    return true;
  }
  
  return false;
});

// 页面加载完成后初始化（但不显示）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPanel();
  });
} else {
  initPanel();
}

console.log('Grok Video Panel Script Loaded');
