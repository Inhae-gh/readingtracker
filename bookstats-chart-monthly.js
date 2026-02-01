// BookStats Monthly Chart - Books and pages per month visualization

window.BookStats = window.BookStats || {};

let monthlyChartInstance = null;

BookStats.createMonthlyChart = function(data) {
    // Filter books with finish dates
    const booksWithFinishDate = data.filter(book => book.finishDate);

    if (booksWithFinishDate.length === 0) {
        document.getElementById('bookstats-monthlyChart').innerHTML = '<p style="color: #999; text-align: center;">No books with finish dates available</p>';
        return;
    }

    // Group books by month
    const monthlyData = {};
    
    booksWithFinishDate.forEach(book => {
        try {
            const finishDate = new Date(book.finishDate);
            const year = finishDate.getFullYear();
            const month = finishDate.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    books: 0,
                    pages: 0,
                    date: finishDate
                };
            }
            
            monthlyData[monthKey].books++;
            monthlyData[monthKey].pages += book.pages || 0;
        } catch (e) {
            // Invalid date, skip
        }
    });

    // Sort by date
    const sortedMonths = Object.keys(monthlyData)
        .sort()
        .slice(-24); // Show last 24 months

    const labels = sortedMonths.map(key => {
        const date = monthlyData[key].date;
        return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    });

    const bookCounts = sortedMonths.map(key => monthlyData[key].books);
    const pageCounts = sortedMonths.map(key => monthlyData[key].pages);

    const ctx = document.getElementById('bookstats-monthlyChart').getContext('2d');

    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Books Read',
                    data: bookCounts,
                    backgroundColor: 'rgba(174, 192, 207, 0.7)',
                    borderColor: 'rgba(174, 192, 207, 1)',
                    borderWidth: 2,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Pages Read',
                    data: pageCounts,
                    type: 'line',
                    borderColor: 'rgba(158, 132, 114, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(158, 132, 114, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    yAxisID: 'y1',
                    fill: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Books',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Pages',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
};
