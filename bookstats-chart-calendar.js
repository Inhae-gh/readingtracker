// BookStats Calendar Chart - Monthly calendar view with books as lines

window.BookStats = window.BookStats || {};

BookStats._mastodonCache = null;

BookStats.titleToHashtag = function(title) {
    return title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
};

BookStats.fetchMastodonPosts = async function(bookHashtagNames) {
    if (BookStats._mastodonCache !== null) return BookStats._mastodonCache;

    if (typeof MASTODON_ACCOUNT === 'undefined' || !MASTODON_ACCOUNT) {
        BookStats._mastodonCache = {};
        return {};
    }

    const parts = MASTODON_ACCOUNT.replace(/^@/, '').split('@');
    if (parts.length < 2) {
        BookStats._mastodonCache = {};
        return {};
    }
    const username = parts[0];
    const instance = parts[1];
    const bookHashtags = new Set(bookHashtagNames);

    try {
        const lookupRes = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${username}`);
        if (!lookupRes.ok) throw new Error(`Account lookup failed (HTTP ${lookupRes.status})`);
        const account = await lookupRes.json();

        const postsByDate = {};
        let url = `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=40&exclude_reblogs=true`;
        let fetched = 0;

        while (url && fetched < 500) {
            const res = await fetch(url);
            if (!res.ok) break;
            const statuses = await res.json();
            if (!statuses.length) break;

            statuses.forEach(status => {
                const matchingTag = (status.tags || []).find(t => bookHashtags.has(t.name.toLowerCase()));
                if (!matchingTag) return;
                const date = status.created_at.slice(0, 10);
                if (!postsByDate[date]) postsByDate[date] = [];
                const images = (status.media_attachments || [])
                    .filter(a => a.type === 'image')
                    .map(a => ({ url: a.preview_url || a.url, alt: a.description || '' }));
                const finished = (status.tags || []).some(t => t.name.toLowerCase() === 'finishedreading');
                postsByDate[date].push({
                    content: status.content,
                    date,
                    url: status.url,
                    bookTag: matchingTag.name,
                    images,
                    finished
                });
            });

            fetched += statuses.length;
            const linkHeader = res.headers.get('Link');
            url = null;
            if (linkHeader) {
                const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                if (match) url = match[1];
            }
        }

        BookStats._mastodonCache = postsByDate;
        return postsByDate;
    } catch (e) {
        console.warn('Mastodon fetch failed:', e);
        BookStats._mastodonCache = {};
        return {};
    }
};

BookStats.showMastodonPopup = function(dateKey, anchorEl) {
    const existing = document.getElementById('bookstats-mastodon-popup');
    if (existing) {
        existing.remove();
        return;
    }

    const posts = (BookStats._mastodonPostsForDay || {})[dateKey] || [];
    if (!posts.length) return;

    let html = '<div id="bookstats-mastodon-popup" class="mastodon-popup">';
    html += '<button class="mastodon-popup-close" aria-label="Close">×</button>';
    posts.forEach(post => {
        html += '<div class="mastodon-popup-post">';
        html += `<div class="mastodon-popup-content">${post.content}</div>`;
        if (post.images && post.images.length > 0) {
            html += '<div class="mastodon-popup-images">';
            post.images.forEach(img => {
                html += `<img class="mastodon-popup-image" src="${img.url}" alt="${img.alt}">`;
            });
            html += '</div>';
        }
        html += '<div class="mastodon-popup-footer">';
        html += `<span class="mastodon-popup-date">${post.date}</span>`;
        html += `<a href="${post.url}" target="_blank" rel="noopener" class="mastodon-popup-link">View on Mastodon ↗</a>`;
        html += '</div></div>';
    });
    html += '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    const popup = document.getElementById('bookstats-mastodon-popup');

    const rect = anchorEl.getBoundingClientRect();

    // Measure popup height before committing to a position
    popup.style.visibility = 'hidden';
    popup.style.top = '0px';
    const popupHeight = popup.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const top = spaceBelow >= popupHeight || spaceBelow >= spaceAbove
        ? rect.bottom + window.scrollY + 6
        : rect.top + window.scrollY - popupHeight - 6;

    popup.style.top = top + 'px';
    popup.style.left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 310)) + 'px';
    popup.style.visibility = 'visible';

    popup.querySelector('.mastodon-popup-close').addEventListener('click', () => popup.remove());
    setTimeout(() => {
        document.addEventListener('click', function handler(e) {
            if (!popup.contains(e.target) && e.target !== anchorEl) {
                popup.remove();
                document.removeEventListener('click', handler);
            }
        });
    }, 0);
};

BookStats.createCalendarChart = async function(data) {
    const container = document.getElementById('bookstats-calendar');
    if (!container) return;

    // Filter books with valid dates
    const today = new Date();
    const todayText = BookStats.formatLocalDate(today);
    const booksWithDates = data
        .filter(book => book.startDate && (book.finishDate || book.currentlyReading))
        .map(book => {
            if (book.finishDate) return book;
            if (book.currentlyReading) {
                return {
                    ...book,
                    finishDate: todayText
                };
            }
            return book;
        });

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

    // Build cover map, language map and hashtag set from all books in current data.
    // Use book.hashtag if set, otherwise derive from the title.
    const bookCoverMap = {};
    const bookLanguageMap = {};
    const bookHashtagNames = [];
    data.forEach(book => {
        const tag = book.hashtag ? book.hashtag.normalize('NFKC').toLowerCase() : BookStats.titleToHashtag(book.name);
        const cover = BookStats.extractImageUrl(book.url || '');
        if (cover) bookCoverMap[tag] = cover;
        bookLanguageMap[tag] = (book.language || '').toLowerCase();
        bookHashtagNames.push(tag);
    });

    // Fetch Mastodon posts (cached after first call, gracefully skipped if not available)
    let mastodonPosts = {};
    try {
        if (typeof BookStats.fetchMastodonPosts === 'function') {
            mastodonPosts = await BookStats.fetchMastodonPosts(bookHashtagNames);
        }
    } catch (e) {
        console.warn('Mastodon fetch error:', e);
    }

    // Generate calendar for selected month
    html += BookStats.generateMonthCalendar(selectedYear, selectedMonth, booksWithDates, mastodonPosts, bookCoverMap, bookLanguageMap);

    container.innerHTML = html;

    // Wire up elephant buttons for Mastodon popups
    container.querySelectorAll('.calendar-mastodon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            BookStats.showMastodonPopup(btn.dataset.date, btn);
        });
    });

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

BookStats.formatLocalDate = function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to normalize image URLs (supports =IMAGE("...") formulas)
BookStats.extractImageUrl = function(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    // Handle Google Sheets IMAGE formula: =IMAGE("url", ...)
    const imageMatch = trimmed.match(/^=IMAGE\((.*)\)$/i);
    if (imageMatch && imageMatch[1]) {
        // Take the first argument before any comma
        const firstArg = imageMatch[1].split(',')[0].trim();
        const unquoted = firstArg.replace(/^['"]|['"]$/g, '');
        return unquoted.trim();
    }

    // Strip surrounding quotes if present
    return trimmed.replace(/^['"]|['"]$/g, '');
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
BookStats.finishedStickerUrl = function(language) {
    if (language.includes('korean'))      return 'https://notes.inhae.blog/wp-content/uploads/2026/04/IMG_5582.png';
    if (language.includes('japanese'))    return 'https://notes.inhae.blog/wp-content/uploads/2026/04/IMG_5581.png';
    if (language.includes('simplified'))  return 'https://notes.inhae.blog/wp-content/uploads/2026/04/IMG_5579.png';
    if (language.includes('chinese'))     return 'https://notes.inhae.blog/wp-content/uploads/2026/04/IMG_5580.png';
    return '';
};

BookStats.generateMonthCalendar = function(year, month, booksWithDates, mastodonPosts, bookCoverMap, bookLanguageMap) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Monday

    let html = '<div class="calendar-view">';

    // Calendar header with day names
    html += '<div class="calendar-header">';
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

    // Store posts by date for popup access
    BookStats._mastodonPostsForDay = mastodonPosts || {};

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const isToday = this.isSameDay(cellDate, new Date());
        const dateKey = BookStats.formatLocalDate(cellDate);
        const dayPosts = mastodonPosts && mastodonPosts[dateKey];

        const todayClass = isToday ? ' calendar-cell-today' : '';
        html += `<div class="calendar-cell${todayClass}">`;
        html += `<div class="calendar-date">${day}</div>`;
        if (dayPosts && dayPosts.length > 0) {
            const bookTag = dayPosts[0].bookTag;
            const coverUrl = bookCoverMap ? (bookCoverMap[bookTag.toLowerCase()] || '') : '';
            const isFinished = dayPosts.some(p => p.finished);
            if (isFinished) {
                const lang = bookLanguageMap ? (bookLanguageMap[bookTag.toLowerCase()] || '') : '';
                const stickerUrl = BookStats.finishedStickerUrl(lang);
                if (stickerUrl) {
                    html += `<img class="calendar-finished-badge" src="${stickerUrl}" alt="finished">`;
                } else {
                    html += `<span class="calendar-finished-badge">🎉</span>`;
                }
            }
            html += `<button class="calendar-mastodon-btn" data-date="${dateKey}" title="${isFinished ? 'Finished: ' : ''}#${bookTag}">`;
            html += `<div class="calendar-mastodon-cover-wrap">`;
            if (coverUrl) {
                html += `<img class="calendar-mastodon-cover" src="${coverUrl}" alt="${bookTag}">`;
            } else {
                html += `<span class="calendar-mastodon-cover calendar-mastodon-cover-empty">🐘</span>`;
            }
            html += `</div></button>`;
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
