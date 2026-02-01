// BookStats Common - Shared utilities, constants, and colors

window.BookStats = window.BookStats || {};

// Color scheme for languages
BookStats.colors = {
    korean: {
        bg: '#AEC0CF',
        border: '#9EB0BF'
    },
    japanese: {
        bg: '#D9C6A7',
        border: '#C9B697'
    },
    chineseLight: {
        bg: '#D1B8C5',
        border: '#C1A8B5'
    },
    chineseDark: {
        bg: '#BAA0AE',
        border: '#AA909E'
    }
};

// Language normalization
BookStats.normalizeLanguage = function(language) {
    const lang = language.toLowerCase();
    if (lang.includes('korean')) return 'Korean';
    if (lang.includes('japanese')) return 'Japanese';
    if (lang.includes('traditional') || lang.includes('simplified') || lang.includes('chinese')) return 'Chinese';
    return 'Other';
};

// Get color for a language
BookStats.getLanguageColor = function(language) {
    const normalized = this.normalizeLanguage(language);
    switch (normalized) {
        case 'Korean':
            return this.colors.korean.bg;
        case 'Japanese':
            return this.colors.japanese.bg;
        case 'Chinese':
            return this.colors.chineseDark.bg;
        default:
            return '#999';
    }
};

// Get all chart colors as arrays for Chart.js
BookStats.getChartColors = function() {
    return {
        bg: [
            BookStats.colors.korean.bg,
            BookStats.colors.japanese.bg,
            BookStats.colors.chineseLight.bg,
            BookStats.colors.chineseDark.bg
        ],
        border: [
            BookStats.colors.korean.border,
            BookStats.colors.japanese.border,
            BookStats.colors.chineseLight.border,
            BookStats.colors.chineseDark.border
        ]
    };
};

// Process language data
BookStats.processLanguageData = function(data) {
    const counts = {
        korean: 0,
        japanese: 0,
        chineseTraditional: 0,
        chineseSimplified: 0
    };

    data.forEach(entry => {
        const lang = entry.language.toLowerCase();

        if (lang.includes('korean')) {
            counts.korean++;
        } else if (lang.includes('japanese')) {
            counts.japanese++;
        } else if (lang.includes('traditional')) {
            counts.chineseTraditional++;
        } else if (lang.includes('simplified')) {
            counts.chineseSimplified++;
        }
    });

    return counts;
};

// Show error message
BookStats.showError = function(message) {
    document.getElementById('bookstats-loading').style.display = 'none';
    const errorDiv = document.getElementById('bookstats-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
};
