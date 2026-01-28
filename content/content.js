// Content Script - 注入到 grok.com 页面
console.log('Grok Video Batch Generator - Content Script Loaded');

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理 ping 消息（用于检查脚本是否已加载）
  if (message.action === 'ping') {
    sendResponse({ success: true, loaded: true });
    return true;
  }
  
  if (message.action === 'processItem') {
    processItem(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放
  }
  
  // 处理手动下载请求
  if (message.action === 'downloadVideoNow') {
    downloadVideo(message.imageName, message.index, message.videoUrl)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  return false;
});

// 处理单个项目（图片+提示词）
async function processItem(data) {
  const { image, imageName, prompt, index } = data;
  
  try {
    sendLog(`开始处理: ${imageName}`, 'info');
    
    // 步骤 0: 验证页面状态和等待页面准备就绪
    await validateAndWaitForPageReady();
    
    // 记录开始处理前的视频状态（用于检测新视频）
    const existingVideos = Array.from(document.querySelectorAll('video')).map(v => v.src || v.currentSrc);
    
    // 步骤 1: 查找并点击图片上传按钮
    await uploadImage(image, imageName);
    
    // 步骤 2: 填写提示词
    await fillPrompt(prompt);
    
    // 步骤 3: 点击生成按钮
    await clickGenerateButton();
    
    // 步骤 4: 等待视频生成完成（传入已存在的视频列表，确保等待新视频）
    const videoInfo = await waitForVideoGeneration(existingVideos);
    
    // 步骤 5: 通知用户视频已生成，等待手动下载
    chrome.runtime.sendMessage({
      action: 'videoReady',
      index: index,
      imageName: imageName,
      videoInfo: videoInfo
    });
    
    sendLog(`${imageName} 视频生成完成，等待下载确认`, 'success');
    
    // 通知 popup 完成（但不自动下载）
    chrome.runtime.sendMessage({
      action: 'itemComplete',
      index: index,
      videoReady: true
    });
    
  } catch (error) {
    sendLog(`处理失败: ${error.message}`, 'error');
    chrome.runtime.sendMessage({
      action: 'itemError',
      index: index,
      error: error.message
    });
    throw error;
  }
}

// 验证页面状态并等待页面准备就绪
async function validateAndWaitForPageReady() {
  sendLog('正在验证页面状态...', 'info');
  
  // 检查当前URL
  const currentUrl = window.location.href;
  sendLog(`当前URL: ${currentUrl}`, 'info');
  
  // 验证是否在grok.com域名
  if (!currentUrl.includes('grok.com')) {
    throw new Error('请在 grok.com 网站上使用此扩展');
  }
  
  // 提示用户确保在正确的页面
  if (!currentUrl.includes('/imagine') && !currentUrl.includes('/image')) {
    sendLog('⚠️ 您可能不在视频生成页面，建议访问 https://grok.com/imagine', 'warning');
  }
  
  // 等待页面基本元素加载
  await waitForElement('body', 5000);
  await sleep(1500); // 等待页面完全渲染
  
  // 检查页面是否有文件输入元素
  const fileInputCount = document.querySelectorAll('input[type="file"]').length;
  sendLog(`页面检测到 ${fileInputCount} 个文件输入元素`, 'info');
  
  // 关闭可能打开的侧边栏或弹窗
  const closeBtns = document.querySelectorAll('button[aria-label*="close" i], button[aria-label*="关闭" i], [class*="close-button"], [data-testid*="close"]');
  for (const btn of closeBtns) {
    if (btn.offsetParent !== null) {
      try {
        btn.click();
        sendLog('已关闭干扰元素', 'info');
        await sleep(500);
      } catch (e) {
        // 忽略错误
      }
    }
  }
  
  sendLog('✓ 页面状态验证完成', 'success');
}

// 上传图片
async function uploadImage(imageDataUrl, imageName) {
  sendLog('正在上传图片...', 'info');
  
  // 等待页面加载完成
  await waitForElement('body', 5000);
  await sleep(500); // 额外等待确保页面稳定
  
  // 记录当前页面信息
  sendLog(`当前页面: ${window.location.href}`, 'info');
  
  // 更具体的选择器，优先选择明确与图片/视频相关的输入
  const selectors = [
    // 优先级最高：明确的图片/视频上传输入
    'input[type="file"][accept*="image"]',
    'input[type="file"][accept*="video"]',
    // 次优先级：带有明确标识的文件输入
    'input[type="file"][aria-label*="image" i]',
    'input[type="file"][aria-label*="upload" i]',
    'input[type="file"][data-testid*="image"]',
    'input[type="file"][data-testid*="upload"]',
    'input[type="file"][id*="image"]',
    'input[type="file"][id*="upload"]',
    'input[type="file"][name*="image"]',
    'input[type="file"][name*="upload"]',
    // 最后才考虑通用文件输入（需要额外验证）
    'input[type="file"]',
  ];
  
  let fileInput = null;
  let usedSelector = null;
  let debugInfo = [];
  
  // 统计所有文件输入元素
  const allFileInputs = document.querySelectorAll('input[type="file"]');
  sendLog(`页面共有 ${allFileInputs.length} 个文件输入元素`, 'info');
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    debugInfo.push(`${selector}: 找到 ${elements.length} 个元素`);
    
    for (const element of elements) {
      const isVisible = element.offsetParent !== null;
      const isDisabled = element.disabled;
      
      // 记录元素详情
      if (elements.length <= 3) {
        sendLog(`  检查元素 [${selector}]: 可见=${isVisible}, 禁用=${isDisabled}, accept="${element.accept || ''}"`, 'info');
      }
      
      // 验证元素是否可见且可交互
      if (isVisible && !isDisabled) {
        // 如果是通用的 input[type="file"]，需要额外验证
        if (selector === 'input[type="file"]') {
          // 检查元素的上下文，避免选中不相关的文件输入
          const parent = element.closest('[class*="sidebar"], [class*="history"], [class*="menu"], [class*="nav"], [role="navigation"]');
          if (parent) {
            sendLog(`  跳过侧边栏/导航区域的文件输入`, 'info');
            continue;
          }
          
          // 检查是否在主内容区域
          const mainContent = element.closest('main, [role="main"], [class*="content"], [class*="main"]');
          if (!mainContent) {
            sendLog(`  跳过非主内容区域的文件输入`, 'info');
            continue;
          }
        }
        
        fileInput = element;
        usedSelector = selector;
        break;
      }
    }
    
    if (fileInput) {
      sendLog(`✓ 找到上传元素: ${usedSelector}`, 'success');
      break;
    }
  }
  
  if (!fileInput) {
    // 输出详细的诊断信息
    sendLog('❌ 未找到可用的文件上传元素', 'error');
    sendLog('诊断信息:', 'warning');
    debugInfo.forEach(info => sendLog(`  ${info}`, 'warning'));
    
    // 检查是否有隐藏的文件输入
    const hiddenInputs = Array.from(allFileInputs).filter(input => input.offsetParent === null);
    if (hiddenInputs.length > 0) {
      sendLog(`  发现 ${hiddenInputs.length} 个隐藏的文件输入元素`, 'warning');
      // 尝试使用第一个隐藏的输入（如果有明确的accept属性）
      const imageInput = hiddenInputs.find(input => 
        input.accept && (input.accept.includes('image') || input.accept.includes('video'))
      );
      if (imageInput) {
        sendLog('  尝试使用隐藏的图片输入元素...', 'warning');
        fileInput = imageInput;
        usedSelector = '隐藏的input[accept包含image/video]';
      }
    }
  }
  
  if (!fileInput) {
    throw new Error('未找到图片上传按钮。\n提示：\n1. 请确认在正确的视频生成页面上 (如 https://grok.com/imagine)\n2. 页面可能需要手动点击进入视频生成模式\n3. 确保页面已完全加载\n4. 请在浏览器控制台运行诊断脚本获取详细信息');
  }
  
  // 将 dataUrl 转换为 File 对象
  const file = await dataUrlToFile(imageDataUrl, imageName);
  
  // 创建 DataTransfer 对象来模拟文件选择
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  
  // 触发 change 事件
  const event = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(event);
  
  sendLog('图片上传成功', 'success');
  
  // 等待图片加载和UI响应
  await sleep(2500);
}

// 填写提示词
async function fillPrompt(prompt) {
  sendLog('正在填写提示词...', 'info');
  
  // 查找提示词输入框的常见选择器
  const selectors = [
    'textarea[placeholder*="prompt" i]',
    'textarea[placeholder*="describe" i]',
    'input[placeholder*="prompt" i]',
    'textarea',
    '[contenteditable="true"]',
    '[data-testid*="prompt"]',
    '[aria-label*="prompt" i]',
  ];
  
  let promptInput = null;
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // 检查元素是否可见
      if (element.offsetParent !== null) {
        promptInput = element;
        sendLog(`找到提示词输入框: ${selector}`, 'info');
        break;
      }
    }
    if (promptInput) break;
  }
  
  if (!promptInput) {
    throw new Error('未找到提示词输入框');
  }
  
  // 清空并填入新的提示词
  if (promptInput.tagName === 'TEXTAREA' || promptInput.tagName === 'INPUT') {
    promptInput.value = '';
    promptInput.value = prompt;
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    promptInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (promptInput.contentEditable === 'true') {
    promptInput.textContent = '';
    promptInput.textContent = prompt;
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  sendLog('提示词填写成功', 'success');
  await sleep(1000);
}

// 点击生成按钮
async function clickGenerateButton() {
  sendLog('正在点击生成按钮...', 'info');
  
  let generateButton = null;
  
  // 首先尝试通过文本内容查找按钮（最可靠的方法）
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();
    if ((text.includes('generate') || text.includes('生成') || text.includes('create') || 
         text.includes('go') || text.includes('start')) && 
        button.offsetParent !== null && 
        !button.disabled) {
      generateButton = button;
      sendLog(`找到生成按钮（通过文本）: "${button.textContent.trim()}"`, 'info');
      break;
    }
  }
  
  // 如果文本查找失败，尝试使用 CSS 选择器
  if (!generateButton) {
    const selectors = [
      'button[aria-label*="generate" i]',
      'button[aria-label*="生成" i]',
      '[data-testid*="generate" i]',
      '[data-testid*="submit" i]',
      'button[type="submit"]',
      'button.btn-primary',
      'button.primary',
      '.generate-button',
      '#generate-btn',
      'button:not([disabled])[class*="button"]',
    ];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.offsetParent !== null && !element.disabled) {
            generateButton = element;
            sendLog(`找到生成按钮（通过选择器）: ${selector}`, 'info');
            break;
          }
        }
        if (generateButton) break;
      } catch (e) {
        // 忽略无效选择器的错误
        continue;
      }
    }
  }
  
  if (!generateButton) {
    // 最后的尝试：查找所有可见的按钮
    const allButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.offsetParent !== null && !btn.disabled
    );
    
    if (allButtons.length > 0) {
      // 选择最可能的主按钮（通常是最大的或位置最显眼的）
      generateButton = allButtons.reduce((prev, curr) => {
        const prevArea = prev.offsetWidth * prev.offsetHeight;
        const currArea = curr.offsetWidth * curr.offsetHeight;
        return currArea > prevArea ? curr : prev;
      });
      sendLog(`找到生成按钮（通过大小推断）: "${generateButton.textContent.trim()}"`, 'info');
    }
  }
  
  if (!generateButton) {
    throw new Error('未找到生成按钮。请确保在正确的页面上，并且页面已完全加载。');
  }
  
  // 点击按钮
  generateButton.click();
  sendLog(`已点击生成按钮: "${generateButton.textContent.trim()}"`, 'success');
  
  await sleep(2000);
}

// 等待视频生成完成
async function waitForVideoGeneration(existingVideoSrcs = []) {
  sendLog('等待视频生成...', 'info');
  
  const maxWaitTime = 300000; // 最多等待 5 分钟
  const checkInterval = 2000; // 每 2 秒检查一次
  const startTime = Date.now();
  let lastVideoSrc = null;
  let stableCount = 0; // 视频源稳定的次数
  let newVideoDetected = false;
  
  while (Date.now() - startTime < maxWaitTime) {
    // 查找所有视频元素
    const videoElements = document.querySelectorAll('video');
    let newVideoElement = null;
    
    // 查找新生成的视频（不在已存在列表中的）
    for (const videoElement of videoElements) {
      const currentSrc = videoElement.src || videoElement.currentSrc;
      
      // 检查是否是新的视频（不在已存在的列表中）
      if (currentSrc && !existingVideoSrcs.includes(currentSrc)) {
        newVideoElement = videoElement;
        if (!newVideoDetected) {
          newVideoDetected = true;
          sendLog('检测到新视频开始生成...', 'info');
        }
        break;
      }
    }
    
    // 如果没有找到新视频，使用最新的视频元素
    if (!newVideoElement && videoElements.length > 0) {
      newVideoElement = videoElements[videoElements.length - 1];
    }
    
    // 检查视频是否真正加载完成
    if (newVideoElement) {
      const currentSrc = newVideoElement.src || newVideoElement.currentSrc;
      
      // 检查视频是否有有效的源
      if (currentSrc && currentSrc.trim() !== '' && currentSrc !== 'about:blank') {
        // 检查视频是否已加载元数据
        if (newVideoElement.readyState >= 2) { // HAVE_CURRENT_DATA 或更高
          // 如果视频源发生变化，重置稳定计数
          if (currentSrc !== lastVideoSrc) {
            lastVideoSrc = currentSrc;
            stableCount = 0;
            sendLog(`检测到视频源，等待稳定...`, 'info');
            await sleep(2000);
            continue;
          }
          
          // 视频源稳定，增加计数
          stableCount++;
          
          // 视频源稳定至少 4 次检查（8秒），确保视频已完全生成
          if (stableCount >= 4) {
            // 再次确认视频可以播放
            try {
              if (newVideoElement.duration && newVideoElement.duration > 0) {
                sendLog(`✅ 视频生成完成！时长: ${newVideoElement.duration.toFixed(1)}秒`, 'success');
                await sleep(2000); // 额外等待2秒确保视频完全就绪
                
                // 最终验证：再次检查视频状态
                if (newVideoElement.readyState >= 3 && newVideoElement.duration > 0) {
                  // 返回视频信息
                  return {
                    videoElement: {
                      src: currentSrc,
                      duration: newVideoElement.duration,
                      ready: true,
                      readyState: newVideoElement.readyState
                    },
                    downloadButton: findDownloadButton() ? true : false,
                    videoUrl: currentSrc
                  };
                }
              }
            } catch (e) {
              // 如果无法获取时长，继续等待
              sendLog('视频元数据加载中...', 'info');
            }
          } else {
            sendLog(`视频加载中... (${stableCount}/4)`, 'info');
          }
        } else {
          sendLog(`视频加载状态: ${newVideoElement.readyState}，继续等待...`, 'info');
        }
      } else {
        sendLog('视频元素存在但源未就绪，继续等待...', 'info');
      }
    } else {
      sendLog('等待视频元素出现...', 'info');
    }
    
    // 检查是否有错误提示
    const errorElements = document.querySelectorAll('[class*="error"], [class*="failed"], [class*="fail"]');
    for (const element of errorElements) {
      const text = element.textContent.toLowerCase();
      if (element.offsetParent !== null && 
          (text.includes('error') || text.includes('失败') || text.includes('fail'))) {
        throw new Error('视频生成失败: ' + element.textContent.trim());
      }
    }
    
    // 检查是否有加载/生成中的提示
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="generating"], [class*="processing"]');
    let isGenerating = false;
    for (const element of loadingElements) {
      if (element.offsetParent !== null) {
        isGenerating = true;
        break;
      }
    }
    
    if (isGenerating && !newVideoElement) {
      sendLog('视频生成中，请稍候...', 'info');
    }
    
    await sleep(checkInterval);
  }
  
  throw new Error('视频生成超时（5分钟）');
}

// 下载视频（手动触发）
async function downloadVideo(imageName, index, savedVideoUrl = null) {
  sendLog('正在检查视频状态...', 'info');
  
  // 如果提供了保存的视频URL，直接使用它下载（最可靠的方式）
  if (savedVideoUrl && savedVideoUrl.trim() !== '' && savedVideoUrl !== 'about:blank') {
    sendLog(`使用保存的视频URL直接下载: ${savedVideoUrl.substring(0, 80)}...`, 'info');
    
    // 生成文件名，使用图片名称作为前缀（去掉扩展名）
    const baseName = imageName.replace(/\.[^/.]+$/, ''); // 移除扩展名
    const filename = `${baseName}_${index + 1}_${Date.now()}.mp4`;
    
    // 直接使用保存的URL发起下载请求
    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: savedVideoUrl,
      filename: filename
    });
    
    sendLog(`✓ 视频下载已开始: ${filename}`, 'success');
    await sleep(2000);
    return true;
  }
  
  // 只有在没有保存的URL时，才尝试从页面获取视频
  sendLog('未提供有效的视频URL，尝试从页面获取视频...', 'warning');
  
  const allVideos = Array.from(document.querySelectorAll('video'));
  
  if (allVideos.length === 0) {
    throw new Error('未找到视频元素，视频可能还未生成完成');
  }
  
  // 选择最新的视频（通常是最后一个）
  const videoElement = allVideos[allVideos.length - 1];
  const videoSrc = videoElement.src || videoElement.currentSrc;
  sendLog(`找到视频元素（共${allVideos.length}个，使用最新的）`, 'info');
  
  // 验证视频源
  if (!videoSrc || videoSrc.trim() === '' || videoSrc === 'about:blank') {
    throw new Error('视频源无效，视频可能还未生成完成');
  }
  
  // 检查视频是否已加载
  if (videoElement.readyState < 2) {
    throw new Error('视频还未加载完成，请稍后再试');
  }
  
  // 检查视频时长
  if (!videoElement.duration || videoElement.duration <= 0) {
    throw new Error('视频时长无效，视频可能还未生成完成');
  }
  
  sendLog(`视频验证通过：时长 ${videoElement.duration.toFixed(1)}秒，URL: ${videoSrc.substring(0, 50)}...`, 'info');
  
  // 生成文件名
  const baseName = imageName.replace(/\.[^/.]+$/, '');
  const filename = `${baseName}_${index + 1}_${Date.now()}.mp4`;
  
  // 通过 background script 下载
  chrome.runtime.sendMessage({
    action: 'downloadVideo',
    url: videoSrc,
    filename: filename
  });
  
  sendLog(`✓ 视频下载已开始: ${filename}`, 'success');
  await sleep(2000);
  return true;
}

// 查找下载按钮
function findDownloadButton() {
  // 首先尝试通过文本内容查找（最可靠）
  const buttons = document.querySelectorAll('button, a');
  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();
    if ((text.includes('download') || text.includes('下载') || 
         text.includes('save') || text.includes('保存')) &&
        button.offsetParent !== null) {
      return button;
    }
  }
  
  // 如果文本查找失败，尝试使用 CSS 选择器
  const selectors = [
    'a[download]',
    'a[href*=".mp4"]',
    'a[href*=".webm"]',
    'a[href*="video"]',
    '[aria-label*="download" i]',
    '[aria-label*="下载" i]',
    '[data-testid*="download" i]',
    '.download-button',
    '#download-btn',
    'button[aria-label*="download" i]',
  ];
  
  for (const selector of selectors) {
    try {
      const button = document.querySelector(selector);
      if (button && button.offsetParent !== null) {
        return button;
      }
    } catch (e) {
      // 忽略无效选择器的错误
      continue;
    }
  }
  
  return null;
}

// 工具函数：等待元素出现
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`等待元素超时: ${selector}`));
    }, timeout);
  });
}

// 工具函数：将 DataURL 转换为 File 对象
async function dataUrlToFile(dataUrl, filename) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

// 工具函数：延迟
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 工具函数：发送日志到 popup
function sendLog(message, level = 'info') {
  chrome.runtime.sendMessage({
    action: 'log',
    message: message,
    level: level
  });
}
