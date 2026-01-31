// BookStats Duration Chart - Duration visualization

window.BookStats = window.BookStats || {};

BookStats.createDurationChart = function(data) {
    // Calculate duration for each book
    const booksWithDuration = data
        .filter(book => book.startDate && book.finishDate)
        .map(book => {
            const startDate = new Date(book.startDate);
            const finishDate = new Date(book.finishDate);
            const days = Math.max(1, Math.round((finishDate - startDate) / (1000 * 60 * 60 * 24)));
            
            return {
                name: book.name,
                language: BookStats.normalizeLanguage(book.language),
                days: days
            };
        })
        .sort((a, b) => b.days - a.days); // Sort by duration, longest first

    if (booksWithDuration.length === 0) {
        document.getElementById('bookstats-durationChart').innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
        return;
    }

    // Find max duration for scaling
    const maxDays = Math.max(...booksWithDuration.map(b => b.days));

    // Create chart HTML
    let chartHTML = '<div class="duration-chart">';

    booksWithDuration.forEach(book => {
        const widthPercent = (book.days / maxDays) * 100;
        const barClass = `duration-bar duration-bar-${book.language.toLowerCase()}`;
        const displayDays = book.days === 1 ? '1 day' : `${book.days} days`;

        chartHTML += `
            <div class="duration-row">
                <div class="duration-label" title="${book.name}">${book.name}</div>
                <div class="duration-bar-container">
                    <div class="${barClass}" style="width: ${widthPercent}%;" title="${book.language} - ${displayDays}">
                        ${displayDays}
                    </div>
                </div>
            </div>
        `;
    });

    chartHTML += '</div>';
    document.getElementById('bookstats-durationChart').innerHTML = chartHTML;
};
