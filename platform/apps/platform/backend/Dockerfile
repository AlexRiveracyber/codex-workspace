# Stage 1: Build Java backend
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install docker CLI & curl inside container for docker management
RUN apk add --no-cache docker-cli curl bash

COPY --from=builder /app/target/platform-backend-1.0.0.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
