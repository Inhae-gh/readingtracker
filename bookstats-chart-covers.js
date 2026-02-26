// BookStats Covers Grid - Display finished books as a grid of covers

window.BookStats = window.BookStats || {};

BookStats.createCoversGrid = function(data, selectedYear) {
    const container = document.getElementById('bookstats-covers');
    if (!container) return;

    // Filter to only finished books (not currently reading)
    const finishedBooks = data.filter(book => book.finishDate && !book.currentlyReading);

    if (finishedBooks.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No finished books available</p>';
        return;
    }

    // Sort by finish date, most recent first
    const sortedBooks = finishedBooks.sort((a, b) => {
        const dateA = BookStats.parseLocalDate(a.finishDate);
        const dateB = BookStats.parseLocalDate(b.finishDate);
        return dateB - dateA; // Descending order (most recent first)
    });

    let html = '';

    // If a specific year is selected, show month filter
    if (selectedYear !== 'all') {
        // Get available months for the selected year
        const availableMonths = BookStats.getAvailableMonthsForYear(sortedBooks, selectedYear);
        
        if (availableMonths.length > 0) {
            // Get stored month selection for this grid
            const storedMonth = container.dataset.selectedMonth || 'all';
            
            html += '<div class="covers-month-filter">';
            html += '<label for="covers-month-select">Filter by Month: </label>';
            html += '<select id="covers-month-select" class="covers-month-select">';
            html += '<option value="all">All Year</option>';
            
            availableMonths.forEach(monthNum => {
                const date = new Date(parseInt(selectedYear), monthNum - 1, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                const selected = storedMonth === monthNum.toString() ? 'selected' : '';
                html += `<option value="${monthNum}" ${selected}>${monthName}</option>`;
            });
            
            html += '</select>';
            html += '</div>';

            // Filter by selected month if not "all"
            if (storedMonth !== 'all') {
                const selectedMonth = parseInt(storedMonth);
                const filteredBooks = sortedBooks.filter(book => {
                    const finishDate = BookStats.parseLocalDate(book.finishDate);
                    return finishDate.getMonth() + 1 === selectedMonth;
                });
                html += BookStats.generateCoversGrid(filteredBooks);
            } else {
                html += BookStats.generateCoversGrid(sortedBooks);
            }
        } else {
            html += BookStats.generateCoversGrid(sortedBooks);
        }
    } else {
        // "All time" - no month filter needed
        html += BookStats.generateCoversGrid(sortedBooks);
    }

    container.innerHTML = html;

    // Add event listener for month filter if it exists
    const monthSelect = document.getElementById('covers-month-select');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            container.dataset.selectedMonth = e.target.value;
            // Re-render with the filtered data
            BookStats.createCoversGrid(data, selectedYear);
        });
    }
};

// Helper to get available months for a given year from finished books
BookStats.getAvailableMonthsForYear = function(finishedBooks, year) {
    const monthSet = new Set();
    
    finishedBooks.forEach(book => {
        if (!book.finishDate) return;
        const finishDate = BookStats.parseLocalDate(book.finishDate);
        if (finishDate.getFullYear().toString() === year.toString()) {
            monthSet.add(finishDate.getMonth() + 1); // 1-12
        }
    });

    return Array.from(monthSet).sort((a, b) => a - b);
};

// Generate the actual grid of book covers
BookStats.generateCoversGrid = function(books) {
    if (books.length === 0) {
        return '<p style="color: #999; text-align: center; margin-top: 20px;">No books match the selected filters</p>';
    }

    let html = '<div class="covers-grid">';
    
    books.forEach(book => {
        const coverUrl = BookStats.extractImageUrl(book.url);
        const normalizedLang = BookStats.normalizeLanguage(book.language);
        const color = BookStats.getLanguageColor(book.language);
        
        // Format finish date nicely
        const finishDate = BookStats.parseLocalDate(book.finishDate);
        const finishDateStr = finishDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        html += '<div class="cover-item">';
        
        // Wrap cover in link if available
        if (book.link) {
            html += `<a href="${BookStats.escapeHtml(book.link)}" target="_blank" rel="noopener noreferrer" class="cover-link">`;
        }
        
        if (coverUrl) {
            html += `<div class="cover-image" style="background-image: url('${coverUrl}')"></div>`;
        } else {
            html += `<div class="cover-image cover-image-placeholder" style="background-color: ${color}"></div>`;
        }
        
        if (book.link) {
            html += '</a>';
        }
        
        html += '<div class="cover-details">';
        html += `<div class="cover-title">${BookStats.escapeHtml(book.name)}</div>`;
        html += `<div class="cover-author">${BookStats.escapeHtml(book.author || 'Unknown Author')}</div>`;
        html += `<div class="cover-date">${finishDateStr}</div>`;
        html += `<div class="cover-language" style="background-color: ${color}">${normalizedLang}</div>`;
        html += '</div>';
        
        html += '</div>';
    });
    
    html += '</div>';
    
    return html;
};

// Helper to escape HTML to prevent XSS
BookStats.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Use the parseLocalDate from calendar if it exists, otherwise define it
if (!BookStats.parseLocalDate) {
    BookStats.parseLocalDate = function(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date(dateStr);
    };
}

// Use extractImageUrl from calendar if it exists, otherwise define it
if (!BookStats.extractImageUrl) {
    BookStats.extractImageUrl = function(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (!trimmed) return '';

        const imageMatch = trimmed.match(/^=IMAGE\((.*)\)$/i);
        if (imageMatch && imageMatch[1]) {
            const firstArg = imageMatch[1].split(',')[0].trim();
            const unquoted = firstArg.replace(/^['"]|['"]$/g, '');
            return unquoted.trim();
        }

        return trimmed.replace(/^['"]|['"]$/g, '');
    };
}
