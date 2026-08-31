FROM node:20-alpine AS platform-ui
WORKDIR /app
COPY apps/platform/frontend/package*.json ./
RUN npm ci
COPY apps/platform/frontend/ ./
RUN npm run build -- --base=/

FROM node:20-alpine AS task-ui
WORKDIR /app
COPY apps/task/frontend/package*.json ./
RUN npm ci
COPY apps/task/frontend/ ./
RUN npm run build -- --base=/task/

FROM node:20-alpine AS ai-ui
WORKDIR /app
COPY apps/ai/frontend/package*.json ./
RUN npm ci
COPY apps/ai/frontend/ ./
RUN npm run build -- --base=/ai/

FROM node:20-alpine AS tool-ui
WORKDIR /app
COPY apps/tool/frontend/package*.json ./
RUN npm ci
COPY apps/tool/frontend/ ./
RUN npm run build -- --base=/tool/

FROM maven:3.9.6-eclipse-temurin-21 AS backend
WORKDIR /workspace
COPY apps/ ./apps/
COPY runtime/backend/ ./runtime/backend/
COPY --from=platform-ui /app/dist/ ./runtime/backend/src/main/resources/static/
COPY --from=task-ui /app/dist/ ./runtime/backend/src/main/resources/static/task/
COPY --from=ai-ui /app/dist/ ./runtime/backend/src/main/resources/static/ai/
COPY --from=tool-ui /app/dist/ ./runtime/backend/src/main/resources/static/tool/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f runtime/backend/pom.xml clean package -DskipTests

FROM docker:27-cli AS docker-cli

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN if command -v apk >/dev/null 2>&1; then apk add --no-cache curl bash; fi
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=backend /workspace/runtime/backend/target/platform-integrated.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
