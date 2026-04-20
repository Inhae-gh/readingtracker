// BookStats Authors Table - Authors with counts and clickable book popup

window.BookStats = window.BookStats || {};

BookStats.createAuthorTable = function(data, selectedYear) {
    const authorsContainer = document.getElementById('bookstats-authors');
    const authorsTitle = document.getElementById('bookstats-authorsTitle');

    if (!authorsContainer || !authorsTitle) return;

    const titleSuffix = selectedYear && selectedYear !== 'all' ? `(${selectedYear})` : '(All Time)';
    authorsTitle.textContent = `Authors ${titleSuffix}`;

    const counts = new Map();
    const authorBooks = new Map();

    data.forEach(book => {
        const rawAuthor = (book.author || '').trim();
        if (!rawAuthor) return;

        const authors = rawAuthor.split(/[,;]+/).map(a => a.trim()).filter(Boolean);
        authors.forEach(author => {
            counts.set(author, (counts.get(author) || 0) + 1);
            if (!authorBooks.has(author)) authorBooks.set(author, []);
            authorBooks.get(author).push(book);
        });
    });

    if (counts.size === 0) {
        authorsContainer.innerHTML = '<div class="authors-empty">No author data available for this selection.</div>';
        return;
    }

    const sortedAuthors = Array.from(counts.entries())
        .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

    const rows = sortedAuthors.map(([author, count]) => {
        return `
            <tr class="author-row" data-author="${BookStats.escapeHtml(author)}">
                <td>${BookStats.escapeHtml(author)}</td>
                <td class="authors-count">${count}</td>
            </tr>
        `;
    }).join('');

    authorsContainer.innerHTML = `
        <div class="authors-table-wrap">
        <table class="authors-table">
            <colgroup>
                <col class="authors-col-author">
                <col class="authors-col-count">
            </colgroup>
            <thead>
                <tr>
                    <th>Author</th>
                    <th class="authors-count">Books</th>
                </tr>
            </thead>
            <tbody id="authors-tbody">
                ${rows}
            </tbody>
        </table>
        </div>
    `;

    document.getElementById('authors-tbody').addEventListener('click', function(e) {
        const row = e.target.closest('.author-row');
        if (!row) return;
        const author = row.dataset.author;
        BookStats.showAuthorModal(author, authorBooks.get(author) || []);
    });
};

BookStats.showAuthorModal = function(author, books) {
    const existing = document.getElementById('author-modal');
    if (existing) existing.remove();

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return dateStr;
    };

    const booksHtml = books.map(book => {
        const coverUrl = BookStats.extractImageUrl(book.url);
        const color = BookStats.getLanguageColor ? BookStats.getLanguageColor(book.language) : '#9e6d6d';

        const startFormatted = formatDate(book.startDate);
        const finishFormatted = formatDate(book.finishDate);

        let dateText = '';
        if (startFormatted && finishFormatted) {
            dateText = `${startFormatted} → ${finishFormatted}`;
        } else if (startFormatted) {
            dateText = `Started ${startFormatted}`;
        }

        const pagesText = book.pages ? `${book.pages.toLocaleString()} pages` : '';

        const coverHtml = coverUrl
            ? `<div class="author-modal-cover" style="background-image: url('${coverUrl}')"></div>`
            : `<div class="author-modal-cover author-modal-cover-placeholder" style="background-color: ${color}"></div>`;

        const linkHtml = book.link
            ? `<a href="${BookStats.escapeHtml(book.link)}" target="_blank" rel="noopener noreferrer" class="author-modal-link">Read more →</a>`
            : '';

        return `
            <div class="author-modal-book">
                ${coverHtml}
                <div class="author-modal-details">
                    <div class="author-modal-title">${BookStats.escapeHtml(book.name)}</div>
                    <div class="author-modal-meta">
                        <span class="author-modal-lang" style="background-color: ${color}">${BookStats.escapeHtml(book.language)}</span>
                        ${book.favorite ? '<span class="author-modal-fav">★ Favourite</span>' : ''}
                    </div>
                    ${dateText ? `<div class="author-modal-dates">${dateText}</div>` : ''}
                    ${pagesText ? `<div class="author-modal-pages">${pagesText}</div>` : ''}
                    ${linkHtml}
                </div>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'author-modal';
    modal.className = 'author-modal-overlay';
    modal.innerHTML = `
        <div class="author-modal-card">
            <div class="author-modal-header">
                <h3 class="author-modal-name">${BookStats.escapeHtml(author)}</h3>
                <button class="author-modal-close" aria-label="Close">&#x2715;</button>
            </div>
            <div class="author-modal-body">
                ${booksHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add('author-modal-visible'));

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('.author-modal-close').addEventListener('click', () => modal.remove());

    const onKeydown = e => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', onKeydown);
        }
    };
    document.addEventListener('keydown', onKeydown);
};
