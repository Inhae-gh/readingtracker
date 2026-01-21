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

        // Create the chart
        createChart(languageCounts);

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
                    language: values[languageIndex].trim()
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeChart);
