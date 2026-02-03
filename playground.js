// ==================== DOM ELEMENTS ====================
const htmlCode = document.getElementById('htmlCode');
const cssCode = document.getElementById('cssCode');
const jsCode = document.getElementById('jsCode');
const preview = document.getElementById('preview');
const previewWrapper = document.getElementById('previewWrapper');
const runBtn = document.getElementById('runBtn');
const reloadBtn = document.getElementById('reloadBtn');
const clearBtn = document.getElementById('clearBtn');
const autoRunCheck = document.getElementById('autoRunCheck');
const consoleToggle = document.getElementById('consoleToggle');
const consolePanel = document.getElementById('consolePanel');
const consoleOutput = document.getElementById('consoleOutput');
const consoleClearBtn = document.getElementById('consoleClearBtn');
const clearModal = document.getElementById('clearModal');
const confirmClear = document.getElementById('confirmClear');
const cancelClear = document.getElementById('cancelClear');
const tooltip = document.getElementById('tooltip');
const layoutToggleBtn = document.getElementById('layoutToggleBtn');
const editorContainer = document.querySelector('.editor-container');
const dragHandle = document.getElementById('dragHandle');
const editorsPanel = document.getElementById('editorsPanel');
const navContainer = document.getElementById('navContainer');
const collapseNavBtn = document.getElementById('collapseNavBtn');
const playgroundContainer = document.getElementById('playgroundContainer');
const controlSidebar = document.getElementById('controlSidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');

// Status elements
const htmlStatus = document.getElementById('htmlStatus');
const cssStatus = document.getElementById('cssStatus');
const jsStatus = document.getElementById('jsStatus');
const previewStatus = document.getElementById('previewStatus');

// Error elements
const jsError = document.getElementById('jsError');

// Device buttons
const deviceBtns = document.querySelectorAll('.device-btn');
const customSizeModal = document.getElementById('customSizeModal');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const confirmCustomSize = document.getElementById('confirmCustomSize');
const cancelCustomSize = document.getElementById('cancelCustomSize');

let autoRunTimeout = null;
let isResizing = false;
let currentDevice = 'desktop';

// Font sizes for each editor
const fontSizes = {
    html: 14,
    css: 14,
    js: 14
};

// ==================== TAB SWITCHING ====================
document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Remove active from all tabs and contents
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.editor-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${tabName}-editor`).classList.add('active');
        
        // Focus on the active editor
        document.getElementById(`${tabName}Code`).focus();
        
        notify(`สลับไปยังแท็บ ${tabName.toUpperCase()}`, 'info', 1500);
    });
});

// ==================== RUN CODE ====================
function runCode() {
    const html = htmlCode.value;
    const css = `<style>${cssCode.value}</style>`;
    const js = jsCode.value;

    // Clear previous errors
    jsError.classList.remove('visible');
    jsError.textContent = '';

    // Update status
    updateStatus(previewStatus, 'กำลังรัน...', 'warning');

    // Create preview content with console capture
    const previewContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${css}
        </head>
        <body>
            ${html}
            <script>
                // Console capture
                (function() {
                    const originalLog = console.log;
                    const originalError = console.error;
                    const originalWarn = console.warn;
                    const originalInfo = console.info;

                    function sendToParent(type, args) {
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: type,
                                message: Array.from(args).map(arg => {
                                    if (typeof arg === 'object') {
                                        try {
                                            return JSON.stringify(arg, null, 2);
                                        } catch (e) {
                                            return String(arg);
                                        }
                                    }
                                    return String(arg);
                                }).join(' ')
                            }, '*');
                        } catch (e) {
                            // Ignore errors
                        }
                    }

                    console.log = function(...args) {
                        sendToParent('log', args);
                        originalLog.apply(console, args);
                    };

                    console.error = function(...args) {
                        sendToParent('error', args);
                        originalError.apply(console, args);
                    };

                    console.warn = function(...args) {
                        sendToParent('warn', args);
                        originalWarn.apply(console, args);
                    };

                    console.info = function(...args) {
                        sendToParent('info', args);
                        originalInfo.apply(console, args);
                    };

                    // Catch runtime errors
                    window.addEventListener('error', function(e) {
                        sendToParent('error', ['Error: ' + e.message + ' (Line: ' + e.lineno + ')']);
                    });

                    // Signal successful load
                    window.addEventListener('load', function() {
                        window.parent.postMessage({ type: 'loaded' }, '*');
                    });
                })();

                // User code
                try {
                    ${js}
                } catch (error) {
                    console.error('JavaScript Error: ' + error.message);
                    window.parent.postMessage({
                        type: 'error',
                        message: error.message,
                        line: error.lineNumber || 'Unknown'
                    }, '*');
                }
            <\/script>
        </body>
        </html>
    `;

    preview.srcdoc = previewContent;
    
    // Animate run button
    runBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        runBtn.style.transform = '';
    }, 100);

    notify('รันโค้ดสำเร็จ!', 'success', 2000);
}

// ==================== MESSAGE LISTENER ====================
window.addEventListener('message', (event) => {
    if (event.data.type === 'console') {
        addConsoleLog(event.data.level, event.data.message);
    } else if (event.data.type === 'error') {
        showJSError(event.data.message);
        updateStatus(jsStatus, 'ข้อผิดพลาด', 'error');
    } else if (event.data.type === 'loaded') {
        updateStatus(previewStatus, 'พร้อม', 'success');
    }
});

// ==================== CONSOLE FUNCTIONS ====================
function addConsoleLog(level, message) {
    // Remove empty state
    const emptyState = consoleOutput.querySelector('.console-empty');
    if (emptyState) {
        emptyState.remove();
    }

    const logEntry = document.createElement('div');
    logEntry.className = `console-log ${level}`;
    logEntry.textContent = `[${level.toUpperCase()}] ${message}`;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Auto-show console if not visible
    if (!consoleToggle.checked && level === 'error') {
        consoleToggle.checked = true;
        consolePanel.classList.add('visible');
        notify('เปิดคอนโซล: พบข้อผิดพลาด', 'warning', 2000);
    }
}

function showJSError(message) {
    jsError.textContent = `❌ ${message}`;
    jsError.classList.add('visible');
}

function checkJSErrors() {
    try {
        new Function(jsCode.value);
        jsError.classList.remove('visible');
        jsError.textContent = '';
        updateStatus(jsStatus, 'พร้อม', 'success');
    } catch (error) {
        showJSError(error.message);
        updateStatus(jsStatus, 'ข้อผิดพลาด', 'error');
    }
}

// ==================== STATUS UPDATE ====================
function updateStatus(statusElement, text, type) {
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('span');
    
    if (statusText) {
        statusText.textContent = text;
    }
    
    if (statusDot) {
        statusDot.style.background = type === 'success' ? 'var(--success)' : 
                                     type === 'error' ? 'var(--danger)' : 
                                     type === 'warning' ? 'var(--warning)' : 
                                     'var(--info)';
    }
}

// ==================== AUTO-RUN SETUP ====================
function setupAutoRun() {
    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('input', () => {
            if (editor === jsCode) {
                checkJSErrors();
            }

            // Update status to "Modified"
            if (editor === htmlCode) updateStatus(htmlStatus, 'แก้ไขแล้ว', 'warning');
            if (editor === cssCode) updateStatus(cssStatus, 'แก้ไขแล้ว', 'warning');
            if (editor === jsCode) updateStatus(jsStatus, 'แก้ไขแล้ว', 'warning');

            if (autoRunCheck.checked) {
                clearTimeout(autoRunTimeout);
                autoRunTimeout = setTimeout(() => {
                    runCode();
                }, 800);
            }
        });
    });
}

// ==================== BUTTON EVENTS ====================
runBtn.addEventListener('click', () => {
    runCode();
    // Reset all status to Ready
    updateStatus(htmlStatus, 'พร้อม', 'success');
    updateStatus(cssStatus, 'พร้อม', 'success');
    updateStatus(jsStatus, 'พร้อม', 'success');
});

reloadBtn.addEventListener('click', () => {
    preview.srcdoc = '';
    updateStatus(previewStatus, 'กำลังโหลด...', 'warning');
    setTimeout(() => {
        runCode();
    }, 100);
    notify('รีเฟรชหน้าจอแสดงผล', 'info', 1500);
});

clearBtn.addEventListener('click', () => {
    clearModal.classList.add('visible');
});

confirmClear.addEventListener('click', () => {
    htmlCode.value = '';
    cssCode.value = '';
    jsCode.value = '';
    preview.srcdoc = '';
    jsError.classList.remove('visible');
    consoleOutput.innerHTML = '<div class="console-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 9L12 13L8 17M13 17H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>คอนโซลว่างเปล่า</p></div>';
    clearModal.classList.remove('visible');
    
    // Reset all status
    updateStatus(htmlStatus, 'พร้อม', 'success');
    updateStatus(cssStatus, 'พร้อม', 'success');
    updateStatus(jsStatus, 'พร้อม', 'success');
    updateStatus(previewStatus, 'พร้อม', 'success');
    
    notify('ลบโค้ดทั้งหมดแล้ว!', 'success', 2000);
});

cancelClear.addEventListener('click', () => {
    clearModal.classList.remove('visible');
});

// ==================== CONSOLE TOGGLE ====================
consoleToggle.addEventListener('change', () => {
    if (consoleToggle.checked) {
        consolePanel.classList.add('visible');
        notify('เปิดคอนโซล', 'info', 1500);
    } else {
        consolePanel.classList.remove('visible');
        notify('ปิดคอนโซล', 'info', 1500);
    }
});

consoleClearBtn.addEventListener('click', () => {
    consoleOutput.innerHTML = '<div class="console-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 9L12 13L8 17M13 17H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>คอนโซลว่างเปล่า</p></div>';
    notify('ล้างคอนโซลแล้ว', 'success', 1500);
});

// ==================== COLLAPSE NAVBAR ====================
collapseNavBtn.addEventListener('click', () => {
    navContainer.classList.toggle('collapsed');
    playgroundContainer.classList.toggle('nav-collapsed');
    
    if (navContainer.classList.contains('collapsed')) {
        notify('ซ่อนแถบนำทาง', 'info', 1500);
    } else {
        notify('แสดงแถบนำทาง', 'info', 1500);
    }
});

// ==================== CONTROL SIDEBAR ====================
sidebarToggle.addEventListener('click', () => {
    controlSidebar.classList.toggle('collapsed');
    
    if (controlSidebar.classList.contains('collapsed')) {
        notify('ซ่อนแถบควบคุม', 'info', 1500);
    } else {
        notify('แสดงแถบควบคุม', 'info', 1500);
    }
});

// Position controls
document.querySelectorAll('.position-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const position = btn.dataset.position;
        
        // Remove active from all
        document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update sidebar position
        controlSidebar.classList.remove('position-left', 'position-right', 'position-bottom');
        controlSidebar.classList.add(`position-${position}`);
        
        localStorage.setItem('sidebarPosition', position);
        notify(`ย้ายแถบควบคุมไป${position === 'left' ? 'ซ้าย' : position === 'right' ? 'ขวา' : 'ล่าง'}`, 'success', 1500);
    });
});

// Load saved position
const savedPosition = localStorage.getItem('sidebarPosition') || 'left';
controlSidebar.classList.add(`position-${savedPosition}`);
document.querySelector(`[data-position="${savedPosition}"]`)?.classList.add('active');

// ==================== DEVICE PREVIEW ====================
deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const device = btn.dataset.device;
        
        if (device === 'custom') {
            customSizeModal.classList.add('visible');
            return;
        }
        
        setDevice(device);
    });
});

function setDevice(device) {
    // Remove active from all
    deviceBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-device="${device}"]`).classList.add('active');
    
    currentDevice = device;
    
    // Apply device size
    previewWrapper.classList.remove('device-desktop', 'device-tablet', 'device-mobile', 'device-custom');
    previewWrapper.classList.add(`device-${device}`);
    
    const deviceNames = {
        desktop: 'เดสก์ท็อป',
        tablet: 'แท็บเล็ต',
        mobile: 'มือถือ'
    };
    
    notify(`เปลี่ยนเป็นมุมมอง${deviceNames[device]}`, 'success', 1500);
}

confirmCustomSize.addEventListener('click', () => {
    const width = parseInt(customWidth.value);
    const height = parseInt(customHeight.value);
    
    if (width < 320 || width > 3840 || height < 240 || height > 2160) {
        notify('ขนาดไม่ถูกต้อง', 'error', 2000);
        return;
    }
    
    // Set custom size
    previewWrapper.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
    previewWrapper.classList.add('device-custom');
    preview.style.width = width + 'px';
    preview.style.height = height + 'px';
    
    deviceBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-device="custom"]').classList.add('active');
    
    customSizeModal.classList.remove('visible');
    notify(`ขนาดกำหนดเอง: ${width}x${height}px`, 'success', 2000);
});

cancelCustomSize.addEventListener('click', () => {
    customSizeModal.classList.remove('visible');
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to run
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
    
    // Ctrl+Shift+C to toggle console
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        consoleToggle.checked = !consoleToggle.checked;
        consoleToggle.dispatchEvent(new Event('change'));
    }
    
    // Ctrl+Shift+L to toggle layout
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLayout();
    }
    
    // Ctrl+Shift+N to toggle navbar
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        collapseNavBtn.click();
    }
});

// ==================== TOOLTIP FUNCTIONALITY ====================
let tooltipTimeout = null;

document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
        clearTimeout(tooltipTimeout);
        const tooltipText = element.dataset.tooltip;
        
        if (tooltipText) {
            tooltip.textContent = tooltipText;
            tooltip.classList.add('visible');
            updateTooltipPosition(e);
        }
    });

    element.addEventListener('mousemove', updateTooltipPosition);

    element.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeout);
        tooltip.classList.remove('visible');
    });
});

function updateTooltipPosition(e) {
    const x = e.clientX;
    const y = e.clientY;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    // Position tooltip above cursor
    tooltip.style.left = `${x - tooltipWidth / 2}px`;
    tooltip.style.top = `${y - tooltipHeight - 10}px`;
}

// ==================== LAYOUT TOGGLE ====================
function toggleLayout() {
    const isVertical = editorContainer.classList.contains('layout-vertical');

    if (isVertical) {
        editorContainer.classList.remove('layout-vertical');
        layoutToggleBtn.classList.remove('active');
        notify('โหมดแสดงผลแนวนอน', 'info', 1500);
    } else {
        editorContainer.classList.add('layout-vertical');
        layoutToggleBtn.classList.add('active');
        notify('โหมดแสดงผลแนวตั้ง', 'info', 1500);
    }

    localStorage.setItem('layoutMode', isVertical ? 'horizontal' : 'vertical');
    
    // Reset panel sizes when switching layout
    editorsPanel.style.width = '';
    editorsPanel.style.height = '';
    editorsPanel.style.flex = '';
}

layoutToggleBtn.addEventListener('click', toggleLayout);

// Load saved layout preference
document.addEventListener('DOMContentLoaded', function() {
    const savedLayout = localStorage.getItem('layoutMode');
    if (savedLayout === 'vertical') {
        editorContainer.classList.add('layout-vertical');
        layoutToggleBtn.classList.add('active');
    }
});

// ==================== IMPROVED DRAG RESIZE SYSTEM ====================
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

dragHandle.addEventListener('mousedown', (e) => {
    // Only start resize if clicking on the handle bar, not the whole area
    if (!e.target.closest('.drag-handle-bar')) {
        return;
    }
    
    isResizing = true;
    const isVertical = editorContainer.classList.contains('layout-vertical');
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = editorsPanel.offsetWidth;
    startHeight = editorsPanel.offsetHeight;
    
    dragHandle.classList.add('dragging');
    document.body.style.cursor = isVertical ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const isVertical = editorContainer.classList.contains('layout-vertical');
    
    if (isVertical) {
        // Vertical layout: resize height
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;
        const containerHeight = editorContainer.offsetHeight;
        
        const minHeight = 200;
        const maxHeight = containerHeight - 200;
        
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            editorsPanel.style.height = newHeight + 'px';
            editorsPanel.style.flex = 'none';
        }
    } else {
        // Horizontal layout: resize width
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        const containerWidth = editorContainer.offsetWidth;
        
        const minWidth = 300;
        const maxWidth = containerWidth - 300;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            editorsPanel.style.width = newWidth + 'px';
            editorsPanel.style.flex = 'none';
        }
    }
});

document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    
    isResizing = false;
    dragHandle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
});

// Prevent text selection during resize
dragHandle.addEventListener('selectstart', (e) => e.preventDefault());

// ==================== ZOOM CONTROLS ====================
const editors = [
    { 
        editor: htmlCode, 
        zoomIn: document.getElementById('zoomInBtn'), 
        zoomOut: document.getElementById('zoomOutBtn'),
        type: 'html'
    },
    { 
        editor: cssCode, 
        zoomIn: document.getElementById('zoomInBtnCss'), 
        zoomOut: document.getElementById('zoomOutBtnCss'),
        type: 'css'
    },
    { 
        editor: jsCode, 
        zoomIn: document.getElementById('zoomInBtnJs'), 
        zoomOut: document.getElementById('zoomOutBtnJs'),
        type: 'js'
    }
];

editors.forEach(({ editor, zoomIn, zoomOut, type }) => {
    zoomIn.addEventListener('click', () => {
        if (fontSizes[type] < 24) {
            fontSizes[type] += 2;
            editor.style.fontSize = fontSizes[type] + 'px';
            zoomIn.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
            zoomOut.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
        }
    });
    
    zoomOut.addEventListener('click', () => {
        if (fontSizes[type] > 10) {
            fontSizes[type] -= 2;
            editor.style.fontSize = fontSizes[type] + 'px';
            zoomIn.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
            zoomOut.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
        }
    });
    
    // Set initial tooltip
    zoomIn.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
    zoomOut.dataset.tooltip = `ขนาด: ${fontSizes[type]}px`;
});

// ==================== SETTINGS ====================
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('visible');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('visible');
});

// Font preference radio buttons
document.querySelectorAll('input[name="editorFont"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const value = e.target.value;
        
        if (value === 'all') {
            document.getElementById('fontAllSection').style.display = 'block';
            document.getElementById('fontHtmlJsSection').style.display = 'none';
            document.getElementById('fontCssSection').style.display = 'none';
        } else {
            document.getElementById('fontAllSection').style.display = 'none';
            document.getElementById('fontHtmlJsSection').style.display = 'block';
            document.getElementById('fontCssSection').style.display = 'block';
        }
    });
});

saveSettings.addEventListener('click', () => {
    const fontPreference = document.querySelector('input[name="editorFont"]:checked').value;
    
    if (fontPreference === 'all') {
        const font = document.getElementById('fontAllSelect').value;
        htmlCode.style.fontFamily = font;
        cssCode.style.fontFamily = font;
        jsCode.style.fontFamily = font;
        
        localStorage.setItem('editorFontPreference', 'all');
        localStorage.setItem('editorFontAll', font);
    } else {
        const fontHtmlJs = document.getElementById('fontHtmlJsSelect').value;
        const fontCss = document.getElementById('fontCssSelect').value;
        
        htmlCode.style.fontFamily = fontHtmlJs;
        jsCode.style.fontFamily = fontHtmlJs;
        cssCode.style.fontFamily = fontCss;
        
        localStorage.setItem('editorFontPreference', 'except-css');
        localStorage.setItem('editorFontHtmlJs', fontHtmlJs);
        localStorage.setItem('editorFontCss', fontCss);
    }
    
    settingsModal.classList.remove('visible');
    notify('บันทึกการตั้งค่าแล้ว', 'success', 2000);
});

// Load saved font settings
document.addEventListener('DOMContentLoaded', () => {
    const fontPreference = localStorage.getItem('editorFontPreference') || 'all';
    
    if (fontPreference === 'all') {
        const font = localStorage.getItem('editorFontAll') || "'Consolas', 'Monaco', 'Courier New', monospace";
        document.getElementById('fontAllSelect').value = font;
        htmlCode.style.fontFamily = font;
        cssCode.style.fontFamily = font;
        jsCode.style.fontFamily = font;
        document.querySelector('input[value="all"]').checked = true;
    } else {
        const fontHtmlJs = localStorage.getItem('editorFontHtmlJs') || "'Consolas', 'Monaco', 'Courier New', monospace";
        const fontCss = localStorage.getItem('editorFontCss') || "'Consolas', 'Monaco', 'Courier New', monospace";
        
        document.getElementById('fontHtmlJsSelect').value = fontHtmlJs;
        document.getElementById('fontCssSelect').value = fontCss;
        
        htmlCode.style.fontFamily = fontHtmlJs;
        jsCode.style.fontFamily = fontHtmlJs;
        cssCode.style.fontFamily = fontCss;
        
        document.querySelector('input[value="except-css"]').checked = true;
        document.getElementById('fontAllSection').style.display = 'none';
        document.getElementById('fontHtmlJsSection').style.display = 'block';
        document.getElementById('fontCssSection').style.display = 'block';
    }
});

// ==================== NOTIFICATION SYSTEM ====================
function notify(message, type = 'default', duration = 2500) {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = 'notification' + (type !== 'default' ? ' type-' + type : '');

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
        default: ''
    };

    notification.innerHTML = `
        ${icons[type] ? `<div class="notification-icon">${icons[type]}</div>` : ''}
        <div class="notification-message">${message}</div>
    `;

    container.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    return notification;
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        notify('เปิดโหมดมืด', 'success', 2000);
    } else {
        localStorage.setItem('darkMode', 'disabled');
        notify('ปิดโหมดมืด', 'info', 2000);
    }
}

// Load saved dark mode preference
document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
});

// ==================== AUTO-RUN TOGGLE ANIMATION ====================
autoRunCheck.addEventListener('change', () => {
    if (autoRunCheck.checked) {
        notify('เปิดการรันอัตโนมัติ', 'success', 2000);
    } else {
        notify('ปิดการรันอัตโนมัติ', 'info', 2000);
    }
});

// ==================== INITIALIZE ====================
setupAutoRun();
runCode();

// Welcome notification
setTimeout(() => {
    notify('ยินดีต้อนรับสู่ Code Playground! 🚀', 'info', 3000);
}, 500);

// ==================== TAB MANAGEMENT ====================
// Save and restore tab state
const activeTabKey = 'activeEditorTab';

document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        localStorage.setItem(activeTabKey, tab.dataset.tab);
    });
});

// Restore active tab on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTab = localStorage.getItem(activeTabKey);
    if (savedTab) {
        const tab = document.querySelector(`[data-tab="${savedTab}"]`);
        if (tab) {
            tab.click();
        }
    }
});

// ==================== ERROR HANDLING ====================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.message);
    notify('เกิดข้อผิดพลาด ตรวจสอบคอนโซล', 'error', 3000);
});

// ==================== CONTEXT MENU PREVENTION ====================
// Prevent context menu on drag handle for better UX
dragHandle.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// ==================== LOADING INDICATOR ====================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});