# Docker Compose for ELK Stack
To run the ELK stack with Docker Compose, run the following command from the folder where the [`docker-compose.yml`](./docker-compose.yml) file is located:

```bash
docker compose up -d --build
```

The `-d` flag runs the containers in the background. The `--build` flag rebuilds the images before starting the containers.

This will start Elasticsearch, Logstash and Kibana. You can access them at:
- Kibana: [http://localhost:5601](http://localhost:5601)
- Elasticsearch: [http://localhost:9200](http://localhost:9200)

To stop the ELK stack, run the following command:

```bash
docker compose down --volumes
```

The `--volumes` flag removes the volumes associated with the containers.


## Filebeat

In this setup, Filebeat is configured to read the logs from the `/var/log/microservice` folder and send them to Logstash. The Filebeat configuration is defined in the [`filebeat.yml`](./filebeat/filebeat.yml) file. This is mounted as a volume in docker compose, and maps the [`microservice-logs`](./microservice-logs) folder to the `/var/log/microservice` folder in the Filebeat container.

## Logstash

The Logstash configuration is defined in the [`logstash.conf`](./logstash/logstash.conf) file. This configuration listens for Filebeat input on port `5001` and TCP input on port `5000`, and sends the logs to Elasticsearch.

## Importing existing Kibana dashboards
The [`kibana-dashboard.ndjson`](./kibana-dashboard.ndjson) file containes a dashboard that can be imported with the following command:

```bash
curl -X POST localhost:5601/api/saved_objects/_import?createNewCopies=true -H "kbn-xsrf: true" --form file=@kibana-dashboard.ndjson
```

To export dashobards you can use the Kibana Saved Objects API
```bash
curl -X POST localhost:5601/api/saved_objects/_export -H 'kbn-xsrf: true' -H 'Content-Type: application/json' -d '
{
  "objects": [
    {
      "type": "dashboard",
      "id": "<DASHBOARD_ID>"
    }
  ],
  "includeReferencesDeep": true
}
' > kibana-dashboard.ndjson
```