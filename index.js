const http = require('http');
const express = require('express');
const bodyParser = require('body-parser')
const database = require('./database');
const influxDBClient = new database.InfluxDBClient();

const app = express();
app.use(bodyParser.json())

app.post('/', async function ({body}, res) {
    try {
        await influxDBClient.insert(body.deviceId, body.temperature);
        res.json(body);
    } catch (err) {
        res.status(500).send(err.stack);
    }
})

app.get('/average', async function (req, res) {
    try {
        const result = await influxDBClient.findAllAverage();
        res.json(result);
    } catch (err) {
        res.status(500).send(err.stack);
    }
})

app.get('/:deviceId', async function ({params}, res) {
    try {
        const result = await influxDBClient.findAllByDeviceId(params.deviceId);
        res.json(result);
    } catch (err) {
        res.status(500).send(err.stack);
    }
})

influxDBClient.init()
    .then(() => {
        http.createServer(app).listen(3000, function () {
            console.log('Listening on port 3000');
        })
    })
    .catch(err => {
        console.error(`Error creating Influx database!`);
        console.error(err);
        process.exit(1);
    })
