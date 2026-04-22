FROM eclipse-temurin:21-jre-jammy

ARG JAR_FILE=*.jar

ENV APP_HOME=/app
ENV CONFIG_HOME=/app/config
ENV LOG_HOME=/app/logs
ENV UPLOAD_HOME=/app/uploads
ENV JAVA_OPTS=""

WORKDIR ${APP_HOME}

RUN groupadd --system spring && useradd --system --gid spring --create-home spring

COPY ${JAR_FILE} app.jar

RUN mkdir -p ${CONFIG_HOME} ${LOG_HOME} ${UPLOAD_HOME} \
    && chown -R spring:spring ${APP_HOME}

USER spring

EXPOSE 8055

VOLUME ["/app/config", "/app/logs", "/app/uploads"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dloader.path=/app/config -Dspring.config.additional-location=optional:file:/app/config/ -Dlogging.file.path=/app/logs -cp /app/app.jar org.springframework.boot.loader.launch.PropertiesLauncher"]
