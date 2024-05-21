import winston from 'winston'
import LogstashTransport from 'winston-logstash/lib/winston-logstash-latest.js'

const serviceName = 'logstash-transport-example'

const logstashTransport = new LogstashTransport({
  host: 'localhost',
  port: 5000
})

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: {
    service: serviceName,
    buildInfo: {
      nodeVersion: process.version
    }
  },
  transports: [
    logstashTransport
  ]
})

logger.info('Info from logstash transport')
logger.error('Error from logstash transport')

/* Close the logger after a second to allow the logs to be sent */
setTimeout(() => {
  logger.close()
  console.log('Sent logs to logstash')
}, 1000)
