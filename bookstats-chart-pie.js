// BookStats Pie Chart - Pie chart visualization

window.BookStats = window.BookStats || {};

let pieChartInstance = null;

BookStats.createPieChart = function(languageCounts) {
    const ctx = document.getElementById('bookstats-languageChart').getContext('2d');
    
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

    const colors = BookStats.getChartColors();

    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
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
};
