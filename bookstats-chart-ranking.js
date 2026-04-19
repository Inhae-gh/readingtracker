// BookStats Ranking - Podium-style language rankings

window.BookStats = window.BookStats || {};

BookStats.createRankingChart = function(data) {
    const container = document.getElementById('bookstats-ranking');
    if (!container) return;

    const counts = BookStats.processLanguageData(data);

    const languages = [
        { name: 'Korean', count: counts.korean, color: BookStats.colors.korean.bg },
        { name: 'Japanese', count: counts.japanese, color: BookStats.colors.japanese.bg },
        { name: 'Trad. Chinese', count: counts.chineseTraditional, color: BookStats.colors.chineseDark.bg },
        { name: 'Simp. Chinese', count: counts.chineseSimplified, color: BookStats.colors.chineseLight.bg },
    ].filter(l => l.count > 0).sort((a, b) => b.count - a.count);

    const favouriteCounts = BookStats._countFavouritesByLanguage(data);
    const longestByLanguage = BookStats._longestBookByLanguage(data);
    const fastestByLanguage = BookStats._fastestReadByLanguage(data);

    container.innerHTML = `
        <div class="ranking-grid">
            ${BookStats._renderLanguagePodium(languages)}
            ${BookStats._renderFavouritesPodium(favouriteCounts)}
            ${BookStats._renderPodiumCard('Longest book in each language', longestByLanguage)}
            ${BookStats._renderPodiumCard('Fastest read in each language (days)', fastestByLanguage)}
        </div>
    `;
};

BookStats._countFavouritesByLanguage = function(data) {
    return [
        { name: 'Korean', count: data.filter(b => b.favorite && b.language.toLowerCase().includes('korean')).length, color: BookStats.colors.korean.bg },
        { name: 'Japanese', count: data.filter(b => b.favorite && b.language.toLowerCase().includes('japanese')).length, color: BookStats.colors.japanese.bg },
        { name: 'Trad. Chinese', count: data.filter(b => b.favorite && b.language.toLowerCase().includes('traditional')).length, color: BookStats.colors.chineseDark.bg },
        { name: 'Simp. Chinese', count: data.filter(b => b.favorite && b.language.toLowerCase().includes('simplified')).length, color: BookStats.colors.chineseLight.bg },
    ].filter(l => l.count > 0).sort((a, b) => b.count - a.count);
};

BookStats._longestBookByLanguage = function(data) {
    const groups = [
        { name: 'Korean', color: BookStats.colors.korean.bg, match: l => l.includes('korean') },
        { name: 'Japanese', color: BookStats.colors.japanese.bg, match: l => l.includes('japanese') },
        { name: 'Trad. Chinese', color: BookStats.colors.chineseDark.bg, match: l => l.includes('traditional') },
        { name: 'Simp. Chinese', color: BookStats.colors.chineseLight.bg, match: l => l.includes('simplified') },
    ];

    return groups.map(g => {
        const books = data.filter(b => g.match(b.language.toLowerCase()) && b.pages > 0);
        const maxPages = books.length > 0 ? Math.max(...books.map(b => b.pages)) : 0;
        return { name: g.name, count: maxPages, color: g.color };
    }).filter(l => l.count > 0).sort((a, b) => b.count - a.count);
};

BookStats._fastestReadByLanguage = function(data) {
    const groups = [
        { name: 'Korean', color: BookStats.colors.korean.bg, match: l => l.includes('korean') },
        { name: 'Japanese', color: BookStats.colors.japanese.bg, match: l => l.includes('japanese') },
        { name: 'Trad. Chinese', color: BookStats.colors.chineseDark.bg, match: l => l.includes('traditional') },
        { name: 'Simp. Chinese', color: BookStats.colors.chineseLight.bg, match: l => l.includes('simplified') },
    ];

    return groups.map(g => {
        const durations = data
            .filter(b => g.match(b.language.toLowerCase()) && b.startDate && b.finishDate)
            .map(b => Math.round((new Date(b.finishDate) - new Date(b.startDate)) / 86400000));
        const minDays = durations.length > 0 ? Math.min(...durations) : null;
        return { name: g.name, count: minDays, color: g.color };
    }).filter(l => l.count !== null && l.count >= 0).sort((a, b) => a.count - b.count);
};

BookStats._renderFavouritesPodium = function(languages) {
    return BookStats._renderPodiumCard('Most favourite books', languages);
};

BookStats._renderPodiumCard = function(title, languages, options) {
    const invertBars = options && options.invertBars;
    const suffix = options && options.suffix ? options.suffix : '';
    const maxCount = Math.max(...languages.map(l => l.count), 1);
    const maxBarHeight = 160;
    const minBarHeight = 40;
    const ordinals = ['1st', '2nd', '3rd', '4th'];

    const bars = languages.map((lang, i) => {
        let ratio;
        if (invertBars) {
            ratio = minCount / lang.count;
        } else {
            ratio = lang.count / maxCount;
        }
        const height = Math.max(minBarHeight, Math.round(ratio * maxBarHeight));
        return `
            <div class="ranking-bar-wrap">
                <div class="ranking-bar" style="height: ${height}px; background-color: ${lang.color};">
                    <span class="ranking-bar-count">${lang.count}${suffix}</span>
                </div>
                <div class="ranking-bar-position">${ordinals[i]}</div>
                <div class="ranking-bar-label">${lang.name}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="ranking-card">
            <div class="ranking-title">${title}</div>
            <div class="ranking-podium">${bars}</div>
        </div>
    `;
};

BookStats._renderLanguagePodium = function(languages) {
    return BookStats._renderPodiumCard('Language read the most in', languages);
};
