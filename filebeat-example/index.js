import winston from 'winston'

const serviceName = 'filebeat-file-example'

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
    new winston.transports.File({ filename: '../elk-stack/microservice-logs/combined.log' })
  ]
})

logger.info('Info from file')
logger.error('Error from file')

setTimeout(() => {
  logger.close()
  console.log('Sent logs to file')
}, 1000)
