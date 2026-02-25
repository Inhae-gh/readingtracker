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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #faf8f3;
        }
        .bookstats-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            font-size: 2.2em;
            font-weight: 300;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        h2 {
            color: #2c3e50;
            font-size: 1.1em;
            font-weight: 400;
            letter-spacing: 0.3px;
        }
        .chart-container {
            position: relative;
            width: 100%;
            max-width: 500px;
            height: auto;
            aspect-ratio: 1;
            margin: 30px auto;
        }
        @media (max-width: 768px) {
            .chart-container {
                max-width: 100%;
                margin: 20px auto;
            }
        }
        @media (max-width: 480px) {
            .bookstats-wrapper {
                padding: 15px;
            }
            .chart-container {
                max-width: 100%;
                margin: 15px auto;
            }
        }
        .breakdown {
            margin-top: 30px;
            padding: 20px;
            background-color: #fdfbf7;
            border-radius: 8px;
            border-left: 4px solid #d9c6a7;
        }
        .breakdown h2 {
            color: #2c3e50;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
        .authors-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14px;
        }
        .authors-table th,
        .authors-table td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
        }
        .authors-table th {
            font-size: 12px;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #555;
        }
        .authors-table tbody tr:hover {
            background-color: #fafafa;
        }
        .authors-count {
            text-align: right;
            font-weight: 600;
            color: #1976d2;
        }
        .authors-empty {
            text-align: center;
            color: #777;
            padding: 20px 0;
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
        .bookstats-tabs {
            display: flex;
            gap: 0;
            border-bottom: 2px solid #ddd;
            margin: 30px 0 0 0;
            flex-wrap: wrap;
        }
        .bookstats-tab {
            padding: 12px 24px;
            background-color: #f5f5f5;
            border: none;
            border-top: 2px solid transparent;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #666;
            transition: all 0.2s ease;
            position: relative;
            bottom: -2px;
        }
        .bookstats-tab:first-child {
            border-left: none;
        }
        .bookstats-tab:hover {
            background-color: #f0f0f0;
            color: #333;
        }
        .bookstats-tab.active {
            background-color: #ffffff;
            color: #1976d2;
            border-bottom: 2px solid #ffffff;
            border-top-color: #1976d2;
            font-weight: 600;
        }
        .bookstats-tab-content {
            display: none;
            padding-top: 30px;
        }
        .bookstats-tab-content.active {
            display: block;
        }
        .timeline-wrapper {
            overflow-x: auto;
        }
        .timeline-month-shortcuts {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            margin-bottom: 12px;
        }
        .timeline-month-button {
            border: 1px solid #c9c2b8;
            background-color: #fdfbf7;
            color: #3b3b3b;
            padding: 6px 10px;
            font-size: 12px;
            border-radius: 999px;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .timeline-month-button:hover {
            background-color: #f5efe6;
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
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
            overflow: visible;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .timeline-book-label {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .timeline-cover {
            position: absolute;
            top: 50%;
            left: 6px;
            width: 64px;
            height: 92px;
            border-radius: 4px;
            background-size: cover;
            background-position: center;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
            display: none;
            z-index: 2;
            transform: translateY(-50%);
        }
        .timeline-book:hover .timeline-cover {
            display: block;
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
            overflow: visible;
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
            position: relative;
            height: 20px;
            overflow: visible;
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
        .monthly-chart-container {
            position: relative;
            width: 100%;
            height: 400px;
            margin: 30px 0;
        }
        .calendar-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .calendar-controls label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        .calendar-month-select {
            padding: 8px 12px;
            border: 2px solid #1976d2;
            border-radius: 5px;
            font-size: 14px;
            background-color: white;
            color: #333;
            cursor: pointer;
            min-width: 200px;
            transition: border-color 0.2s;
        }
        .calendar-month-select:hover {
            border-color: #1565c0;
        }
        .calendar-month-select:focus {
            outline: none;
            border-color: #1565c0;
            box-shadow: 0 0 5px rgba(25, 118, 210, 0.3);
        }
        .calendar-view {
            max-width: 900px;
            margin: 0 auto;
        }
        .calendar-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 5px;
        }
        .calendar-day-name {
            text-align: center;
            font-weight: bold;
            padding: 10px;
            color: #555;
            font-size: 13px;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0;
            border: 1px solid #ddd;
        }
        .calendar-cell {
            min-height: 80px;
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 5px;
            background-color: #ffffff;
            position: relative;
        }
        .calendar-cell-empty {
            background-color: #f9f9f9;
        }
        .calendar-cell-today {
            background-color: #e3f2fd;
        }
        .calendar-date {
            font-weight: bold;
            font-size: 12px;
            color: #333;
            margin-bottom: 4px;
        }
        .calendar-lines {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 0 -5px;
            padding-top: 2px;
        }
        .calendar-language-row {
            height: 12px;
            display: flex;
            align-items: center;
        }
        .calendar-language-empty {
            opacity: 0.2;
        }
        .calendar-line {
            width: 100%;
            display: flex;
            align-items: center;
            height: 10px;
            cursor: pointer;
            transition: transform 0.15s ease;
            position: relative;
        }
        .calendar-line:hover {
            transform: scaleY(1.08);
            z-index: 2;
        }
        .calendar-line-body {
            flex: 1;
            height: 4px;
            border-radius: 0;
            background-color: #999;
            z-index: 1;
        }
        /* Offset the line a bit when a book starts on this day so the cover sits centered */
        .calendar-line-start .calendar-line-body {
            margin-left: 20px;
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
        }
        /* Stop the line a bit earlier on end dates so it doesn't touch the cell edge */
        .calendar-line-end .calendar-line-body {
            margin-right: 20px;
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
        }
        /* Cover thumbnail is centered over the start date and larger than before */
        .calendar-cover {
            width: 28px;
            height: 40px;
            border-radius: 3px;
            background-size: cover;
            background-position: center;
            border: 1px solid rgba(0, 0, 0, 0.15);
            transition: transform 0.12s ease, box-shadow 0.12s ease;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 3;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .calendar-cover-empty {
            background-color: #f0f0f0;
        }
        /* Enlarge cover on hover */
        .calendar-cover:hover {
            transform: translate(-50%, -50%) scale(1.9);
            z-index: 6;
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        }
        .calendar-line-korean .calendar-line-body {
            background-color: ${BookStats.colors.korean.bg};
        }
        .calendar-line-japanese .calendar-line-body {
            background-color: ${BookStats.colors.japanese.bg};
        }
        .calendar-line-chinese .calendar-line-body {
            background-color: ${BookStats.colors.chineseDark.bg};
        }
        .calendar-line-other .calendar-line-body {
            background-color: #999;
        }
        .covers-month-filter {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f8f8;
            border-radius: 8px;
        }
        .covers-month-filter label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        .covers-month-select {
            padding: 8px 12px;
            border: 2px solid #1976d2;
            border-radius: 5px;
            font-size: 14px;
            background-color: white;
            color: #333;
            cursor: pointer;
            min-width: 150px;
            transition: border-color 0.2s;
        }
        .covers-month-select:hover {
            border-color: #1565c0;
        }
        .covers-month-select:focus {
            outline: none;
            border-color: #1565c0;
            box-shadow: 0 0 5px rgba(25, 118, 210, 0.3);
        }
        .covers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 25px;
            padding: 20px 0;
        }
        @media (max-width: 768px) {
            .covers-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 20px;
            }
        }
        @media (max-width: 480px) {
            .covers-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
            }
        }
        .cover-item {
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border-radius: 8px;
            overflow: hidden;
            background-color: #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .cover-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .cover-image {
            width: 100%;
            aspect-ratio: 2 / 3;
            background-size: cover;
            background-position: center;
            background-color: #f0f0f0;
            border-bottom: 2px solid #e0e0e0;
        }
        .cover-image-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        .cover-details {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }
        .cover-title {
            font-weight: 600;
            font-size: 13px;
            color: #2c3e50;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-height: 33px;
        }
        .cover-author {
            font-size: 11px;
            color: #666;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .cover-date {
            font-size: 11px;
            color: #888;
            margin-top: auto;
        }
        .cover-language {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            color: white;
            text-align: center;
            margin-top: 4px;
            align-self: flex-start;
        }
    `;
    document.head.appendChild(style);
};

BookStats.createYearFilterDropdown = function(years) {
    const yearSelectStyle = document.createElement('style');
    yearSelectStyle.textContent = `
        .year-filter-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .year-filter-label {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        .year-filter-select {
            padding: 8px 12px;
            border: 2px solid #1976d2;
            border-radius: 5px;
            font-size: 14px;
            background-color: white;
            color: #333;
            cursor: pointer;
            min-width: 150px;
            transition: border-color 0.2s;
        }
        .year-filter-select:hover {
            border-color: #1565c0;
        }
        .year-filter-select:focus {
            outline: none;
            border-color: #1565c0;
            box-shadow: 0 0 5px rgba(25, 118, 210, 0.3);
        }
    `;
    document.head.appendChild(yearSelectStyle);
};

BookStats.initializeTabs = function() {
    const tabs = document.querySelectorAll('.bookstats-tab');
    const tabContents = document.querySelectorAll('.bookstats-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const activeContent = document.querySelector(`[data-tab-content="${tabName}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
};

BookStats.createAppStructure = function(years) {
    const root = document.getElementById('bookstats-root');
    
    let yearFilterHTML = '';
    if (years && years.length > 0) {
        const mostRecentYear = years[0];
        yearFilterHTML = `
        <div class="year-filter-container">
            <label class="year-filter-label">Filter by Year:</label>
            <select id="bookstats-yearFilter" class="year-filter-select">
                <option value="all">All Time</option>
                ${years.map(year => `<option value="${year}" ${year === mostRecentYear ? 'selected' : ''}>${year}</option>`).join('')}
            </select>
        </div>
        `;
    }
    
    root.innerHTML = `
        <div class="bookstats-wrapper">
            <h2 style="text-align: center; margin-bottom: 20px;" >Books by Language</h2>
            ${yearFilterHTML}
            
            <div id="bookstats-loading" class="loading">Loading data from Google Sheet...</div>
            <div id="bookstats-error" class="error" style="display: none;"></div>
            
            <div id="bookstats-content" style="display: none;">
                <div class="bookstats-tabs">
                    <button class="bookstats-tab active" data-tab="pie">Pie Chart</button>
                    <button class="bookstats-tab" data-tab="covers">Covers</button>
                    <button class="bookstats-tab" data-tab="authors">Authors</button>
                    <button class="bookstats-tab" data-tab="timeline">Timeline</button>
                    <button class="bookstats-tab" data-tab="duration">Duration</button>
                    <button class="bookstats-tab" data-tab="monthly">Monthly</button>
                    <button class="bookstats-tab" data-tab="calendar">Calendar</button>
                </div>

                <div class="bookstats-tab-content active" data-tab-content="pie">
                    <div class="chart-container">
                        <canvas id="bookstats-languageChart"></canvas>
                    </div>
                    
                    <div class="breakdown">
                        <h2>Books Read</h2>
                        <div id="bookstats-totalBooks" style="font-size: 20px; font-weight: bold; color: #1976d2;"></div>
                    </div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="covers">
                    <h2 style="text-align: center; margin-bottom: 30px;">Book Covers</h2>
                    <div id="bookstats-covers"></div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="authors">
                    <h2 id="bookstats-authorsTitle" style="text-align: center; margin-bottom: 20px;">Authors</h2>
                    <div id="bookstats-authors"></div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="timeline">
                    <h2 style="text-align: center; margin-bottom: 30px;">Timeline</h2>
                    <div id="bookstats-timeline"></div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="duration">
                    <h2 style="text-align: center; margin-bottom: 30px;">Book Duration</h2>
                    <div id="bookstats-durationChart"></div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="monthly">
                    <h2 style="text-align: center; margin-bottom: 30px;">Books and Pages per Month</h2>
                    <div class="monthly-chart-container">
                        <canvas id="bookstats-monthlyChart"></canvas>
                    </div>
                </div>

                <div class="bookstats-tab-content" data-tab-content="calendar">
                    <h2 style="text-align: center; margin-bottom: 30px;">Monthly Calendar View</h2>
                    <div id="bookstats-calendar"></div>
                </div>
            </div>
        </div>
    `;
};
