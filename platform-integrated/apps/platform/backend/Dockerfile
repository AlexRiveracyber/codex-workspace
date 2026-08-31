# Stage 1: Build Java backend
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Reuse the standalone Docker CLI without depending on a distro package manager.
FROM docker:27-cli AS docker-cli

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install the shell helpers on Alpine when needed, while remaining compatible
# with Debian/Ubuntu-based Java runtime images that already provide them.
RUN if command -v apk >/dev/null 2>&1; then apk add --no-cache curl bash; fi

# Copy in the Docker client used to manage the host engine through the socket.
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker

COPY --from=builder /app/target/platform-backend-1.0.0.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
