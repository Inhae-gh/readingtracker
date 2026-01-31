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
    const languageIndex = headers.findIndex(h => h.toLowerCase() === 'language');
    const nameIndex = headers.findIndex(h => h.toLowerCase() === 'title');
    const startDateIndex = headers.findIndex(h => h.toLowerCase() === 'started');
    const finishDateIndex = headers.findIndex(h => h.toLowerCase() === 'finished');

    if (languageIndex === -1) {
        throw new Error('Could not find "language" column in the sheet');
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = BookStats.parseCSVLine(lines[i]);
            if (values[languageIndex]) {
                data.push({
                    name: nameIndex !== -1 ? values[nameIndex].trim() : `Book ${i}`,
                    language: values[languageIndex].trim(),
                    startDate: startDateIndex !== -1 ? values[startDateIndex].trim() : '',
                    finishDate: finishDateIndex !== -1 ? values[finishDateIndex].trim() : ''
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
