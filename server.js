// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const os = require('os');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://192.168.4.1:8000' // allow your dashboard origin
}));

mongoose.connect('mongodb://127.0.0.1:27017/ESP32')  
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const ActionSchema = new mongoose.Schema({
  name: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
});

const SensorSchema = new mongoose.Schema({
  sensorId : String,
  name: String,
  value: Number,
  period: Number,
  timestamp: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  id : Number,
  name: String,
  period: Number,
  timestamp: { type: Date, default: Date.now }
});

const ActionHistory = mongoose.model('Action', ActionSchema, 'action');
const EnvironmentSensor = mongoose.model('Sensor', SensorSchema, 'sensor');
const Settings = mongoose.model('Settings', SettingsSchema, 'settings')

app.post('/addData', async (req, res) => {
  console.log('Request:', req.body);

  const { collection, ...data } = req.body;
  try {
    if (collection === 'action') {
      const doc = new ActionHistory(data);
      await doc.save();
      console.log(`Action history saved: ${JSON.stringify(data)}`);
      res.status(200).json({ message: 'Action history saved' });
    } 
    else if (collection === 'sensor') {
      const doc = new EnvironmentSensor(data);
      await doc.save();
      console.log(`Environment sensor saved: ${JSON.stringify(data)}`);
      res.status(200).json({ message: 'Environment sensor saved' });
    } 
    else if (collection === 'settings'){
      const doc = new Settings(data);
      await doc.save();
      console.log(`Settings saved: ${JSON.stringify(data)}`);
      res.status(200).json({ message: 'Settings saved' });
    } 
    else {
      res.status(400).json({ error: 'Invalid collection' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error saving data' });
  }
});

app.get('/getData10', async (req, res) => {
  const { collection, name } = req.query;
  try {
    let query = {};
    if (name) {
      query.name = name;
    }

    if (collection === 'action') {
      const data = await ActionHistory.find(query).sort({ timestamp: -1 }).limit(10);
      res.status(200).json(data);
    } else if (collection === 'sensor') {
      const data = await EnvironmentSensor.find(query).sort({ timestamp: -1 }).limit(10).select("name value timestamp");
      console.log("Enviroment sensor send data successfual");
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: 'Invalid collection' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving data' });
  }
});

app.get('/getData', async (req, res) => {
  const { collection, sensorId } = req.query;
  try {
    let query = {};
    if (sensorId) {
      query.sensorId = sensorId;
    }

    if (collection === 'sensor') {
      const data = await EnvironmentSensor.find(query).sort({ timestamp: -1 }).limit(1).select("sensorId name value period timestamp");
      console.log("Enviroment sensor send data successful");
      res.status(200).json(data);
    }
    else if(collection === 'settings'){
      const data = await Settings.find(query).sort({ timestamp: -1 }).limit(1).select("id name period timestamp");
      console.log("Settings send data successful");
      res.status(200).json(data);
    } 
    else {
      res.status(400).json({ error: 'Invalid collection' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving data' });
  }
});

app.listen(3000, () => {
  const interfaces = os.networkInterfaces();
  console.log('Tất cả địa chỉ mạng:');
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4') {
        console.log(`Interface: ${name}, IP: ${iface.address}, Internal: ${iface.internal}`);
      }
    }
  }
  
  console.log(`Server started on port 3000`);
});
