const ws = new WebSocket(`ws://${location.host}/ws`); // Kết nối WebSocket

const sensors = [
    { id: 1, name: 'Temperature', unit: '°C', period: 10},
    { id: 2, name: 'Humidity', unit: '%', period: 10},
    { id: 3, name: 'Lux', unit: 'Lux', period: 10},
];

async function fetchSensorData(collection, sensorId = "") {
    let url = `http://10.135.180.108:3000/getData?collection=${collection}&sensorId=${sensorId}`;
    try  {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Fetch sensor data error:", error);
        return null;
    }
}

async function loadStoredSettings() {
    for (const sensor of sensors) {

        
        let url = `http://10.135.180.108:3000/getData?collection=settings&id=${sensor.id}`;
        
        try {
            const response = await fetch(url);
            const rawData = await response.json();

            if (Array.isArray(rawData) && rawData.length > 0) {
                const setting = rawData[0];
                
                // Cập nhật lên giao diện
                const nameInput = document.getElementById(`sensorName${setting.id}`);
                const periodInput = document.getElementById(`sensorPeriod${setting.id}`);
                
                if (nameInput) nameInput.value = setting.name;
                if (periodInput) periodInput.value = setting.period;
                
                // Cập nhật luôn biến local sensor sensors để đồng bộ
                sensor.name = setting.name;
                sensor.period = setting.period;
            }
        } catch (e) {
            console.log("Không tải được settings cho ID " + sensor.id);
        }
    }
}

async function updateAllSensorValues() {
    for (const sensor of sensors) {
        const rawData = await fetchSensorData("sensor", sensor.id);
        
        // Kiểm tra xem dữ liệu có hợp lệ không
        if (Array.isArray(rawData) && rawData.length > 0) {
            const data = rawData[0]; // Lấy phần tử mới nhất
            
            const element = document.getElementById(`sensorValue${data.sensorId}`);
            
            if (element) {
                element.textContent = data.value; // Cập nhật giá trị

            }

        } 
        // Dự phòng trường hợp trả về object đơn lẻ (nếu bạn đổi logic server sau này)
        else if (rawData && rawData.value !== undefined && rawData.sensorId !== undefined) {
             const element = document.getElementById(`sensorValue${rawData.sensorId}`);
             if (element) {
                element.textContent = rawData.value;
            }
        }
    }
}


function updateSensorSettings(sensorId) {
    const name = document.getElementById(`sensorName${sensorId}`).value;
    const period = parseInt(document.getElementById(`sensorPeriod${sensorId}`).value);
    
    // Validate period
    if (period < 1) {
        alert('Period must be at least 1 second');
        return;
    }

    // Send to server
    ws.send(JSON.stringify({
        action: "settings",
        id: sensorId,
        name: name,
        period: period
    }));

    // Visual feedback
    const button = document.querySelector(`button[onclick="updateSensorSettings(${sensorId})"]`);
    button.textContent = 'Saved!';
    setTimeout(() => {
        button.textContent = 'Save Settings';
    }, 1000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadStoredSettings();
    updateAllSensorValues();
    setInterval(updateAllSensorValues, 5000);
});



