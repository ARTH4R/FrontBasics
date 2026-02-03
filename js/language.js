// Language Management System
class LanguageManager {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'th';
        this.init();
    }

    async init() {
        try {
            // Load translations from external file
            const response = await fetch('./translations.json');
            if (!response.ok) {
                throw new Error('Failed to load translations');
            }
            this.translations = await response.json();

            // Get saved language or default to Thai
            this.currentLanguage = localStorage.getItem('language') || 'th';

            // Apply initial language
            this.applyLanguage(this.currentLanguage);

            // Setup language selector
            this.setupLanguageSelector();

        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to inline translations if external file fails
            this.loadFallbackTranslations();
        }
    }

    loadFallbackTranslations() {
        // Fallback translations in case external file fails
        this.translations = {
            "th": {
                "home": "หน้าหลัก",

    applyLanguage(lang) {
        // Set HTML lang attribute
        document.documentElement.lang = lang;

        // Update all elements with data-lang attributes
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (this.translations[lang] && this.translations[lang][key]) {
                element.textContent = this.translations[lang][key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
            const key = element.getAttribute('data-lang-placeholder');
            if (this.translations[lang] && this.translations[lang][key]) {
                element.placeholder = this.translations[lang][key];
            }
        });

        // Save language preference
        localStorage.setItem('language', lang);
        this.currentLanguage = lang;

        // Update select value
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = lang;
        }
    }

    setupLanguageSelector() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.applyLanguage(e.target.value);
            });
        }
    }

    // Public method to change language programmatically
    changeLanguage(lang) {
        this.applyLanguage(lang);
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get translation for a key
    getTranslation(key, lang = this.currentLanguage) {
        return this.translations[lang]?.[key] || key;
    }
}

// Initialize language manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
}
