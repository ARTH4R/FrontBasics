// ==========================================
// Main Utilities - FrontBasics
// Includes: Notifications, Dark Mode (Anti-Spam), Mobile Menu
// ==========================================

// ==========================================
// Minimal Notification System
// ==========================================

function notify(message, type = 'default', duration = 2500) {
    // Get or create container
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification' + (type !== 'default' ? ' type-' + type : '');
    
    // Icon based on type
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
    
    // Show animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    return notification;
}

// Shorthand functions
function notifySuccess(message, duration) {
    return notify(message, 'success', duration);
}

function notifyError(message, duration) {
    return notify(message, 'error', duration);
}

function notifyWarning(message, duration) {
    return notify(message, 'warning', duration);
}

function notifyInfo(message, duration) {
    return notify(message, 'info', duration);
}

// ==================== DARK MODE WITH ANTI-SPAM ====================

// Anti-spam configuration
const DARK_MODE_CONFIG = {
    maxToggles: 5,           // Maximum toggles allowed
    timeWindow: 3000,        // Time window in ms (3 seconds)
    cooldown: 5000,          // Cooldown period in ms (5 seconds)
    toggleHistory: [],       // Store toggle timestamps
    isOnCooldown: false      // Cooldown state
};

function toggleDarkMode() {
    const body = document.body;
    const toggle = document.querySelector('.dark-mode-toggle');
    
    // Check if on cooldown
    if (DARK_MODE_CONFIG.isOnCooldown) {
        notifyWarning('กรุณารอสักครู่ก่อนเปลี่ยนโหมดอีกครั้ง / Please wait before toggling again', 2000);
        return;
    }
    
    // Current timestamp
    const now = Date.now();
    
    // Clean old timestamps outside the time window
    DARK_MODE_CONFIG.toggleHistory = DARK_MODE_CONFIG.toggleHistory.filter(
        timestamp => now - timestamp < DARK_MODE_CONFIG.timeWindow
    );
    
    // Add current toggle
    DARK_MODE_CONFIG.toggleHistory.push(now);
    
    // Check if user is spamming
    if (DARK_MODE_CONFIG.toggleHistory.length > DARK_MODE_CONFIG.maxToggles) {
        // Activate cooldown
        DARK_MODE_CONFIG.isOnCooldown = true;
        
        // Disable the button visually
        if (toggle) {
            toggle.classList.add('disabled');
        }
        
        // Show warning
        notifyError(
            '⚠️ หยุดกดปุ่มนี้! / Stop spamming the button! กำลังระงับการใช้งาน 5 วินาที / Cooldown: 5 seconds',
            4000
        );
        
        // Reset after cooldown
        setTimeout(() => {
            DARK_MODE_CONFIG.isOnCooldown = false;
            DARK_MODE_CONFIG.toggleHistory = [];
            if (toggle) {
                toggle.classList.remove('disabled');
            }
            notifyInfo('สามารถเปลี่ยนโหมดได้อีกครั้ง / You can toggle dark mode again', 2000);
        }, DARK_MODE_CONFIG.cooldown);
        
        return;
    }
    
    // Normal toggle
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        notify('เปิดใช้งานโหมดมืดแล้ว / Dark mode enabled', 'success', 1500);
    } else {
        localStorage.setItem('darkMode', 'disabled');
        notify('เปลี่ยนกลับเป็นโหมดสว่างแล้ว / Light mode enabled', 'info', 1500);
    }
}

// Load saved dark mode preference
document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
});

// ==================== MOBILE MENU ====================

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

// Mobile menu handlers
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('mobileMenu');
    const toggle = document.querySelector('.mobile-menu-toggle');

    if (!menu || !toggle) return;

    // Toggle menu
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('active') &&
            !menu.contains(e.target) &&
            !toggle.contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    // Close on desktop resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            menu.classList.remove('active');
        }
    });
});

// ==================== NAV SCROLL DETECTION ====================

(() => {
    const nav = document.querySelector('.nav-container');
    if (!nav) return;

    let last = false;

    function onScroll() {
        const scrolled = window.scrollY > 4;

        if (scrolled !== last) {
            nav.classList.toggle('is-scrolled', scrolled);
            last = scrolled;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // init
})();