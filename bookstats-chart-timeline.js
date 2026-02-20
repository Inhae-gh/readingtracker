// BookStats Timeline Chart - Timeline visualization

window.BookStats = window.BookStats || {};

BookStats.createTimelineChart = function(data) {
    const dayMs = 1000 * 60 * 60 * 24;
    const today = new Date();
    const parseDate = BookStats.parseLocalDate || (dateStr => new Date(dateStr));
    const formatDate = BookStats.formatLocalDate || (dateObj => dateObj.toISOString().split('T')[0]);
    const todayText = formatDate(today);

    // Normalize languages: combine Traditional and Simplified Chinese
    const normalizedData = data
        .filter(book => book.startDate && (book.finishDate || book.currentlyReading))
        .map(book => {
            const finishDate = book.finishDate ? parseDate(book.finishDate) : parseDate(todayText);
            return {
                ...book,
                normalizedLanguage: BookStats.normalizeLanguage(book.language),
                startDateObj: parseDate(book.startDate),
                finishDateObj: finishDate
            };
        });

    // Filter books with valid dates
    const booksWithDates = normalizedData.filter(book => !isNaN(book.startDateObj) && !isNaN(book.finishDateObj));

    if (booksWithDates.length === 0) {
        document.getElementById('bookstats-timeline').innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
        return;
    }

    // Find date range
    let minDate = new Date(booksWithDates[0].startDateObj);
    let maxDate = new Date(booksWithDates[0].finishDateObj);

    booksWithDates.forEach(book => {
        const startDate = book.startDateObj;
        const finishDate = book.finishDateObj;
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
        groupedByLanguage[lang].sort((a, b) => a.startDateObj - b.startDateObj);
    });

    // Calculate timeline dimensions
    const totalDays = Math.max(1, Math.round((maxDate - minDate) / dayMs) + 1);
    
    // Allocate pixels per day - this creates more horizontal space
    const pixelsPerDay = 40;
    const totalWidth = totalDays * pixelsPerDay;
    const gapPx = Math.max(4, Math.round(pixelsPerDay * 0.15));

    // Build month shortcuts
    let monthHTML = '<div class="timeline-month-shortcuts">';
    const monthCursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const monthEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (monthCursor <= monthEnd) {
        const monthLabel = monthCursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthStartDay = Math.round((monthCursor - minDate) / dayMs);
        const monthLeftPx = Math.max(0, monthStartDay * pixelsPerDay);
        monthHTML += `<button type="button" class="timeline-month-button" data-scroll-left="${monthLeftPx}">${monthLabel}</button>`;
        monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    monthHTML += '</div>';

    // Create timeline axis
    let timelineHTML = `${monthHTML}<div id="bookstats-timeline-wrapper" class="timeline-wrapper" style="overflow-x: auto;"><div style="width: ${totalWidth}px;">`;
    
    // Axis with date markers
    timelineHTML += '<div class="timeline-axis" style="width: ' + totalWidth + 'px;">';
    timelineHTML += '<div class="timeline-axis-label"></div>';
    timelineHTML += '<div class="timeline-axis-track" style="width: ' + totalWidth + 'px;">';
    
    // Generate date markers every ~2 weeks
    const markerInterval = Math.max(1, Math.ceil(totalDays / 8)); // Aim for ~8-10 markers
    for (let i = 0; i <= totalDays - 1; i += markerInterval) {
        const markerDate = new Date(minDate.getTime() + i * dayMs);
        const dateStr = markerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const leftPos = i * pixelsPerDay;
        timelineHTML += `<span style="position: absolute; left: ${leftPos}px;">${dateStr}</span>`;
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
                <div class="timeline-track" style="width: ${totalWidth}px; position: relative;" id="timeline-${lang.toLowerCase()}">
        `;

        books.forEach(book => {
            const startDate = book.startDateObj;
            const finishDate = book.finishDateObj;

            // Calculate position and width in pixels
            const startDay = Math.round((startDate - minDate) / dayMs);
            const finishDay = Math.round((finishDate - minDate) / dayMs);

            const durationDays = Math.max(1, finishDay - startDay + 1);

            const leftPx = startDay * pixelsPerDay;
            const widthPx = Math.max(24, durationDays * pixelsPerDay - gapPx);

            const cssClass = `timeline-book timeline-book-${lang.toLowerCase()}`;
            const formattedStart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
            const formattedEnd = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
            const displayTitle = (widthPx < 70)
                ? `${book.name.slice(0, 8)}${book.name.length > 8 ? '...' : ''}`
                : (widthPx < 110)
                    ? `${book.name.slice(0, 16)}${book.name.length > 16 ? '...' : ''}`
                    : book.name;
            const coverUrl = BookStats.extractImageUrl ? BookStats.extractImageUrl(book.url) : '';
            const coverStyle = coverUrl ? ` style="background-image: url('${coverUrl}')"` : '';
            const coverSpan = coverUrl ? `<span class="timeline-cover"${coverStyle}></span>` : '';

            timelineHTML += `
                <div class="${cssClass}" 
                     style="left: ${leftPx}px; width: ${widthPx}px;"
                     title="${book.name}&#10;${formattedStart} - ${formattedEnd}">
                    ${coverSpan}
                    <span class="timeline-book-label">${displayTitle}</span>
                </div>
            `;
        });

        timelineHTML += '</div></div>';
    });

    timelineHTML += '</div></div></div>';
    const timelineRoot = document.getElementById('bookstats-timeline');
    timelineRoot.innerHTML = timelineHTML;
    const timelineWrapper = document.getElementById('bookstats-timeline-wrapper');
    if (timelineWrapper) {
        timelineRoot.querySelectorAll('.timeline-month-button').forEach(button => {
            button.addEventListener('click', () => {
                const scrollLeft = parseInt(button.dataset.scrollLeft || '0', 10);
                timelineWrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            });
        });
    }
};
