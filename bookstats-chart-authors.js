// BookStats Authors Table - Authors with counts

window.BookStats = window.BookStats || {};

BookStats.createAuthorTable = function(data, selectedYear) {
    const authorsContainer = document.getElementById('bookstats-authors');
    const authorsTitle = document.getElementById('bookstats-authorsTitle');

    if (!authorsContainer || !authorsTitle) return;

    const titleSuffix = selectedYear && selectedYear !== 'all' ? `(${selectedYear})` : '(All Time)';
    authorsTitle.textContent = `Authors ${titleSuffix}`;

    const counts = new Map();

    data.forEach(book => {
        const rawAuthor = (book.author || '').trim();
        if (!rawAuthor) return;

        // Treat comma and semicolon as multi-author separators.
        const authors = rawAuthor.split(/[,;]+/).map(author => author.trim()).filter(Boolean);
        authors.forEach(author => {
            const current = counts.get(author) || 0;
            counts.set(author, current + 1);
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
            <tr>
                <td>${author}</td>
                <td class="authors-count">${count}</td>
            </tr>
        `;
    }).join('');

    authorsContainer.innerHTML = `
        <table class="authors-table">
            <thead>
                <tr>
                    <th>Author</th>
                    <th class="authors-count">Books</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
};
