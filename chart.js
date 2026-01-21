// Chart.js - Handles data fetching and chart creation

let chartInstance = null;

async function initializeChart() {
    try {
        // Validate that sheet ID is provided
        if (!GOOGLE_SHEET_ID && !GOOGLE_SHEET_CSV_URL) {
            showError('Please set GOOGLE_SHEET_ID or GOOGLE_SHEET_CSV_URL in index.html');
            return;
        }

        // Fetch data from Google Sheet
        const data = await fetchSheetData();
        
        if (!data || data.length === 0) {
            showError('No data found in the Google Sheet');
            return;
        }

        // Process data to count books by language
        const languageCounts = processLanguageData(data);

        // Create the pie chart
        createChart(languageCounts);
        
        // Create the timeline
        createTimeline(data);

        // Create the duration chart
        createDurationChart(data);

        // Show content and hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        
        // Display total books
        const total = Object.values(languageCounts).reduce((a, b) => a + b, 0);
        document.getElementById('totalBooks').textContent = total + ' books';

    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to load data: ${error.message}`);
    }
}

async function fetchSheetData() {
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
        return parseCSV(csv);

    } catch (error) {
        // Fallback for CORS issues - try using a proxy or provide instructions
        console.error('Fetch error:', error);
        throw new Error(
            'Could not fetch the sheet. Make sure:\n' +
            '1. The sheet is publicly accessible\n' +
            '2. You\'ve shared the sheet with "Anyone with the link can view" permissions\n' +
            '3. The GOOGLE_SHEET_ID is correct'
        );
    }
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
        return [];
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const languageIndex = headers.findIndex(h => h.toLowerCase() === 'language');
    const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
    const startDateIndex = headers.findIndex(h => h.toLowerCase() === 'startdate');
    const finishDateIndex = headers.findIndex(h => h.toLowerCase() === 'finishdate');

    if (languageIndex === -1) {
        throw new Error('Could not find "language" column in the sheet');
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
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
}

function parseCSVLine(line) {
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
}

function processLanguageData(data) {
    const counts = {
        korean: 0,
        japanese: 0,
        chineseTraditional: 0,
        chineseSimplified: 0
    };

    data.forEach(entry => {
        const lang = entry.language.toLowerCase();

        if (lang.includes('korean')) {
            counts.korean++;
        } else if (lang.includes('japanese')) {
            counts.japanese++;
        } else if (lang.includes('traditional')) {
            counts.chineseTraditional++;
        } else if (lang.includes('simplified')) {
            counts.chineseSimplified++;
        }
    });

    return counts;
}

function createChart(languageCounts) {
    const ctx = document.getElementById('languageChart').getContext('2d');
    
    const labels = [
        'Korean',
        'Japanese',
        'Traditional Chinese',
        'Simplified Chinese'
    ];

    const data = [
        languageCounts.korean,
        languageCounts.japanese,
        languageCounts.chineseTraditional,
        languageCounts.chineseSimplified
    ];

    // Colors: Korean (red), Japanese (blue), Traditional Chinese (light gold), Simplified Chinese (dark gold)
    const colors = ['#FF6384', '#36A2EB', '#FFE082', '#FFC107'];
    const borderColors = ['#FF4560', '#2E7FD6', '#FFD54F', '#FFA000'];

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} books (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function createTimeline(data) {
    // Normalize languages: combine Traditional and Simplified Chinese
    const normalizedData = data.map(book => ({
        ...book,
        normalizedLanguage: normalizeLanguage(book.language)
    }));

    // Filter books with valid dates
    const booksWithDates = normalizedData.filter(book => book.startDate && book.finishDate);

    if (booksWithDates.length === 0) {
        document.getElementById('timeline').innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
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
    const pixelsPerDay = 600 / totalDays; // 600px width for timeline

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
            // Book occupies only half of start and end days, leaving room for other books
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
    document.getElementById('timeline').innerHTML = timelineHTML;
}

function normalizeLanguage(language) {
    const lang = language.toLowerCase();
    if (lang.includes('korean')) return 'Korean';
    if (lang.includes('japanese')) return 'Japanese';
    if (lang.includes('traditional') || lang.includes('simplified') || lang.includes('chinese')) return 'Chinese';
    return 'Other';
}

function createDurationChart(data) {
    // Calculate duration for each book
    const booksWithDuration = data
        .filter(book => book.startDate && book.finishDate)
        .map(book => {
            const startDate = new Date(book.startDate);
            const finishDate = new Date(book.finishDate);
            const days = Math.max(1, Math.round((finishDate - startDate) / (1000 * 60 * 60 * 24)));
            
            return {
                name: book.name,
                language: normalizeLanguage(book.language),
                days: days
            };
        })
        .sort((a, b) => b.days - a.days); // Sort by duration, longest first

    if (booksWithDuration.length === 0) {
        document.getElementById('durationChart').innerHTML = '<p style="color: #999; text-align: center;">No books with dates available</p>';
        return;
    }

    // Find max duration for scaling
    const maxDays = Math.max(...booksWithDuration.map(b => b.days));

    // Create chart HTML
    let chartHTML = '<div class="duration-chart">';

    booksWithDuration.forEach(book => {
        const widthPercent = (book.days / maxDays) * 100;
        const barClass = `duration-bar duration-bar-${book.language.toLowerCase()}`;
        const displayDays = book.days === 1 ? '1 day' : `${book.days} days`;

        chartHTML += `
            <div class="duration-row">
                <div class="duration-label" title="${book.name}">${book.name}</div>
                <div class="duration-bar-container">
                    <div class="${barClass}" style="width: ${widthPercent}%;" title="${book.language} - ${displayDays}">
                        ${displayDays}
                    </div>
                </div>
            </div>
        `;
    });

    chartHTML += '</div>';
    document.getElementById('durationChart').innerHTML = chartHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeChart);
