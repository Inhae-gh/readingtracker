// Chart.js - Handles data fetching, styling, and chart creation

// Inject styles
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .chart-container {
            position: relative;
            width: 500px;
            height: 500px;
            margin: 30px auto;
        }
        .breakdown {
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .breakdown h2 {
            color: #333;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .breakdown-item:last-child {
            border-bottom: none;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .error {
            color: #d32f2f;
            padding: 20px;
            background-color: #ffebee;
            border-radius: 5px;
            margin: 20px 0;
        }
        .timeline-wrapper {
            overflow-x: auto;
        }
        .timeline-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 30px;
        }
        .timeline-language {
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        .timeline-label {
            font-weight: bold;
            color: #333;
            font-size: 14px;
            min-width: 80px;
            padding-top: 5px;
        }
        .timeline-track {
            position: relative;
            flex: 1;
            min-width: 600px;
            height: 60px;
            background-color: #f5f5f5;
            border-radius: 5px;
            border: 1px solid #ddd;
            padding: 5px;
            overflow: visible;
        }
        .timeline-book {
            position: absolute;
            height: 50px;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            color: white;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
            display: flex;
            align-items: center;
        }
        .timeline-book:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .timeline-book-korean {
            background-color: #FF6384;
        }
        .timeline-book-japanese {
            background-color: #36A2EB;
        }
        .timeline-book-chinese {
            background-color: #FFC107;
        }
        .timeline-axis {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
        }
        .timeline-axis-label {
            min-width: 80px;
        }
        .timeline-axis-track {
            flex: 1;
            min-width: 600px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #666;
            padding: 0 5px;
        }
        .timeline-tooltip {
            position: absolute;
            background-color: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            white-space: nowrap;
            pointer-events: none;
        }
        .duration-chart {
            max-width: 100%;
            overflow-x: auto;
        }
        .duration-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            gap: 10px;
        }
        .duration-label {
            min-width: 150px;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .duration-bar-container {
            flex: 1;
            display: flex;
            align-items: center;
            height: 24px;
        }
        .duration-bar {
            height: 100%;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 6px;
            color: white;
            font-size: 11px;
            font-weight: bold;
        }
        .duration-bar-korean {
            background-color: #FF6384;
        }
        .duration-bar-japanese {
            background-color: #36A2EB;
        }
        .duration-bar-chinese {
            background-color: #FFC107;
        }
    `;
    document.head.appendChild(style);
}

// Create the initial app HTML structure
function createAppStructure() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <h1>📚 Books by Language</h1>
            
            <div id="loading" class="loading">Loading data from Google Sheet...</div>
            <div id="error" class="error" style="display: none;"></div>
            
            <div id="content" style="display: none;">
                <div class="chart-container">
                    <canvas id="languageChart"></canvas>
                </div>
                
                <div class="breakdown">
                    <h2>Total Books:</h2>
                    <div id="totalBooks" style="font-size: 20px; font-weight: bold; color: #1976d2;"></div>
                </div>

                <div style="margin-top: 50px; border-top: 2px solid #ddd; padding-top: 30px;">
                    <h2 style="text-align: center; color: #333;">📖 Reading Timeline</h2>
                    <div id="timeline" style="margin-top: 30px;"></div>
                </div>

                <div style="margin-top: 50px; border-top: 2px solid #ddd; padding-top: 30px;">
                    <h2 style="text-align: center; color: #333;">📊 Books by Duration</h2>
                    <div id="durationChart" style="margin-top: 30px;"></div>
                </div>
            </div>
        </div>
    `;
}

let chartInstance = null;

async function initializeChart() {
    try {
        // Inject styles first
        injectStyles();
        
        // Create initial HTML structure
        createAppStructure();
        
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
