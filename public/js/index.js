// Hàm lấy dữ liệu từ server

const sensors = [
    { id: 1, name: 'Temperature', unit: '°C', period: 10},
    { id: 2, name: 'Humidity', unit: '%', period: 10},
    { id: 3, name: 'Lux', unit: 'Lux', period: 10},
];

async function fetchSensorData(collection, sensorId = "") {
    let url = `http://127.0.0.1:3000/getData10?collection=${collection}&sensorId=${sensorId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    return data;

}

function renderChart(canvasId, label, sensorData, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sensorData.map(d => new Date(d.timestamp).toLocaleTimeString()),
            datasets: [{
                label: label,
                data: sensorData.map(d => d.value),
                borderColor: color,
                backgroundColor: "rgba(255, 255, 255, 1)",
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });
}

async function loadDashboard() {
        try {
        // Temperature
        const tempData = await fetchSensorData("sensor", "1");
        renderChart("sensorChart1", "Temperature (°C)", tempData, "rgba(255,99,132,1)");

        // Humidity
        const humData = await fetchSensorData("sensor", "2");
        renderChart("sensorChart2", "Humidity (%)", humData, "rgba(54,162,235,1)");

        // // Lux
        const luxData = await fetchSensorData("sensor", "3");
        renderChart("sensorChart3", "Lux", luxData, "rgba(255,206,86,1)");


    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
        
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    setInterval(loadDashboard, 10000);
});
