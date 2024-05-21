FROM docker.elastic.co/beats/filebeat-oss:8.12.0
# Read /var/run/dokcer.sock need root priveleges
USER root

COPY ./filebeat.yml /usr/share/filebeat/filebeat.yml
RUN chown root:root /usr/share/filebeat/filebeat.yml