// Popup 主逻辑
class PopupController {
  constructor() {
    console.log('PopupController 构造函数开始');
    this.images = [];
    this.prompts = [];
    this.isPaused = false;
    this.isStopped = false;
    this.currentIndex = 0;
    this.readyVideos = []; // 待下载的视频列表（兼容旧代码）
    this.taskQueue = []; // 任务队列
    
    console.log('开始初始化元素...');
    this.initElements();
    console.log('开始绑定事件...');
    this.bindEvents();
    console.log('开始加载状态...');
    this.loadState();
    console.log('PopupController 初始化完成');
  }

  initElements() {
    // 输入元素
    this.imageInput = document.getElementById('imageInput');
    this.promptInput = document.getElementById('promptInput');
    this.promptTextarea = document.getElementById('promptTextarea');
    
    // 按钮元素
    this.selectImagesBtn = document.getElementById('selectImagesBtn');
    this.selectPromptBtn = document.getElementById('selectPromptBtn');
    this.clearPromptBtn = document.getElementById('clearPromptBtn');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.clearLogBtn = document.getElementById('clearLogBtn');
    
    // 显示区域
    this.statusText = document.getElementById('statusText');
    this.statusBox = document.getElementById('status');
    this.imageInfo = document.getElementById('imageInfo');
    this.imagePreview = document.getElementById('imagePreview');
    this.imagePreviewGrid = document.getElementById('imagePreviewGrid');
    this.promptInfo = document.getElementById('promptInfo');
    this.previewSection = document.getElementById('previewSection');
    this.previewList = document.getElementById('previewList');
    this.progressSection = document.getElementById('progressSection');
    this.progressBar = document.getElementById('progressBar');
    this.progressText = document.getElementById('progressText');
    this.progressDetails = document.getElementById('progressDetails');
    this.logContainer = document.getElementById('logContainer');
    this.downloadSection = document.getElementById('downloadSection');
    this.downloadList = document.getElementById('downloadList');
    this.taskQueueSection = document.getElementById('taskQueueSection');
    this.taskQueueList = document.getElementById('taskQueueList');
    
    // 检查关键元素是否存在
    const criticalElements = {
      imageInput: this.imageInput,
      selectImagesBtn: this.selectImagesBtn,
      promptTextarea: this.promptTextarea,
      startBtn: this.startBtn,
      logContainer: this.logContainer
    };
    
    const missingElements = [];
    for (const [name, element] of Object.entries(criticalElements)) {
      if (!element) {
        missingElements.push(name);
      }
    }
    
    if (missingElements.length > 0) {
      console.error('❌ 缺少关键元素:', missingElements.join(', '));
      console.error('这可能是因为 HTML 文件未正确加载或元素 ID 不匹配');
      // 不抛出错误，让其他部分继续运行
    }
    
    // 调试信息
    console.log('元素初始化完成');
    console.log('imageInput:', this.imageInput);
    console.log('selectImagesBtn:', this.selectImagesBtn);
    console.log('progressBar:', this.progressBar);
  }
  

  bindEvents() {
    // 检查元素是否存在
    if (!this.selectImagesBtn || !this.imageInput) {
      console.error('图片选择元素未找到', {
        selectImagesBtn: !!this.selectImagesBtn,
        imageInput: !!this.imageInput
      });
      // 延迟重试
      setTimeout(() => {
        console.log('重试绑定事件...');
        this.initElements();
        this.bindEvents();
      }, 200);
      return;
    }

    console.log('绑定图片选择按钮事件');
    
    // 先测试按钮是否可以点击
    this.selectImagesBtn.addEventListener('mousedown', () => {
      console.log('🖱️ 按钮 mousedown 事件');
    });
    
    this.selectImagesBtn.addEventListener('mouseup', () => {
      console.log('🖱️ 按钮 mouseup 事件');
    });
    
    this.selectImagesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ 点击选择图片按钮事件触发');
      
      if (!this.imageInput) {
        console.error('❌ 无法找到 imageInput 元素');
        this.log('文件选择器未找到，请刷新页面', 'error');
        return;
      }
      
      try {
        console.log('🔄 触发文件选择器...');
        this.imageInput.click();
        console.log('✅ 文件选择器已触发');
      } catch (error) {
        console.error('❌ 触发文件选择器失败:', error);
        this.log(`文件选择器错误: ${error.message}`, 'error');
      }
    });
    
    this.selectPromptBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.promptInput) {
        this.promptInput.click();
      }
    });
    
    this.clearPromptBtn.addEventListener('click', () => this.clearPrompts());
    this.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
    this.promptInput.addEventListener('change', (e) => this.handlePromptSelect(e));
    this.promptTextarea.addEventListener('input', () => this.handlePromptTextChange());
    this.startBtn.addEventListener('click', () => this.startProcessing());
    this.pauseBtn.addEventListener('click', () => this.pauseProcessing());
    this.resumeBtn.addEventListener('click', () => this.resumeProcessing());
    this.stopBtn.addEventListener('click', () => this.stopProcessing());
    this.clearLogBtn.addEventListener('click', () => this.clearLog());
    
    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
    });
    
    console.log('事件绑定完成');
  }

  async handleImageSelect(event) {
    console.log('handleImageSelect 被调用', event);
    const files = Array.from(event.target.files);
    console.log('选择的文件数量:', files.length);
    
    if (files.length === 0) {
      console.log('没有选择文件');
      return;
    }

    try {
      this.images = await Promise.all(
        files.map(async (file) => {
          console.log('处理文件:', file.name);
          return {
            name: file.name,
            dataUrl: await this.fileToDataUrl(file),
            file: file
          };
        })
      );

      this.imageInfo.textContent = `已选择 ${this.images.length} 张图片`;
      this.log(`已选择 ${this.images.length} 张图片`, 'info');
      this.updateImagePreview();
      this.updatePreview();
      this.checkReadyState();
    } catch (error) {
      console.error('处理图片失败:', error);
      this.log(`处理图片失败: ${error.message}`, 'error');
    }
  }

  updateImagePreview() {
    if (this.images.length === 0) {
      this.imagePreview.style.display = 'none';
      return;
    }

    this.imagePreview.style.display = 'block';
    this.imagePreviewGrid.innerHTML = '';

    this.images.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.innerHTML = `
        <span class="image-index">${index + 1}</span>
        <img src="${image.dataUrl}" alt="${image.name}">
        <div class="image-name">${image.name}</div>
        <button class="remove-btn" data-index="${index}" title="移除">×</button>
      `;
      
      // 添加移除按钮事件
      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeImage(index);
      });
      
      this.imagePreviewGrid.appendChild(item);
    });
  }

  removeImage(index) {
    this.images.splice(index, 1);
    this.imageInfo.textContent = this.images.length > 0 
      ? `已选择 ${this.images.length} 张图片` 
      : '未选择图片';
    this.log(`已移除图片，剩余 ${this.images.length} 张`, 'info');
    this.updateImagePreview();
    this.updatePreview();
    this.checkReadyState();
  }

  async handlePromptSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    
    // 显示到文本域
    this.promptTextarea.value = text.trim();
    
    // 解析提示词
    this.parsePrompts();
    
    this.log(`已导入 ${this.prompts.length} 条提示词`, 'info');
  }

  handlePromptTextChange() {
    // 实时解析文本域内容
    this.parsePrompts();
  }

  parsePrompts() {
    // 从文本域解析提示词
    const text = this.promptTextarea.value;
    this.prompts = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // 更新信息显示
    if (this.prompts.length > 0) {
      this.promptInfo.textContent = `已输入 ${this.prompts.length} 条提示词`;
      this.promptInfo.style.color = '#4caf50';
    } else {
      this.promptInfo.textContent = '未输入提示词';
      this.promptInfo.style.color = '#666';
    }

    this.updatePreview();
    this.checkReadyState();
  }

  clearPrompts() {
    this.promptTextarea.value = '';
    this.prompts = [];
    this.promptInfo.textContent = '未输入提示词';
    this.promptInfo.style.color = '#666';
    this.log('已清空提示词', 'info');
    this.updatePreview();
    this.checkReadyState();
  }

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  updatePreview() {
    if (this.images.length === 0 || this.prompts.length === 0) {
      this.previewSection.style.display = 'none';
      return;
    }

    this.previewSection.style.display = 'block';
    this.previewList.innerHTML = '';

    const count = Math.min(this.images.length, this.prompts.length);
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <img src="${this.images[i].dataUrl}" alt="${this.images[i].name}">
        <div class="preview-item-content">
          <div class="preview-item-title">${i + 1}. ${this.images[i].name}</div>
          <div class="preview-item-prompt">${this.prompts[i]}</div>
        </div>
      `;
      this.previewList.appendChild(item);
    }

    if (this.images.length !== this.prompts.length) {
      this.log(`警告：图片数量(${this.images.length})和提示词数量(${this.prompts.length})不匹配`, 'warning');
    }
  }

  checkReadyState() {
    if (this.images.length > 0 && this.prompts.length > 0) {
      this.startBtn.disabled = false;
      this.updateStatus('准备就绪，可以开始处理', 'success');
      
      const count = Math.min(this.images.length, this.prompts.length);
      this.statusText.textContent = `准备生成 ${count} 个视频`;
    } else {
      this.startBtn.disabled = true;
      this.updateStatus('请选择图片和提示词文件', 'info');
    }
  }

  async startProcessing() {
    this.isStopped = false;
    this.isPaused = false;
    this.currentIndex = 0;

    // 创建任务队列
    const totalCount = Math.min(this.images.length, this.prompts.length);
    this.taskQueue = [];
    
    for (let i = 0; i < totalCount; i++) {
      this.taskQueue.push({
        index: i,
        imageName: this.images[i].name,
        prompt: this.prompts[i],
        imageDataUrl: this.images[i].dataUrl,
        status: 'pending', // pending, processing, generating, completed, error
        videoUrl: null,
        videoInfo: null,
        error: null,
        timestamp: Date.now()
      });
    }

    // 更新 UI
    this.startBtn.style.display = 'none';
    this.pauseBtn.style.display = 'inline-block';
    this.stopBtn.style.display = 'inline-block';
    this.progressSection.style.display = 'block';
    this.taskQueueSection.style.display = 'block';
    this.updateTaskQueue();

    this.log(`开始批量处理 ${totalCount} 个任务...`, 'info');
    this.updateStatus(`正在处理中... (0/${totalCount})`, 'info');

    // 保存状态
    await this.saveState();

    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('grok.com')) {
      this.log('错误：请在 grok.com 网站上使用此扩展', 'error');
      this.log('提示：请先访问 https://grok.com/ 并确保已登录', 'warning');
      this.updateStatus('错误：请在 grok.com 网站上使用此扩展', 'error');
      this.resetButtons();
      return;
    }

    // 检查 content script 是否可用
    try {
      await this.ensureContentScript(tab.id);
      this.log('已连接到页面，准备开始处理', 'success');
    } catch (error) {
      this.log(`连接失败: ${error.message}`, 'error');
      this.log('请刷新 grok.com 页面后重试', 'warning');
      this.updateStatus('连接失败，请刷新页面后重试', 'error');
      this.resetButtons();
      return;
    }

    // 发送任务到 content script
    this.processNextItem();
  }

  async processNextItem() {
    if (this.isStopped) {
      this.log('处理已停止', 'warning');
      this.resetButtons();
      return;
    }

    if (this.isPaused) {
      this.log('处理已暂停', 'warning');
      return;
    }

    const totalCount = Math.min(this.images.length, this.prompts.length);
    
    if (this.currentIndex >= totalCount) {
      const completed = this.taskQueue.filter(t => t.status === 'completed').length;
      const total = this.taskQueue.length;
      this.log(`所有任务处理完成！(${completed}/${total} 成功)`, 'success');
      this.updateStatus(`所有任务处理完成！(${completed}/${total} 成功)`, 'success');
      this.updateProgress(total, total);
      this.resetButtons();
      return;
    }

    const task = this.taskQueue[this.currentIndex];
    if (!task) {
      this.log('任务队列错误', 'error');
      return;
    }

    // 更新任务状态为处理中
    task.status = 'processing';
    this.updateTaskQueue();
    
    this.updateProgress(this.currentIndex, totalCount);
    this.log(`处理第 ${this.currentIndex + 1}/${totalCount} 项: ${task.imageName}`, 'info');

    // 发送到 content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      // 发送消息（带超时）
      const messagePromise = chrome.tabs.sendMessage(tab.id, {
        action: 'processItem',
        data: {
          image: task.imageDataUrl,
          imageName: task.imageName,
          prompt: task.prompt,
          index: this.currentIndex
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('消息发送超时')), 10000)
      );
      
      await Promise.race([messagePromise, timeoutPromise]);
    } catch (error) {
      if (error.message.includes('Receiving end does not exist') || 
          error.message.includes('Could not establish connection')) {
        this.log(`通信错误：${error.message}`, 'error');
        this.log('尝试重新连接...', 'info');
        
        // 尝试重新注入脚本
        try {
          await this.ensureContentScript(tab.id);
          // 重试发送消息
          await chrome.tabs.sendMessage(tab.id, {
            action: 'processItem',
            data: {
              image: task.imageDataUrl,
              imageName: task.imageName,
              prompt: task.prompt,
              index: this.currentIndex
            }
          });
        } catch (retryError) {
          this.log(`重试失败：${retryError.message}`, 'error');
          this.log('请刷新 grok.com 页面后继续', 'warning');
          this.currentIndex++;
          setTimeout(() => this.processNextItem(), 5000);
        }
      } else {
        this.log(`错误：${error.message}`, 'error');
        this.currentIndex++;
        setTimeout(() => this.processNextItem(), 3000);
      }
    }
  }

  pauseProcessing() {
    this.isPaused = true;
    this.pauseBtn.style.display = 'none';
    this.resumeBtn.style.display = 'inline-block';
    this.log('处理已暂停', 'warning');
    this.updateStatus('处理已暂停', 'warning');
  }

  resumeProcessing() {
    this.isPaused = false;
    this.pauseBtn.style.display = 'inline-block';
    this.resumeBtn.style.display = 'none';
    this.log('继续处理...', 'info');
    this.updateStatus('继续处理...', 'info');
    this.processNextItem();
  }

  stopProcessing() {
    this.isStopped = true;
    this.log('处理已停止', 'warning');
    this.updateStatus('处理已停止', 'warning');
    
    // 更新所有进行中的任务状态
    this.taskQueue.forEach(task => {
      if (task.status === 'processing' || task.status === 'generating') {
        task.status = 'pending';
      }
    });
    this.updateTaskQueue();
    
    this.resetButtons();
  }

  resetButtons() {
    this.startBtn.style.display = 'inline-block';
    this.pauseBtn.style.display = 'none';
    this.resumeBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    
    // 如果所有任务都完成或失败，保持任务队列显示
    if (this.taskQueue.length > 0) {
      const allDone = this.taskQueue.every(t => 
        t.status === 'completed' || t.status === 'error'
      );
      if (allDone) {
        this.taskQueueSection.style.display = 'block';
      }
    }
  }

  updateProgress(current, total) {
    const completed = this.taskQueue.filter(t => t.status === 'completed' || t.status === 'error').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.progressBar.style.width = `${percentage}%`;
    this.progressBar.textContent = `${percentage}%`;
    this.progressText.textContent = `${completed} / ${total}`;
    
    const currentTask = this.taskQueue[current];
    if (currentTask) {
      this.progressDetails.textContent = `正在处理: ${currentTask.imageName}`;
    } else {
      this.progressDetails.textContent = `已完成: ${completed} / ${total}`;
    }
    
    // 更新状态文本
    if (completed === total) {
      this.updateStatus(`所有任务完成！(${completed}/${total})`, 'success');
    } else {
      this.updateStatus(`正在处理中... (${completed}/${total})`, 'info');
    }
  }

  handleMessage(message) {
    switch (message.action) {
      case 'videoReady':
        this.handleVideoReady(message);
        break;
        
      case 'itemComplete':
        this.log(`✓ 第 ${message.index + 1} 项处理完成`, 'success');
        if (!message.videoReady) {
          // 如果没有视频就绪，继续处理下一个
          this.currentIndex++;
          setTimeout(() => this.processNextItem(), 2000);
        }
        break;
      
      case 'itemError':
        // 更新任务状态为错误
        const errorTask = this.taskQueue[message.index];
        if (errorTask) {
          errorTask.status = 'error';
          errorTask.error = message.error;
          this.updateTaskQueue();
        }
        this.log(`✗ 第 ${message.index + 1} 项处理失败: ${message.error}`, 'error');
        this.currentIndex++;
        setTimeout(() => this.processNextItem(), 3000);
        break;
      
      case 'log':
        this.log(message.message, message.level || 'info');
        break;
    }
  }

  handleVideoReady(message) {
    const { index, imageName, videoInfo } = message;
    
    // 更新任务队列中的任务状态
    const task = this.taskQueue[index];
    if (task) {
      task.status = 'completed';
      task.videoUrl = videoInfo.videoUrl || (videoInfo.videoElement && videoInfo.videoElement.src) || null;
      task.videoInfo = videoInfo;
      this.updateTaskQueue();
    }
    
    // 兼容旧代码：添加到待下载列表
    const videoItem = {
      index: index,
      imageName: imageName,
      videoInfo: videoInfo,
      videoUrl: videoInfo.videoUrl || (videoInfo.videoElement && videoInfo.videoElement.src) || null,
      status: 'ready',
      timestamp: Date.now()
    };
    this.readyVideos.push(videoItem);
    
    this.log(`📹 第 ${index + 1} 个视频已生成，可以下载`, 'success');
    
    // 继续处理下一个
    this.currentIndex++;
    setTimeout(() => this.processNextItem(), 2000);
  }

  updateTaskQueue() {
    if (this.taskQueue.length === 0) {
      this.taskQueueSection.style.display = 'none';
      return;
    }

    this.taskQueueSection.style.display = 'block';
    this.taskQueueList.innerHTML = '';

    this.taskQueue.forEach((task, idx) => {
      const item = document.createElement('div');
      item.className = 'task-item';
      
      // 状态文本和样式
      let statusText = '';
      let statusClass = '';
      switch (task.status) {
        case 'pending':
          statusText = '⏳ 等待中';
          statusClass = 'pending';
          break;
        case 'processing':
          statusText = '🔄 处理中';
          statusClass = 'processing';
          break;
        case 'generating':
          statusText = '🎬 生成中';
          statusClass = 'generating';
          break;
        case 'completed':
          if (task.downloadStatus === 'downloading') {
            statusText = '⏬ 下载中...';
            statusClass = 'processing';
          } else if (task.downloadStatus === 'downloaded') {
            statusText = '✅ 已下载';
            statusClass = 'completed';
          } else {
            statusText = '✅ 已完成';
            statusClass = 'completed';
          }
          break;
        case 'error':
          statusText = '❌ 失败';
          statusClass = 'error';
          break;
        default:
          statusText = '⏳ 等待中';
          statusClass = 'pending';
      }
      
      item.innerHTML = `
        <div class="task-item-info">
          <div class="task-item-header">
            <span class="task-item-number">#${idx + 1}</span>
            <span class="task-item-name">${task.imageName}</span>
            <span class="task-item-status ${statusClass}">${statusText}</span>
          </div>
          <div class="task-item-prompt">${task.prompt}</div>
          ${task.error ? `<div style="font-size: 10px; color: #f44336; margin-top: 4px;">错误: ${task.error}</div>` : ''}
        </div>
        <div class="task-item-actions">
          ${task.status === 'completed' && !task.downloadStatus ? `
            <button class="task-download-btn" data-index="${idx}">
              下载
            </button>
          ` : ''}
          ${task.status === 'completed' && task.downloadStatus === 'downloading' ? `
            <button class="task-download-btn" disabled>
              下载中...
            </button>
          ` : ''}
          ${task.status === 'completed' && task.downloadStatus === 'downloaded' ? `
            <button class="task-download-btn" disabled style="background: #4caf50;">
              ✓ 已下载
            </button>
          ` : ''}
          ${task.status === 'error' ? `
            <button class="task-download-btn" disabled style="background: #ccc;">
              重试
            </button>
          ` : ''}
        </div>
      `;
      
      // 添加下载按钮事件
      if (task.status === 'completed') {
        const downloadBtn = item.querySelector('.task-download-btn');
        downloadBtn.addEventListener('click', () => this.downloadTaskVideo(idx));
      }
      
      this.taskQueueList.appendChild(item);
    });
  }

  updateDownloadList() {
    // 保留兼容旧代码，但现在主要使用任务队列
    if (this.readyVideos.length === 0) {
      this.downloadSection.style.display = 'none';
      return;
    }

    this.downloadSection.style.display = 'none'; // 隐藏旧的下载列表
  }

  async downloadTaskVideo(taskIndex) {
    const task = this.taskQueue[taskIndex];
    if (!task || task.status !== 'completed' || !task.videoUrl) {
      this.log('任务未完成或视频URL无效', 'error');
      return;
    }

    // 更新任务状态为下载中（添加新状态）
    const originalStatus = task.status;
    task.downloadStatus = 'downloading';
    this.updateTaskQueue();
    this.log(`开始下载: ${task.imageName}`, 'info');

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('grok.com')) {
        throw new Error('请在 grok.com 页面上进行下载');
      }

      // 发送下载请求到 content script，传递视频URL
      await chrome.tabs.sendMessage(tab.id, {
        action: 'downloadVideoNow',
        imageName: task.imageName,
        index: task.index,
        videoUrl: task.videoUrl
      });

      // 更新任务状态为已下载
      task.downloadStatus = 'downloaded';
      this.updateTaskQueue();
      this.log(`✓ ${task.imageName} 下载完成`, 'success');
      
    } catch (error) {
      // 恢复状态
      task.downloadStatus = null;
      this.updateTaskQueue();
      this.log(`下载失败: ${error.message}`, 'error');
    }
  }

  // 兼容旧代码
  async downloadVideo(listIndex) {
    const video = this.readyVideos[listIndex];
    if (!video || video.status !== 'ready') return;

    // 更新状态为下载中
    video.status = 'downloading';
    this.updateDownloadList();
    this.log(`开始下载: ${video.imageName}`, 'info');

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('grok.com')) {
        throw new Error('请在 grok.com 页面上进行下载');
      }

      // 发送下载请求到 content script，传递视频URL
      await chrome.tabs.sendMessage(tab.id, {
        action: 'downloadVideoNow',
        imageName: video.imageName,
        index: video.index,
        videoUrl: video.videoUrl
      });

      // 更新状态为已下载
      video.status = 'downloaded';
      this.updateDownloadList();
      this.log(`✓ ${video.imageName} 下载完成`, 'success');
      
    } catch (error) {
      // 恢复为就绪状态
      video.status = 'ready';
      this.updateDownloadList();
      this.log(`下载失败: ${error.message}`, 'error');
    }
  }

  updateStatus(text, type = 'info') {
    this.statusText.textContent = text;
    this.statusBox.className = 'status-box ' + type;
  }

  log(message, level = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour12: false });
    
    entry.innerHTML = `
      <span class="time">[${time}]</span>
      <span class="message">${message}</span>
    `;
    
    this.logContainer.appendChild(entry);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  clearLog() {
    this.logContainer.innerHTML = '';
  }

  // 确保 content script 已注入
  async ensureContentScript(tabId) {
    try {
      // 先尝试 ping content script（带超时）
      const pingPromise = chrome.tabs.sendMessage(tabId, { action: 'ping' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('ping 超时')), 2000)
      );
      
      await Promise.race([pingPromise, timeoutPromise]);
      return; // content script 已存在
    } catch (error) {
      // content script 不存在，尝试注入
      this.log('检测到脚本未加载，正在注入...', 'info');
      
      try {
        // 使用 chrome.scripting API 注入脚本
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/content.js']
        });
        
        // 等待脚本加载并初始化
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 再次尝试 ping，最多重试 3 次
        let retries = 3;
        while (retries > 0) {
          try {
            const pingPromise = chrome.tabs.sendMessage(tabId, { action: 'ping' });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('ping 超时')), 2000)
            );
            
            await Promise.race([pingPromise, timeoutPromise]);
            this.log('脚本注入成功', 'success');
            return;
          } catch (e) {
            retries--;
            if (retries > 0) {
              this.log(`重试连接中... (剩余 ${retries} 次)`, 'info');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        throw new Error('脚本注入后仍无法建立连接');
      } catch (injectError) {
        if (injectError.message.includes('Cannot access')) {
          throw new Error('无法访问页面。请确保：1) 在 grok.com 页面上 2) 页面已完全加载 3) 刷新页面后重试');
        }
        throw new Error(`注入失败: ${injectError.message}。请刷新 grok.com 页面后重试`);
      }
    }
  }

  async saveState() {
    await chrome.storage.local.set({
      images: this.images,
      prompts: this.prompts,
      promptText: this.promptTextarea.value,
      currentIndex: this.currentIndex,
      isPaused: this.isPaused
    });
  }

  async loadState() {
    const data = await chrome.storage.local.get([
      'images', 'prompts', 'promptText', 'currentIndex', 'isPaused'
    ]);
    
    if (data.images && data.images.length > 0) {
      this.images = data.images;
      this.imageInfo.textContent = `已选择 ${this.images.length} 张图片`;
    }
    
    if (data.promptText) {
      // 恢复文本域内容
      this.promptTextarea.value = data.promptText;
      this.parsePrompts();
    } else if (data.prompts && data.prompts.length > 0) {
      // 兼容旧版本：从数组恢复
      this.prompts = data.prompts;
      this.promptTextarea.value = this.prompts.join('\n');
      this.promptInfo.textContent = `已输入 ${this.prompts.length} 条提示词`;
      this.promptInfo.style.color = '#4caf50';
    }
    
    if (this.images.length > 0 && this.prompts.length > 0) {
      this.updatePreview();
      this.checkReadyState();
    }
  }
}

// 初始化
function initPopup() {
  console.log('开始初始化 PopupController');
  console.log('document.readyState:', document.readyState);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded 事件触发');
      setTimeout(() => {
        new PopupController();
      }, 100);
    });
  } else {
    // DOM 已经加载完成（可能在 iframe 中）
    console.log('DOM 已加载，立即初始化');
    setTimeout(() => {
      new PopupController();
    }, 100);
  }
}

// 立即初始化（如果在 iframe 中，DOM 可能已经加载完成）
initPopup();
