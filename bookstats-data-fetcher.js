// BookStats Data Fetcher - Handles Google Sheets data fetching and parsing

window.BookStats = window.BookStats || {};

BookStats.fetchSheetData = async function() {
    let csvUrl;

    if (GOOGLE_SHEET_CSV_URL) {
        csvUrl = GOOGLE_SHEET_CSV_URL;
    } else if (GOOGLE_SHEET_ID) {
        // Construct Google Sheets CSV export URL
        csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;
    } else {
        throw new Error('No sheet configuration provided');
    }

    try {
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csv = await response.text();
        return BookStats.parseCSV(csv);

    } catch (error) {
        console.error('Fetch error:', error);
        throw new Error(
            'Could not fetch the sheet. Make sure:\n' +
            '1. The sheet is publicly accessible\n' +
            '2. You\'ve shared the sheet with "Anyone with the link can view" permissions\n' +
            '3. The GOOGLE_SHEET_ID is correct'
        );
    }
};

BookStats.parseCSV = function(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
        return [];
    }

    // Parse header
    const headers = BookStats.parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const languageIndex = normalizedHeaders.findIndex(h => h === 'language');
    const nameIndex = normalizedHeaders.findIndex(h => h === 'title');
    const startDateIndex = normalizedHeaders.findIndex(h => h === 'started');
    const finishDateIndex = normalizedHeaders.findIndex(h => h === 'finished');
    const pagesIndex = normalizedHeaders.findIndex(h => h === 'pages');
    const dnfIndex = normalizedHeaders.findIndex(h => h === 'dnf');
    const urlIndex = normalizedHeaders.findIndex(h => h === 'url');
    const authorIndex = normalizedHeaders.findIndex(h => h === 'author' || h === 'authors');

    if (languageIndex === -1) {
        throw new Error('Could not find "language" column in the sheet');
    }

    if (urlIndex === -1) {
        console.warn('Warning: Could not find "url" column in the sheet');
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = BookStats.parseCSVLine(lines[i]);
            if (values[languageIndex]) {
                const dnfValue = dnfIndex !== -1 ? values[dnfIndex].trim().toLowerCase() : '';
                const isDNF = dnfValue === 'true' || dnfValue === 'yes' || dnfValue === '1' || dnfValue === 'x';
                
                data.push({
                    name: nameIndex !== -1 ? values[nameIndex].trim() : `Book ${i}`,
                    language: values[languageIndex].trim(),
                    startDate: startDateIndex !== -1 ? values[startDateIndex].trim() : '',
                    finishDate: finishDateIndex !== -1 ? values[finishDateIndex].trim() : '',
                    pages: pagesIndex !== -1 ? parseInt(values[pagesIndex].trim()) || 0 : 0,
                    author: authorIndex !== -1 ? values[authorIndex].trim() : '',
                    url: urlIndex !== -1 ? values[urlIndex].trim() : '',
                    dnf: isDNF
                });
            }
        }
    }

    return data;
};

BookStats.parseCSVLine = function(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
};

// Extract all years from data
BookStats.extractYears = function(data) {
    const yearsSet = new Set();
    
    data.forEach(book => {
        // Check start date
        if (book.startDate) {
            try {
                const year = new Date(book.startDate).getFullYear();
                if (!isNaN(year)) yearsSet.add(year);
            } catch (e) {
                // Invalid date, skip
            }
        }
        
        // Check finish date
        if (book.finishDate) {
            try {
                const year = new Date(book.finishDate).getFullYear();
                if (!isNaN(year)) yearsSet.add(year);
            } catch (e) {
                // Invalid date, skip
            }
        }
    });
    
    // Sort years in descending order
    return Array.from(yearsSet).sort((a, b) => b - a);
};

// Filter data by year (include books where start or end date is in the year)
BookStats.filterDataByYear = function(data, year) {
    if (year === 'all') {
        return data;
    }
    
    const yearNum = parseInt(year);
    
    return data.filter(book => {
        // Check only finish date
        if (book.finishDate) {
            try {
                const bookYear = new Date(book.finishDate).getFullYear();
                if (bookYear === yearNum) return true;
            } catch (e) {
                // Invalid date, skip
            }
        }
        
        return false;
    });
};

// Remove DNF (Did Not Finish) books from data
BookStats.removeDNFBooks = function(data) {
    return data.filter(book => !book.dnf);
};
