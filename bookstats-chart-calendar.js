// BookStats Calendar Chart - Monthly calendar view with books as lines

window.BookStats = window.BookStats || {};

BookStats.createCalendarChart = function(data) {
    const container = document.getElementById('bookstats-calendar');
    if (!container) return;

    // Filter books with valid dates
    const booksWithDates = data.filter(book => book.startDate && book.finishDate);

    if (booksWithDates.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
        return;
    }

    // Get current month/year or use stored selection
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Get unique months from the data
    const availableMonths = BookStats.getAvailableMonths(booksWithDates);

    // Get selected month/year or default to current
    const storedMonth = container.dataset.selectedMonth;
    const storedYear = container.dataset.selectedYear;
    
    let selectedYear = storedYear ? parseInt(storedYear) : currentYear;
    let selectedMonth = storedMonth ? parseInt(storedMonth) : currentMonth;

    // If current month has no data, use the most recent available month
    if (!storedMonth && !storedYear) {
        const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        if (!availableMonths.includes(currentKey) && availableMonths.length > 0) {
            const mostRecent = availableMonths[availableMonths.length - 1];
            const [yr, mn] = mostRecent.split('-');
            selectedYear = parseInt(yr);
            selectedMonth = parseInt(mn) - 1;
        }
    }

    // Create month selector dropdown
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    let html = '<div class="calendar-controls">';
    html += '<label for="calendar-month-select">Select Month: </label>';
    html += '<select id="calendar-month-select" class="calendar-month-select">';
    
    availableMonths.forEach(monthStr => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const displayName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const selected = monthStr === monthKey ? 'selected' : '';
        html += `<option value="${monthStr}" ${selected}>${displayName}</option>`;
    });
    
    html += '</select>';
    html += '</div>';

    // Generate calendar for selected month
    html += BookStats.generateMonthCalendar(selectedYear, selectedMonth, booksWithDates);

    container.innerHTML = html;

    // Add event listener for month change
    const monthSelect = document.getElementById('calendar-month-select');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-');
            container.dataset.selectedYear = year;
            container.dataset.selectedMonth = parseInt(month) - 1;
            BookStats.createCalendarChart(data);
        });
    }
};

// Helper function to parse date string as local date (not UTC)
BookStats.parseLocalDate = function(dateStr) {
    // Parse YYYY-MM-DD format as local date
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Fallback to standard parsing
    return new Date(dateStr);
};

// Get list of available months from the data
BookStats.getAvailableMonths = function(booksWithDates) {
    const monthSet = new Set();

    booksWithDates.forEach(book => {
        const startDate = BookStats.parseLocalDate(book.startDate);
        const finishDate = BookStats.parseLocalDate(book.finishDate);

        // Add all months between start and finish
        const currentDate = new Date(startDate);
        while (currentDate <= finishDate) {
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            monthSet.add(monthKey);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    });

    return Array.from(monthSet).sort();
};

// Generate the calendar view for a specific month
BookStats.generateMonthCalendar = function(year, month, booksWithDates) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    let html = '<div class="calendar-view">';
    
    // Calendar header with day names
    html += '<div class="calendar-header">';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });
    html += '</div>';

    // Calendar grid
    html += '<div class="calendar-grid">';

    // Empty cells before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="calendar-cell calendar-cell-empty"></div>';
    }

    // Filter books for this month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const isToday = this.isSameDay(cellDate, new Date());
        
        // Find books that overlap with this day
        const booksOnDay = booksWithDates.filter(book => {
            const bookStart = BookStats.parseLocalDate(book.startDate);
            const bookFinish = BookStats.parseLocalDate(book.finishDate);
            return bookStart <= cellDate && bookFinish >= cellDate;
        });

        const todayClass = isToday ? ' calendar-cell-today' : '';
        html += `<div class="calendar-cell${todayClass}">`;
        html += `<div class="calendar-date">${day}</div>`;
        
        if (booksOnDay.length > 0) {
            html += '<div class="calendar-books">';
            booksOnDay.forEach(book => {
                const bookStart = BookStats.parseLocalDate(book.startDate);
                const bookFinish = BookStats.parseLocalDate(book.finishDate);
                
                // Determine if this is the start or end of the book
                const isStart = this.isSameDay(bookStart, cellDate);
                const isEnd = this.isSameDay(bookFinish, cellDate);
                
                const lang = BookStats.normalizeLanguage(book.language);
                const langClass = lang.toLowerCase();
                
                let markerClass = 'calendar-book-line';
                if (isStart && isEnd) {
                    // Book read in a single day
                    markerClass += ' calendar-book-single';
                } else if (isStart) {
                    markerClass += ' calendar-book-start';
                } else if (isEnd) {
                    markerClass += ' calendar-book-end';
                } else {
                    // Middle of the book - full width
                    markerClass += ' calendar-book-middle';
                }
                
                const title = `${book.name}\n${book.startDate} - ${book.finishDate}`;
                html += `<div class="${markerClass} calendar-book-${langClass}" title="${title}"></div>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
    }

    html += '</div></div>';

    return html;
};

// Helper function to check if two dates are the same day
BookStats.isSameDay = function(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};
