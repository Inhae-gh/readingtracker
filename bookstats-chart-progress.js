// BookStats Progress Chart - Simplified language lanes timeline

window.BookStats = window.BookStats || {};

BookStats.createProgressChart = function(data) {
    const container = document.getElementById('bookstats-progress');
    if (!container) return;

    const dayMs = 1000 * 60 * 60 * 24;
    const today = new Date();

    const parseDate = BookStats.parseLocalDate || function(dateStr) {
        const parts = String(dateStr || '').split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(dateStr);
    };

    const formatDate = function(dateObj) {
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const todayText = BookStats.formatLocalDate
        ? BookStats.formatLocalDate(today)
        : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const laneOrder = [
        { key: 'Korean', label: 'Korean' },
        { key: 'Japanese', label: 'Japanese' },
        { key: 'Chinese', label: 'Chinese' }
    ];

    const normalizeLane = function(language) {
        const lang = String(language || '').toLowerCase();
        if (lang.includes('korean')) return 'Korean';
        if (lang.includes('japanese')) return 'Japanese';
        if (lang.includes('traditional') || lang.includes('simplified') || lang.includes('chinese')) return 'Chinese';
        return null;
    };

    const getColorClass = function(language, lane) {
        const lang = String(language || '').toLowerCase();
        if (lane === 'Korean') return 'korean';
        if (lane === 'Japanese') return 'japanese';
        if (lang.includes('traditional')) return 'chinese-traditional';
        if (lang.includes('simplified')) return 'chinese-simplified';
        return 'chinese-simplified';
    };

    const booksWithDates = data
        .filter(book => book.startDate && (book.finishDate || book.currentlyReading))
        .map(book => {
            const lane = normalizeLane(book.language);
            if (!lane) return null;
            const startDateObj = parseDate(book.startDate);
            const finishDateObj = parseDate(book.finishDate || todayText);
            if (isNaN(startDateObj) || isNaN(finishDateObj)) return null;

            return {
                ...book,
                lane,
                colorClass: getColorClass(book.language, lane),
                startDateObj,
                finishDateObj,
                isCurrent: !book.finishDate && !!book.currentlyReading
            };
        })
        .filter(Boolean);

    if (booksWithDates.length === 0) {
        container.innerHTML = '<p class="progress-empty">No reading progress data available.</p>';
        return;
    }

    let minDate = new Date(booksWithDates[0].startDateObj);
    let maxDate = new Date(booksWithDates[0].finishDateObj);

    booksWithDates.forEach(book => {
        if (book.startDateObj < minDate) minDate = book.startDateObj;
        if (book.finishDateObj > maxDate) maxDate = book.finishDateObj;
    });

    const totalDays = Math.max(1, Math.round((maxDate - minDate) / dayMs) + 1);
    const pxPerDay = window.innerWidth < 640 ? 12 : 16;
    const laneWidth = totalDays * pxPerDay;

    const booksByLane = {};
    laneOrder.forEach(lane => {
        booksByLane[lane.key] = [];
    });
    booksWithDates.forEach(book => {
        booksByLane[book.lane].push(book);
    });

    Object.keys(booksByLane).forEach(lane => {
        booksByLane[lane].sort((a, b) => a.startDateObj - b.startDateObj);
    });

    const axisDates = [];
    const axisCursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const axisEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (axisCursor <= axisEnd) {
        axisDates.push(new Date(axisCursor));
        axisCursor.setMonth(axisCursor.getMonth() + 1);
    }

    let monthButtonsHTML = '<div class="progress-month-shortcuts">';
    axisDates.forEach(date => {
        const offset = Math.max(0, Math.round((date - minDate) / dayMs) * pxPerDay);
        const label = date.toLocaleDateString('en-US', { month: 'long' });
        monthButtonsHTML += '<button type="button" class="progress-month-button" data-progress-scroll="' + offset + '">' + label + '</button>';
    });
    monthButtonsHTML += '</div>';

    let html = '<div class="progress-chart">' + monthButtonsHTML + '<div id="bookstats-progress-scroll" class="progress-chart-scroll"><div class="progress-grid" style="width: ' + (laneWidth + 130) + 'px;">';

    html += '<div class="progress-axis" style="width: ' + laneWidth + 'px;">';
    axisDates.forEach(date => {
        const offset = Math.round((date - minDate) / dayMs) * pxPerDay;
        const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        html += '<span class="progress-axis-label" style="left: ' + offset + 'px;">' + label + '</span>';
    });
    html += '</div>';

    laneOrder.forEach(lane => {
        const laneBooks = booksByLane[lane.key] || [];
        html += '<div class="progress-row">';
        html += '<div class="progress-language-label">' + lane.label + '</div>';
        html += '<div class="progress-lane" style="width: ' + laneWidth + 'px;">';
        html += '<div class="progress-lane-line"></div>';

        laneBooks.forEach(book => {
            const startOffset = Math.round((book.startDateObj - minDate) / dayMs) * pxPerDay;
            const daySpan = Math.max(1, Math.round((book.finishDateObj - book.startDateObj) / dayMs) + 1);
            const width = Math.max(40, daySpan * pxPerDay - 2);
            const days = Math.max(1, daySpan);
            const title = `${book.name} (${days} days)\n${formatDate(book.startDateObj)} - ${formatDate(book.finishDateObj)}`;
            const bookClass = 'progress-book progress-book-' + book.colorClass + (book.isCurrent ? ' progress-book-current' : '');
            const shortName = book.name.length > 28 ? (book.name.slice(0, 25) + '...') : book.name;
            const labelText = width < 88 ? `${days}d` : `${shortName} • ${days}d`;

            html += '<div class="' + bookClass + '" style="left: ' + startOffset + 'px; width: ' + width + 'px;" title="' + title.replace(/"/g, '&quot;') + '">';
            html += '<span>' + labelText + '</span>';
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';
    });

    html += '</div></div></div>';

    container.innerHTML = html;

    const scrollWrapper = document.getElementById('bookstats-progress-scroll');
    if (scrollWrapper) {
        container.querySelectorAll('[data-progress-scroll]').forEach(button => {
            button.addEventListener('click', () => {
                const scrollLeft = parseInt(button.getAttribute('data-progress-scroll') || '0', 10);
                scrollWrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            });
        });
    }
};
