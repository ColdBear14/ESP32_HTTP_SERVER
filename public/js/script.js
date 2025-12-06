// Cấu hình danh sách cảm biến
const sensors = [
    { id: 1 }, 
    { id: 2 }, 
    { id: 3 }
];

// Cấu hình ngưỡng cảnh báo (BẠN CÓ THỂ CHỈNH SỬA Ở ĐÂY)
const ALERTS = {
    1: { max: 40.0, spike: 2.0 },   // Temp: Quá 40 độ hoặc tăng nhanh > 2 độ
    2: { max: 90.0, spike: 10.0 },  // Humid: Quá 90% hoặc tăng nhanh > 10%
    3: { max: 1000, spike: 200 }    // Lux: Quá 1000 hoặc tăng nhanh > 200
};

// Lưu trữ giá trị cũ để so sánh: { "1": 25.5, "2": 60 ... }
let previousValues = {}; 

async function fetchSensorData(collection, sensorId = "") {
    // SỬA IP SERVER CỦA BẠN
    let url = `http://10.28.128.138:3000/getData?collection=${collection}&sensorId=${sensorId}`;
    try  {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data; // Trả về mảng hoặc object
    }
    catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

async function updateAllSensorValues() {
    for (const sensor of sensors) {
        const rawData = await fetchSensorData("sensor", sensor.id);
        
        let data = null;
        if (Array.isArray(rawData) && rawData.length > 0) data = rawData[0];
        else if (rawData && rawData.value !== undefined) data = rawData;

        if (data) {
            // 1. Cập nhật giao diện cơ bản
            const valEl = document.getElementById(`sensorValue${sensor.id}`);
            const nameEl = document.getElementById(`sensorName${sensor.id}`);
            const idEl = document.getElementById(`sensorId${sensor.id}`);
            const periodEl = document.getElementById(`sensorPeriod${sensor.id}`);
            const timeEl = document.getElementById(`sensorTime${sensor.id}`);
            const boxEl = document.getElementById(`box${sensor.id}`);
            const statusEl = document.getElementById(`status${sensor.id}`);

            const currentValue = parseFloat(data.value);
            
            // Format thời gian từ ISO string sang giờ địa phương dễ đọc
            const dateObj = new Date(data.timestamp);
            const timeString = dateObj.toLocaleTimeString() + " " + dateObj.toLocaleDateString();

            if(valEl) valEl.textContent = currentValue;
            if(nameEl) nameEl.textContent = data.name;
            if(idEl) idEl.textContent = data.sensorId;
            if(periodEl) periodEl.textContent = data.period;
            if(timeEl) timeEl.textContent = timeString;

            // 2. Logic So Sánh và Cảnh Báo
            let isAlert = false;
            let alertMsg = "Normal";
            
            // Lấy giá trị cũ
            const oldValue = previousValues[sensor.id];
            const config = ALERTS[sensor.id];

            // Kiểm tra vượt ngưỡng (Max Value)
            if (currentValue > config.max) {
                isAlert = true;
                alertMsg = `⚠️ Warning: Value too high (> ${config.max})`;
            }

            // Kiểm tra tăng đột biến (Spike)
            if (oldValue !== undefined) {
                const diff = currentValue - oldValue;
                if (diff > config.spike) {
                    isAlert = true;
                    alertMsg = `⚠️ Alert: Sudden spike (+${diff.toFixed(2)})`;
                }
            }

            // Cập nhật trạng thái giao diện (Màu đỏ nếu Alert)
            if (isAlert) {
                boxEl.classList.add("alert-state"); // Thêm class đỏ
                statusEl.textContent = alertMsg;
                statusEl.style.color = "#ffeb3b"; // Màu chữ vàng cảnh báo
            } else {
                boxEl.classList.remove("alert-state"); // Xóa class đỏ
                statusEl.textContent = "Stable";
                statusEl.style.color = "#e9ecef";
            }

            // 3. Lưu giá trị hiện tại làm giá trị cũ cho lần sau
            previousValues[sensor.id] = currentValue;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAllSensorValues();
    setInterval(updateAllSensorValues, 5000);
});