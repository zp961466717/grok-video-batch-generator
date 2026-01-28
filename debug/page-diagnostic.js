// Grok.com 页面诊断工具
// 在 grok.com/imagine 页面的浏览器控制台运行此脚本

console.log('🔍 开始诊断 Grok Imagine 页面元素...\n');

// 1. 查找所有文件输入元素
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📁 查找文件输入元素 (input[type="file"])');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const fileInputs = document.querySelectorAll('input[type="file"]');
console.log(`找到 ${fileInputs.length} 个文件输入元素:\n`);

fileInputs.forEach((input, index) => {
  const isVisible = input.offsetParent !== null;
  const isDisabled = input.disabled;
  const accept = input.accept || '未指定';
  const id = input.id || '无';
  const name = input.name || '无';
  const className = input.className || '无';
  const dataTestId = input.getAttribute('data-testid') || '无';
  const ariaLabel = input.getAttribute('aria-label') || '无';
  
  console.log(`\n【文件输入 #${index + 1}】`);
  console.log(`  可见性: ${isVisible ? '✅ 可见' : '❌ 隐藏'}`);
  console.log(`  禁用状态: ${isDisabled ? '❌ 禁用' : '✅ 启用'}`);
  console.log(`  accept: ${accept}`);
  console.log(`  id: ${id}`);
  console.log(`  name: ${name}`);
  console.log(`  class: ${className}`);
  console.log(`  data-testid: ${dataTestId}`);
  console.log(`  aria-label: ${ariaLabel}`);
  
  // 检查父元素
  const parent = input.parentElement;
  if (parent) {
    console.log(`  父元素: <${parent.tagName.toLowerCase()}> class="${parent.className}"`);
  }
  
  // 推荐的选择器
  let selector = 'input[type="file"]';
  if (id) selector = `#${id}`;
  else if (dataTestId) selector = `input[data-testid="${dataTestId}"]`;
  else if (accept.includes('image')) selector = 'input[type="file"][accept*="image"]';
  
  console.log(`  ✨ 推荐选择器: ${selector}`);
});

// 2. 查找所有 textarea 元素（提示词输入）
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 查找文本输入元素 (textarea)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const textareas = document.querySelectorAll('textarea');
console.log(`找到 ${textareas.length} 个 textarea 元素:\n`);

textareas.forEach((textarea, index) => {
  const isVisible = textarea.offsetParent !== null;
  const placeholder = textarea.placeholder || '无';
  const id = textarea.id || '无';
  const name = textarea.name || '无';
  const className = textarea.className || '无';
  
  console.log(`\n【Textarea #${index + 1}】`);
  console.log(`  可见性: ${isVisible ? '✅ 可见' : '❌ 隐藏'}`);
  console.log(`  placeholder: ${placeholder}`);
  console.log(`  id: ${id}`);
  console.log(`  name: ${name}`);
  console.log(`  class: ${className}`);
});

// 3. 查找 contenteditable 元素
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✏️ 查找可编辑元素 ([contenteditable])');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const editables = document.querySelectorAll('[contenteditable="true"]');
console.log(`找到 ${editables.length} 个可编辑元素:\n`);

editables.forEach((el, index) => {
  const isVisible = el.offsetParent !== null;
  const tagName = el.tagName.toLowerCase();
  const id = el.id || '无';
  const className = el.className || '无';
  
  console.log(`\n【可编辑元素 #${index + 1}】`);
  console.log(`  标签: <${tagName}>`);
  console.log(`  可见性: ${isVisible ? '✅ 可见' : '❌ 隐藏'}`);
  console.log(`  id: ${id}`);
  console.log(`  class: ${className}`);
});

// 4. 查找按钮（特别是生成按钮）
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔘 查找可见按钮 (button)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const buttons = Array.from(document.querySelectorAll('button')).filter(btn => btn.offsetParent !== null);
console.log(`找到 ${buttons.length} 个可见按钮:\n`);

buttons.slice(0, 10).forEach((btn, index) => {
  const text = btn.textContent.trim().substring(0, 30);
  const ariaLabel = btn.getAttribute('aria-label') || '无';
  const className = btn.className.substring(0, 50) || '无';
  const type = btn.type || '无';
  
  console.log(`\n【按钮 #${index + 1}】`);
  console.log(`  文本: "${text}"`);
  console.log(`  aria-label: ${ariaLabel}`);
  console.log(`  type: ${type}`);
  console.log(`  class: ${className}`);
});

if (buttons.length > 10) {
  console.log(`\n... 还有 ${buttons.length - 10} 个按钮未显示`);
}

// 5. 查找可能的模式切换按钮（图片/视频切换）
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎬 查找模式切换按钮');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const modeButtons = Array.from(document.querySelectorAll('button, [role="tab"]')).filter(el => {
  const text = el.textContent.toLowerCase();
  return text.includes('video') || text.includes('image') || 
         text.includes('视频') || text.includes('图片') ||
         text.includes('imagine');
});

console.log(`找到 ${modeButtons.length} 个可能的模式按钮:\n`);

modeButtons.forEach((btn, index) => {
  const text = btn.textContent.trim();
  const isVisible = btn.offsetParent !== null;
  const role = btn.getAttribute('role') || '无';
  const ariaSelected = btn.getAttribute('aria-selected') || '无';
  
  console.log(`\n【模式按钮 #${index + 1}】`);
  console.log(`  文本: "${text}"`);
  console.log(`  可见性: ${isVisible ? '✅ 可见' : '❌ 隐藏'}`);
  console.log(`  role: ${role}`);
  console.log(`  aria-selected: ${ariaSelected}`);
});

// 6. 页面 URL 和状态
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🌐 页面信息');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`URL: ${window.location.href}`);
console.log(`标题: ${document.title}`);

// 7. 总结建议
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 诊断建议');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (fileInputs.length === 0) {
  console.log('⚠️ 未找到任何文件输入元素！');
  console.log('   可能原因：');
  console.log('   1. 需要先登录到 Grok/X 账号');
  console.log('   2. 需要点击某个按钮进入视频生成模式');
  console.log('   3. 页面还在加载中，请等待几秒后重新运行此脚本');
  console.log('   4. Grok 更新了页面结构，不再使用传统的 input[type="file"]');
} else {
  const visibleInputs = Array.from(fileInputs).filter(input => input.offsetParent !== null);
  if (visibleInputs.length === 0) {
    console.log('⚠️ 找到文件输入元素，但都是隐藏的');
    console.log('   这是正常的，扩展应该能够触发隐藏的输入元素');
  } else {
    console.log('✅ 找到可见的文件输入元素，扩展应该可以正常工作');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 诊断完成');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n请将以上信息截图或复制，以便开发者更新扩展的选择器\n');
