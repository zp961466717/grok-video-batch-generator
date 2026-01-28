// Background Service Worker
console.log('Grok Video Batch Generator - Background Service Worker Started');

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('扩展已安装');
    // 打开欢迎页面
    chrome.tabs.create({
      url: 'https://grok.com/'
    });
  } else if (details.reason === 'update') {
    console.log('扩展已更新');
  }
});

// 监听来自 content script 或 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadVideo') {
    downloadVideo(message.url, message.filename)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放
  }
});

// 下载视频
async function downloadVideo(url, filename) {
  try {
    // 使用 Chrome Downloads API 下载文件
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false // 自动保存到下载文件夹
    });
    
    console.log(`视频下载已开始，ID: ${downloadId}`);
    
    // 监听下载完成
    return new Promise((resolve, reject) => {
      const listener = (delta) => {
        if (delta.id === downloadId) {
          if (delta.state && delta.state.current === 'complete') {
            chrome.downloads.onChanged.removeListener(listener);
            console.log(`视频下载完成: ${filename}`);
            resolve();
          } else if (delta.error) {
            chrome.downloads.onChanged.removeListener(listener);
            reject(new Error(delta.error.current));
          }
        }
      };
      
      chrome.downloads.onChanged.addListener(listener);
      
      // 超时处理（5分钟）
      setTimeout(() => {
        chrome.downloads.onChanged.removeListener(listener);
        reject(new Error('下载超时'));
      }, 300000);
    });
    
  } catch (error) {
    console.error('下载视频失败:', error);
    throw error;
  }
}

// 清理旧的存储数据（可选）
chrome.runtime.onStartup.addListener(() => {
  console.log('浏览器启动，清理旧数据');
  // 可以在这里添加清理逻辑
});

// 监听标签页更新，自动注入 content scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('grok.com')) {
    console.log('Grok.com 页面已加载完成，准备注入脚本');
    
    // 尝试检查脚本是否已注入
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (response && response.loaded) {
        console.log('Content scripts 已加载');
      }
    } catch (error) {
      // 脚本未加载，尝试注入
      console.log('Content scripts 未加载，开始注入...');
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/content.js']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/panel.js']
        });
        console.log('Content scripts 注入成功');
      } catch (injectError) {
        console.error('注入脚本失败:', injectError);
      }
    }
  }
});

// 监听扩展图标点击，在页面右侧显示固定面板
chrome.action.onClicked.addListener(async (tab) => {
  // 检查是否在 grok.com 页面上
  if (tab.url && tab.url.includes('grok.com')) {
    try {
      // 首先尝试发送消息
      await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
      console.log('面板已切换');
    } catch (error) {
      console.log('首次发送消息失败，尝试注入脚本:', error.message);
      
      // 如果 content script 未加载，注入所有必要的脚本
      try {
        // 注入 content.js
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        console.log('content.js 注入成功');
        
        // 注入 panel.js
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/panel.js']
        });
        console.log('panel.js 注入成功');
        
        // 等待脚本初始化
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 再次尝试显示面板
        await chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
        console.log('面板已显示');
        
      } catch (injectError) {
        console.error('注入脚本失败:', injectError);
        
        // 显示错误通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Grok 视频批量生成器',
          message: '无法加载面板，请刷新页面后重试'
        });
      }
    }
  } else {
    // 如果不在 grok.com 上，打开 grok.com
    chrome.tabs.create({
      url: 'https://grok.com/'
    });
  }
});
