// BookStats Pie Chart - Pie chart visualization

window.BookStats = window.BookStats || {};

let pieChartInstance = null;

BookStats.createPieChart = function(data, selectedYear) {
    const pieTab = document.querySelector('[data-tab-content="pie"]');
    if (!pieTab) return;
    const chartContainer = pieTab.querySelector('.chart-container');
    if (!chartContainer) return;

    const parseDate = BookStats.parseLocalDate || (dateStr => new Date(dateStr));
    const selectedYearValue = selectedYear === 'all' ? 'all' : selectedYear.toString();
    const selectedYearNum = selectedYearValue === 'all' ? null : parseInt(selectedYearValue, 10);
    let filteredData = data;
    let monthFilterHTML = '';

    if (selectedYearValue !== 'all') {
        const availableMonths = BookStats.getAvailableMonthsForYear(data, selectedYearValue);
        if (availableMonths.length > 0) {
            const storedMonth = pieTab.dataset.selectedMonth || 'all';

            monthFilterHTML += '<div class="covers-month-filter">';
            monthFilterHTML += '<label for="pie-month-select">Filter by Month: </label>';
            monthFilterHTML += '<select id="pie-month-select" class="covers-month-select">';
            monthFilterHTML += '<option value="all">All Year</option>';

            availableMonths.forEach(monthNum => {
                const date = new Date(parseInt(selectedYearValue, 10), monthNum - 1, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                const selected = storedMonth === monthNum.toString() ? 'selected' : '';
                monthFilterHTML += `<option value="${monthNum}" ${selected}>${monthName}</option>`;
            });

            monthFilterHTML += '</select>';
            monthFilterHTML += '</div>';

            if (storedMonth !== 'all') {
                const selectedMonth = parseInt(storedMonth, 10);
                filteredData = data.filter(book => {
                    if (!book.finishDate) return false;
                    const finishDate = parseDate(book.finishDate);
                    return finishDate.getFullYear() === selectedYearNum &&
                        finishDate.getMonth() + 1 === selectedMonth;
                });
            }
        } else {
            pieTab.dataset.selectedMonth = 'all';
        }
    } else {
        pieTab.dataset.selectedMonth = 'all';
    }

    let filterHost = pieTab.querySelector('#bookstats-pie-month-filter');
    if (!filterHost) {
        filterHost = document.createElement('div');
        filterHost.id = 'bookstats-pie-month-filter';
        chartContainer.parentNode.insertBefore(filterHost, chartContainer);
    }
    filterHost.innerHTML = monthFilterHTML;

    const monthSelect = document.getElementById('pie-month-select');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            pieTab.dataset.selectedMonth = e.target.value;
            BookStats.createPieChart(data, selectedYearValue);
        });
    }

    const languageCounts = BookStats.processLanguageData(filteredData);
    const total = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    const totalElement = document.getElementById('bookstats-totalBooks');
    if (totalElement) {
        totalElement.textContent = total + ' books';
    }

    const ctx = document.getElementById('bookstats-languageChart').getContext('2d');
    
    const labels = [
        'Korean',
        'Japanese',
        'Traditional Chinese',
        'Simplified Chinese'
    ];

    const chartData = [
        languageCounts.korean,
        languageCounts.japanese,
        languageCounts.chineseTraditional,
        languageCounts.chineseSimplified
    ];

    const colors = BookStats.getChartColors();

    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: colors.bg,
                borderColor: colors.border,
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
                            size: window.innerWidth < 480 ? 12 : 14
                        },
                        padding: window.innerWidth < 480 ? 10 : 20
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
};
