// BookStats Timeline Chart - Timeline visualization

window.BookStats = window.BookStats || {};

BookStats.createTimelineChart = function(data) {
    // Normalize languages: combine Traditional and Simplified Chinese
    const normalizedData = data.map(book => ({
        ...book,
        normalizedLanguage: BookStats.normalizeLanguage(book.language)
    }));

    // Filter books with valid dates
    const booksWithDates = normalizedData.filter(book => book.startDate && book.finishDate);

    if (booksWithDates.length === 0) {
        document.getElementById('bookstats-timeline').innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
        return;
    }

    // Find date range
    let minDate = new Date(booksWithDates[0].startDate);
    let maxDate = new Date(booksWithDates[0].finishDate);

    booksWithDates.forEach(book => {
        const startDate = new Date(book.startDate);
        const finishDate = new Date(book.finishDate);
        if (startDate < minDate) minDate = startDate;
        if (finishDate > maxDate) maxDate = finishDate;
    });

    // Group books by language
    const groupedByLanguage = {
        'Korean': [],
        'Japanese': [],
        'Chinese': []
    };

    booksWithDates.forEach(book => {
        if (groupedByLanguage[book.normalizedLanguage]) {
            groupedByLanguage[book.normalizedLanguage].push(book);
        }
    });

    // Sort books by start date within each language
    Object.keys(groupedByLanguage).forEach(lang => {
        groupedByLanguage[lang].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    });

    // Calculate timeline dimensions
    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // Create timeline axis
    let timelineHTML = '<div class="timeline-wrapper"><div>';
    
    // Axis with date markers
    timelineHTML += '<div class="timeline-axis">';
    timelineHTML += '<div class="timeline-axis-label"></div>';
    timelineHTML += '<div class="timeline-axis-track">';
    
    // Generate date markers every ~2 weeks
    const markerInterval = Math.ceil(totalDays / 8); // Aim for ~8-10 markers
    for (let i = 0; i <= totalDays; i += markerInterval) {
        const markerDate = new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = markerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timelineHTML += `<span>${dateStr}</span>`;
    }
    timelineHTML += '</div></div>';

    // Timeline rows for each language
    timelineHTML += '<div class="timeline-container">';

    ['Korean', 'Japanese', 'Chinese'].forEach(lang => {
        const books = groupedByLanguage[lang];
        if (books.length === 0) return;

        timelineHTML += `
            <div class="timeline-language">
                <div class="timeline-label">${lang}</div>
                <div class="timeline-track" id="timeline-${lang.toLowerCase()}">
        `;

        books.forEach(book => {
            const startDate = new Date(book.startDate);
            const finishDate = new Date(book.finishDate);

            // Calculate position and width with half-day offsets
            const startDay = (startDate - minDate) / (1000 * 60 * 60 * 24);
            const finishDay = (finishDate - minDate) / (1000 * 60 * 60 * 24);
            
            const duration = finishDay - startDay - 1;

            const leftPercent = (startDay / totalDays) * 100;
            const widthPercent = Math.max(1.5, (duration / totalDays) * 100); // Minimum width for visibility

            const cssClass = `timeline-book timeline-book-${lang.toLowerCase()}`;
            const formattedStart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
            const formattedEnd = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

            timelineHTML += `
                <div class="${cssClass}" 
                     style="left: ${leftPercent}%; width: ${widthPercent}%;"
                     title="${book.name}&#10;${formattedStart} - ${formattedEnd}">
                    ${book.name}
                </div>
            `;
        });

        timelineHTML += '</div></div>';
    });

    timelineHTML += '</div></div></div>';
    document.getElementById('bookstats-timeline').innerHTML = timelineHTML;
};
