import winston from 'winston'
import { Client } from '@elastic/elasticsearch'
import { ElasticsearchTransport } from 'winston-elasticsearch'

const serviceName = 'elasticsearch-transport-example'

const ELASTICSEARCH_URL = 'http://localhost:9200'

const esTransportOpts = {
  level: 'info',
  client: new Client({ node: ELASTICSEARCH_URL }),
  indexPrefix: 'app',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transformer: logData => {
    const { meta, timestamp, ...other } = logData
    return {
      timestamp,
      ...meta,
      ...other
    }
  }
}
const elasticsearchTransport = new ElasticsearchTransport(esTransportOpts)

const logger = winston.createLogger({
  defaultMeta: {
    service: serviceName,
    buildInfo: {
      nodeVersion: process.version
    }
  },
  transports: [
    elasticsearchTransport
  ]
})

logger.info('Info from elasticsearch transport')
logger.error('Error from elasticsearch transport')

/* Close the logger after a second to allow the logs to be sent */
setTimeout(() => {
  logger.close()
  console.log('Sent logs to elasticsearch')
}, 1000)
