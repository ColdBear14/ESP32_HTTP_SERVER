// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const os = require('os');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://192.168.4.1:8080' // allow your dashboard origin
}));

mongoose.connect('mongodb://localhost:27017/va_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ActionHistorySchema = new mongoose.Schema({
  name: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
});

const EnvironmentSensorSchema = new mongoose.Schema({
  name: String,
  value: Number,
  timestamp: { type: Date, default: Date.now }
});

const ActionHistory = mongoose.model('ActionHistory', ActionHistorySchema, 'action_history');
const EnvironmentSensor = mongoose.model('EnvironmentSensor', EnvironmentSensorSchema, 'environment_sensor');

app.post('/addData', async (req, res) => {
  const { collection, ...data } = req.body;
  try {
    if (collection === 'action_history') {
      const doc = new ActionHistory(data);
      await doc.save();
      console.log(`Action history saved: ${JSON.stringify(data)}`);
      res.status(200).json({ message: 'Action history saved' });

    } else if (collection === 'environment_sensor') {
      const doc = new EnvironmentSensor(data);
      await doc.save();
      console.log(`Environment sensor saved: ${JSON.stringify(data)}`);
      res.status(200).json({ message: 'Environment sensor saved' });
    } else {
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

    if (collection === 'action_history') {
      const data = await ActionHistory.find(query).sort({ timestamp: -1 }).limit(10);
      res.status(200).json(data);
    } else if (collection === 'environment_sensor') {
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
  const { collection, name } = req.query;
  try {
    let query = {};
    if (name) {
      query.name = name;
    }

    if (collection === 'action_history') {
      const data = await ActionHistory.find(query).sort({ timestamp: -1 }).limit(1).select("name action timestamp");
      res.status(200).json(data);
    } else if (collection === 'environment_sensor') {
      const data = await EnvironmentSensor.find(query).sort({ timestamp: -1 }).limit(1).select("name value timestamp");
      console.log("Enviroment sensor send data successfual");
      res.status(200).json(data);
    } else {
      res.status(400).json({ error: 'Invalid collection' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving data' });
  }
});

app.listen(3000, () => {
  const interfaces = os.networkInterfaces();
  let address = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        address = iface.address;
        break;
      }
    }
  }
  console.log(`Server started on http://${address}:3000`);
});
