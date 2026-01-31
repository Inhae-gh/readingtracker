// BookStats UI - Styling and DOM manipulation

window.BookStats = window.BookStats || {};

BookStats.injectStyles = function() {
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
        .bookstats-wrapper {
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
            background-color: ${BookStats.colors.korean.bg};
        }
        .timeline-book-japanese {
            background-color: ${BookStats.colors.japanese.bg};
        }
        .timeline-book-chinese {
            background-color: ${BookStats.colors.chineseDark.bg};
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
            background-color: ${BookStats.colors.korean.bg};
        }
        .duration-bar-japanese {
            background-color: ${BookStats.colors.japanese.bg};
        }
        .duration-bar-chinese {
            background-color: ${BookStats.colors.chineseDark.bg};
        }
    `;
    document.head.appendChild(style);
};

BookStats.createAppStructure = function() {
    const root = document.getElementById('bookstats-root');
    root.innerHTML = `
        <div class="bookstats-wrapper">
            <h1>📚 Books by Language</h1>
            
            <div id="bookstats-loading" class="loading">Loading data from Google Sheet...</div>
            <div id="bookstats-error" class="error" style="display: none;"></div>
            
            <div id="bookstats-content" style="display: none;">
                <div class="chart-container">
                    <canvas id="bookstats-languageChart"></canvas>
                </div>
                
                <div class="breakdown">
                    <h2>Total Books:</h2>
                    <div id="bookstats-totalBooks" style="font-size: 20px; font-weight: bold; color: #1976d2;"></div>
                </div>

                <div style="margin-top: 50px; border-top: 2px solid #ddd; padding-top: 30px;">
                    <h2 style="text-align: center; color: #333;">📖 Reading Timeline</h2>
                    <div id="bookstats-timeline" style="margin-top: 30px;"></div>
                </div>

                <div style="margin-top: 50px; border-top: 2px solid #ddd; padding-top: 30px;">
                    <h2 style="text-align: center; color: #333;">📊 Books by Duration</h2>
                    <div id="bookstats-durationChart" style="margin-top: 30px;"></div>
                </div>
            </div>
        </div>
    `;
};
