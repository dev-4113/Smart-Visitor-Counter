
// SMART VISITOR COUNTER
// MySQL Backend Connected Version

const API_URL = "http://localhost:5000/api/visitors";

let allVisitors = [];
let visitorChart = null;

// DOM ELEMENTS
const totalVisitors = document.getElementById("totalVisitors");
const todayVisitors = document.getElementById("todayVisitors");
const weeklyVisitors = document.getElementById("weeklyVisitors");
const latestActivity = document.getElementById("latestActivity");
const liveCounter = document.getElementById("liveCounter");
const activityTable = document.getElementById("activityTable");

const visitorButton = document.getElementById("visitorButton");
const visitorSearch = document.getElementById("visitorSearch");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");

// DATE HELPERS
function getDateKey(value) {
    if (!value) return "";

    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
}

function getTodayKey() {
    return getDateKey(new Date());
}

function getDateDaysAgo(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);

    return getDateKey(date);
}

// LOAD VISITORS FROM MYSQL
async function loadVisitors() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch visitor data");
        }

        const data = await response.json();

        allVisitors = Array.isArray(data.visitors)
            ? data.visitors
            : (Array.isArray(data) ? data : []);

        console.log("Visitors Loaded:", allVisitors.length);

        updateDashboard();
        updateChart();
        applyFilters();

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}
// LOAD VISITOR ACTIVITY LOGS
async function loadActivities() {

    try {

        const response = await fetch("http://localhost:5000/api/activities");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load activities");
        }

        const activities = data.activities || [];

        activityTable.innerHTML = "";

        if (activities.length === 0) {
            activityTable.innerHTML = `
                <tr>
                    <td colspan="4">No recent activity found</td>
                </tr>
            `;
            return;
        }

        activities.forEach(item => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.visitor_id}</td>
                <td>${item.activity}</td>
                <td>${new Date(item.activity_time).toLocaleString()}</td>
            `;

            activityTable.appendChild(row);

        });

    } catch (error) {

        console.error("Activity Loading Error:", error);

    }

}

// UPDATE DASHBOARD STATISTICS
function updateDashboard() {
    const today = getTodayKey();
    const lastSevenDays = getDateDaysAgo(6);

    const todayCount = allVisitors.filter(visitor =>
        getDateKey(visitor.visit_date) === today
    ).length;

    const weeklyCount = allVisitors.filter(visitor => {
        const date = getDateKey(visitor.visit_date);
        return date >= lastSevenDays && date <= today;
    }).length;

    totalVisitors.textContent = allVisitors.length;
    todayVisitors.textContent = todayCount;
    weeklyVisitors.textContent = weeklyCount;
    liveCounter.textContent = allVisitors.length;

    latestActivity.textContent = allVisitors.length
        ? `${getDateKey(allVisitors[0].visit_date)} ${allVisitors[0].visit_time || ""}`
        : "No activity yet";
}

// REGISTER NEW VISITOR
async function addVisitor() {
    try {
        visitorButton.disabled = true;
        visitorButton.textContent = "Registering...";

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Visitor registration failed");
        }

        console.log("Registration Result:", result);

        await loadVisitors();

        alert("Visitor registered successfully!");

    } catch (error) {
        console.error("Registration Error:", error);
        alert("Unable to register visitor: " + error.message);

    } finally {
        visitorButton.disabled = false;
        visitorButton.textContent = "+ Register Visitor";
    }
}

// DISPLAY VISITOR TABLE
function updateActivityTable(visitors) {
    activityTable.innerHTML = "";

    const recentVisitors = visitors.slice(0, 8);

    if (recentVisitors.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No visitor records found.";

        row.appendChild(cell);
        activityTable.appendChild(row);
        return;
    }

    recentVisitors.forEach(visitor => {
        const row = document.createElement("tr");

        const values = [
            visitor.visitor_id,
            getDateKey(visitor.visit_date),
            visitor.visit_time,
            visitor.source,
            visitor.status
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        activityTable.appendChild(row);
    });
}

// SEARCH VISITORS
function searchVisitors() {
    applyFilters();
}

// DATE FILTER
function filterVisitors() {
    applyFilters();
}

// APPLY SEARCH AND DATE FILTERS TOGETHER
function applyFilters() {
    const searchText = visitorSearch.value.trim().toLowerCase();
    const startDate = fromDate.value;
    const endDate = toDate.value;

    const filteredVisitors = allVisitors.filter(visitor => {
        const visitorID = String(visitor.visitor_id || "").toLowerCase();
        const visitDate = getDateKey(visitor.visit_date);

        const matchesSearch = visitorID.includes(searchText);
        const matchesStart = !startDate || visitDate >= startDate;
        const matchesEnd = !endDate || visitDate <= endDate;

        return matchesSearch && matchesStart && matchesEnd;
    });

    updateActivityTable(filteredVisitors);
}

// CLEAR FILTERS
function clearFilters() {
    visitorSearch.value = "";
    fromDate.value = "";
    toDate.value = "";

    applyFilters();
}

// UPDATE VISITOR CHART
function updateChart() {
    const canvas = document.getElementById("visitorChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const labels = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
        const date = getDateDaysAgo(i);

        labels.push(date);

        const count = allVisitors.filter(visitor =>
            getDateKey(visitor.visit_date) === date
        ).length;

        counts.push(count);
    }

    if (visitorChart) {
        visitorChart.data.labels = labels;
        visitorChart.data.datasets[0].data = counts;
        visitorChart.update();
        return;
    }

    visitorChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Visitors",
                data: counts,
                borderColor: "#00d4ff",
                backgroundColor: "rgba(0, 212, 255, 0.12)",
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#aaaaaa"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "#aaaaaa"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    });
}

// EXPORT VISITORS TO CSV
function exportVisitors() {
    if (allVisitors.length === 0) {
        alert("No visitor data available to export.");
        return;
    }

    const headers = [
        "Visitor ID",
        "Visit Date",
        "Visit Time",
        "Source",
        "Status"
    ];

    const rows = allVisitors.map(visitor => [
        visitor.visitor_id,
        getDateKey(visitor.visit_date),
        visitor.visit_time,
        visitor.source,
        visitor.status
    ]);

    function escapeCSV(value) {
        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    }

    const csvContent = [
        headers,
        ...rows
    ].map(row =>
        row.map(escapeCSV).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "visitor_report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// INITIALIZE DASHBOARD
// Script is loaded dynamically after admin authentication.
loadVisitors();
loadActivities();

setInterval(() => {
    loadVisitors();
    loadActivities();
}, 5000);
