const Influx = require('influx');
const dbName = 'temperatures_db';

class InfluxDBClient {
    constructor() {
        this.client = new Influx.InfluxDB({
            host: 'localhost',
            database: dbName,
            schema: [
                {
                    measurement: 'temperatures',
                    fields: {
                        temperature: Influx.FieldType.FLOAT
                    },
                    tags: [
                        'deviceId'
                    ]
                },
                {
                    measurement: 'average',
                    fields: {
                        temperature: Influx.FieldType.FLOAT
                    },
                    tags: []
                }
            ]
        });
    }

    async init() {
        const names = await this.client.getDatabaseNames();
        if (!names.includes(dbName)) {
            await this.client.createDatabase(dbName);
            await this.client.createRetentionPolicy('one_hour_only', {
                database: dbName,
                replication: 1,
                duration: '1h'
            });
            return this.client.createContinuousQuery('one_minute_average', `
                SELECT mean("temperature")
                INTO "average" 
                FROM "temperatures"
                GROUP BY time(1m)
            `, dbName);
        }
    }

    insert(deviceId, temperature) {
        return this.client.writePoints([
            {
                measurement: 'temperatures',
                tags: {deviceId},
                fields: {temperature},
            }
        ])
    }

    findAllByDeviceId(deviceId) {
        return this.client.query(`select * from temperatures where deviceId = ${Influx.escape.stringLit(deviceId)} order by time desc`)
    }

    findAllAverage() {
        return this.client.query('select * from average order by time desc')
    }

}

module.exports = {InfluxDBClient};
