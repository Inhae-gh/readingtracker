// BookStats - Main orchestrator
// This file loads all required modules and initializes the application.
// It can work standalone or with separately loaded module files.

window.BookStats = window.BookStats || {};

// Dynamic module loader
function loadBookstatsModules() {
    const modules = [
        'bookstats-common.js',
        'bookstats-data-fetcher.js',
        'bookstats-ui.js',
        'bookstats-chart-pie.js',
        'bookstats-chart-timeline.js',
        'bookstats-chart-duration.js'
    ];

    // Check which modules are already loaded by checking for key functions
    const requiredModules = [];
    
    if (!window.BookStats.colors) requiredModules.push('bookstats-common.js');
    if (!window.BookStats.fetchSheetData) requiredModules.push('bookstats-data-fetcher.js');
    if (!window.BookStats.injectStyles) requiredModules.push('bookstats-ui.js');
    if (!window.BookStats.createPieChart) requiredModules.push('bookstats-chart-pie.js');
    if (!window.BookStats.createTimelineChart) requiredModules.push('bookstats-chart-timeline.js');
    if (!window.BookStats.createDurationChart) requiredModules.push('bookstats-chart-duration.js');

    // Load missing modules
    requiredModules.forEach(module => {
        const script = document.createElement('script');
        script.src = module;
        script.async = false;
        document.head.appendChild(script);
    });
}

// Initialize application
async function initializeBookStats() {
    try {
        // Ensure all modules are loaded
        if (!window.BookStats.colors) {
            loadBookstatsModules();
            // Give modules time to load
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Inject styles and create UI
        BookStats.injectStyles();
        
        // Validate that sheet ID is provided
        if (!GOOGLE_SHEET_ID && !GOOGLE_SHEET_CSV_URL) {
            BookStats.showError('Please set GOOGLE_SHEET_ID or GOOGLE_SHEET_CSV_URL in index.html');
            return;
        }

        // Fetch data from Google Sheet
        const allData = await BookStats.fetchSheetData();
        
        if (!allData || allData.length === 0) {
            BookStats.showError('No data found in the Google Sheet');
            return;
        }

        // Extract available years
        const years = BookStats.extractYears(allData);
        
        // Create UI with year filter dropdown
        BookStats.createAppStructure(years);
        BookStats.createYearFilterDropdown(years);
        
        // Function to update all charts with filtered data
        const updateCharts = (selectedYear) => {
            const filteredData = BookStats.filterDataByYear(allData, selectedYear);
            
            // Process data to count books by language
            const languageCounts = BookStats.processLanguageData(filteredData);

            // Create/update charts
            BookStats.createPieChart(languageCounts);
            BookStats.createTimelineChart(filteredData);
            BookStats.createDurationChart(filteredData);

            // Display total books
            const total = Object.values(languageCounts).reduce((a, b) => a + b, 0);
            document.getElementById('bookstats-totalBooks').textContent = total + ' books';
        };
        
        // Show content and hide loading
        document.getElementById('bookstats-loading').style.display = 'none';
        document.getElementById('bookstats-content').style.display = 'block';
        
        // Initial chart creation with most recent year selected
        const mostRecentYear = years.length > 0 ? years[0] : 'all';
        updateCharts(mostRecentYear);
        
        // Add event listener for year filter dropdown
        const yearFilter = document.getElementById('bookstats-yearFilter');
        if (yearFilter) {
            yearFilter.addEventListener('change', (event) => {
                updateCharts(event.target.value);
            });
        }

    } catch (error) {
        console.error('BookStats Error:', error);
        BookStats.showError(`Failed to load data: ${error.message}`);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeBookStats);

