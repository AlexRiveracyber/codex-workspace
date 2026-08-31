-- Ensure character encoding is UTF-8 (utf8mb4)
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;
SET character_set_results=utf8mb4;
SET character_set_client=utf8mb4;

-- Create platform database if not exists
CREATE DATABASE IF NOT EXISTS platform_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE platform_db;

-- Managed Apps table
CREATE TABLE IF NOT EXISTS managed_apps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    app_key VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(500),
    category VARCHAR(50) DEFAULT 'APPLICATION',
    app_type VARCHAR(50) DEFAULT 'DOCKER',
    docker_image VARCHAR(255),
    container_name VARCHAR(120),
    container_id VARCHAR(120),
    host_port INT,
    container_port INT,
    env_vars TEXT,
    command TEXT,
    status VARCHAR(30) DEFAULT 'STOPPED',
    health_url VARCHAR(255),
    icon VARCHAR(100) DEFAULT 'AppWindow',
    auto_start BOOLEAN DEFAULT FALSE,
    cpu_limit VARCHAR(20),
    memory_limit VARCHAR(20),
    last_started_at DATETIME,
    last_stopped_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- App operation audit logs table
CREATE TABLE IF NOT EXISTS app_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    app_id BIGINT,
    app_name VARCHAR(100),
    action VARCHAR(50),
    status VARCHAR(30),
    message TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- App Templates catalog table
CREATE TABLE IF NOT EXISTS app_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_key VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(500),
    category VARCHAR(50) DEFAULT 'DATABASE',
    docker_image VARCHAR(255) NOT NULL,
    default_host_port INT,
    default_container_port INT,
    default_env_vars TEXT,
    default_command TEXT,
    icon VARCHAR(100) DEFAULT 'Box',
    tags VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task Sub-app tables
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    task_key VARCHAR(64) NOT NULL UNIQUE,
    task_type VARCHAR(50) DEFAULT 'SCHEDULED',
    cron_expression VARCHAR(100),
    command TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    last_status VARCHAR(30) DEFAULT 'PENDING',
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Sub-app tables
CREATE TABLE IF NOT EXISTS ai_providers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider_key VARCHAR(64) NOT NULL UNIQUE,
    base_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_models (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider_key VARCHAR(64) NOT NULL,
    brand VARCHAR(64) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_key VARCHAR(100) NOT NULL UNIQUE,
    capabilities VARCHAR(255) NOT NULL,
    model_type VARCHAR(30) DEFAULT 'CHAT',
    tag VARCHAR(50),
    context_length INT DEFAULT 32768,
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    provider_key VARCHAR(64) DEFAULT 'huifu',
    model_key VARCHAR(100) DEFAULT 'qwen3.8-max',
    system_prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(30) NOT NULL,
    content LONGTEXT NOT NULL,
    thinking LONGTEXT,
    image_urls TEXT,
    tokens_used INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_generation_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_type VARCHAR(30) NOT NULL,
    provider_key VARCHAR(64) NOT NULL,
    model_key VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    input_image_url TEXT,
    result_url TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    parameters TEXT,
    error_msg TEXT,
    duration_sec INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS ai_call_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider_key VARCHAR(64) NOT NULL,
    model_key VARCHAR(100) NOT NULL,
    call_type VARCHAR(30) NOT NULL,
    prompt_snippet VARCHAR(500),
    response_snippet TEXT,
    tokens_prompt INT DEFAULT 0,
    tokens_completion INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'SUCCESS',
    error_msg TEXT,
    request_json LONGTEXT,
    response_json LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dev Tools Sub-app tables
CREATE TABLE IF NOT EXISTS dev_tools_snippets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    language VARCHAR(50) DEFAULT 'plaintext',
    code_content LONGTEXT NOT NULL,
    description VARCHAR(500),
    tags VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dev_tools_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tool_key VARCHAR(64) NOT NULL,
    input_summary VARCHAR(500),
    output_summary VARCHAR(500),
    params_json LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed app templates
REPLACE INTO app_templates (id, name, template_key, description, category, docker_image, default_host_port, default_container_port, default_env_vars, icon, tags) VALUES
(1, 'Nginx Web Server', 'nginx-web', '高性能 Web 服务器与反向代理网关', 'WEB', 'nginx:alpine', 8088, 80, '', 'Globe', 'Web,Proxy,HTTP'),
(2, 'Redis Data Cache', 'redis-cache', '高性能内存级 Key-Value 数据库与缓存系统', 'DATABASE', 'redis:alpine', 6379, 6379, '', 'Database', 'Cache,NoSQL,Redis'),
(3, 'PostgreSQL Database', 'postgres-db', '功能强大的企业级开源对象关系型数据库', 'DATABASE', 'postgres:16-alpine', 5432, 5432, 'POSTGRES_PASSWORD=postgres\nPOSTGRES_USER=postgres\nPOSTGRES_DB=app_db', 'Database', 'SQL,PostgreSQL,RDBMS'),
(4, 'RabbitMQ Message Queue', 'rabbitmq-mq', '高吞吐分布式消息队列中间件 (带管理面板)', 'QUEUE', 'rabbitmq:3-management-alpine', 15672, 15672, 'RABBITMQ_DEFAULT_USER=admin\nRABBITMQ_DEFAULT_PASS=admin123', 'Layers', 'MessageQueue,AMQP,Broker'),
(5, 'MongoDB NoSQL', 'mongodb-db', '现代分布式文档型 NoSQL 数据库', 'DATABASE', 'mongo:latest', 27017, 27017, 'MONGO_INITDB_ROOT_USERNAME=root\nMONGO_INITDB_ROOT_PASSWORD=example', 'Server', 'NoSQL,Document,Database'),
(6, 'Task Worker Service', 'task-worker', '轻量级定时任务异步工作流处理引擎', 'APPLICATION', 'platform-task-api:local', 8082, 8082, '', 'Code2', 'Task,Worker,Cron'),
(7, 'AI Studio Gateway', 'ai-gateway', '多模态 AI 大模型网关与生成中心 (千问/DeepSeek/HappyHorse)', 'APPLICATION', 'platform-ai-api:local', 8083, 8083, '', 'Sparkles', 'AI,LLM,Vision,Video'),
(8, 'DevTools Studio', 'devtools-studio', '全能开发者工具箱 (编码/加密/SQL/JSON/Cron/网络/Diff)', 'APPLICATION', 'platform-tool-api:local', 8084, 8084, '', 'Wrench', 'DevTools,Crypto,JSON,Network');

-- Seed initial sub-apps and managed applications
REPLACE INTO managed_apps (id, name, app_key, description, category, app_type, docker_image, container_name, host_port, container_port, env_vars, status, icon, auto_start, created_at) VALUES
(1, 'Task Backend API', 'task-backend-api', '任务调度子应用后端服务 (Java 21 + Spring Boot 3)', 'APPLICATION', 'DOCKER', 'platform-task-api:local', 'platform-task-api', 8082, 8082, 'SPRING_PROFILES_ACTIVE=prod', 'STOPPED', 'Server', FALSE, CURRENT_TIMESTAMP),
(2, 'Task Frontend UI', 'task-frontend-ui', '任务调度子应用前端控制台 (Vue 3 + Vite)', 'APPLICATION', 'DOCKER', 'platform-task-ui:local', 'platform-task-ui', 3002, 80, '', 'STOPPED', 'Globe', FALSE, CURRENT_TIMESTAMP),
(3, 'AI Backend API', 'ai-backend-api', 'AI 大模型调度与网关后端服务 (Java 21 + Spring Boot 3)', 'APPLICATION', 'DOCKER', 'platform-ai-api:local', 'platform-ai-api', 8083, 8083, 'SPRING_PROFILES_ACTIVE=prod', 'STOPPED', 'Cpu', FALSE, CURRENT_TIMESTAMP),
(4, 'AI Frontend UI', 'ai-frontend-ui', 'AI 大模型创作与会话控制台 (Vue 3 + Vite)', 'APPLICATION', 'DOCKER', 'platform-ai-ui:local', 'platform-ai-ui', 3003, 80, '', 'STOPPED', 'Sparkles', FALSE, CURRENT_TIMESTAMP),
(5, 'Tool Backend API', 'tool-backend-api', '全能开发者工具箱后端服务 (Java 21 + Spring Boot 3)', 'APPLICATION', 'DOCKER', 'platform-tool-api:local', 'platform-tool-api', 8084, 8084, 'SPRING_PROFILES_ACTIVE=prod', 'STOPPED', 'Terminal', FALSE, CURRENT_TIMESTAMP),
(6, 'Tool Frontend UI', 'tool-frontend-ui', '全能开发者工具箱精美前端 (Vue 3 + Vite + Tailwind)', 'APPLICATION', 'DOCKER', 'platform-tool-ui:local', 'platform-tool-ui', 3004, 80, '', 'STOPPED', 'Wrench', FALSE, CURRENT_TIMESTAMP),
(7, 'Nginx Ingress Gateway', 'nginx-gateway', '平台对外统一入口与动静态分发反向代理网关', 'WEB', 'DOCKER', 'nginx:alpine', 'platform-nginx-gateway', 8088, 80, '', 'STOPPED', 'Globe', FALSE, CURRENT_TIMESTAMP),
(8, 'Redis Shared Cache', 'redis-cache-service', '平台高并发分布式缓存与会话状态共享存储', 'DATABASE', 'DOCKER', 'redis:alpine', 'platform-shared-redis', 6379, 6379, '', 'STOPPED', 'Database', FALSE, CURRENT_TIMESTAMP);

-- Seed initial snippets for DevTools
REPLACE INTO dev_tools_snippets (id, title, category, language, code_content, description, tags, is_pinned) VALUES
(1, 'Spring Boot 统一返回体 Result<T>', 'BACKEND', 'java', 'package com.example.common;\n\nimport lombok.Data;\n\n@Data\npublic class Result<T> {\n    private int code;\n    private String msg;\n    private T data;\n    private long timestamp = System.currentTimeMillis();\n\n    public static <T> Result<T> success(T data) {\n        Result<T> r = new Result<>();\n        r.setCode(200);\n        r.setMsg("success");\n        r.setData(data);\n        return r;\n    }\n\n    public static <T> Result<T> error(int code, String msg) {\n        Result<T> r = new Result<>();\n        r.setCode(code);\n        r.setMsg(msg);\n        return r;\n    }\n}', '通用的 RESTful 接口响应包装类', 'Java,SpringBoot,API', TRUE),
(2, 'Vue 3 Axios 请求拦截器封装', 'FRONTEND', 'typescript', 'import axios from "axios";\n\nconst api = axios.create({\n  baseURL: import.meta.env.VITE_API_URL || "/api",\n  timeout: 10000,\n});\n\napi.interceptors.request.use((config) => {\n  const token = localStorage.getItem("token");\n  if (token) {\n    config.headers.Authorization = `Bearer ${token}`;\n  }\n  return config;\n});\n\napi.interceptors.response.use(\n  (res) => res.data,\n  (err) => {\n    console.error("API Request Error:", err);\n    return Promise.reject(err);\n  }\n);\n\nexport default api;', '包含 Token 自动携带与响应数据自动解包', 'Vue3,TypeScript,Axios', TRUE),
(3, '常用正则验证工具函数 (Regex Utils)', 'COMMON', 'javascript', 'export const RegexUtils = {\n  isMobile: (val) => /^1[3-9]\\d{9}$/.test(val),\n  isEmail: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(val),\n  isIdCard: (val) => /^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$/.test(val),\n  isIpv4: (val) => /^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(val),\n  isUrl: (val) => /^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/i.test(val)\n};', '前端表单校验常用正则表达式集合', 'JavaScript,Regex,Validator', FALSE);

-- Seed initial tasks in Task sub-application
REPLACE INTO tasks (id, name, task_key, task_type, cron_expression, command, enabled, last_status, last_run_at, created_at) VALUES
(1, '应用健康状态自动探活巡检', 'app-health-check-cron', 'SCHEDULED', '*/15 * * * * *', 'curl -s http://platform-api:8080/api/dashboard/summary', TRUE, 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Docker 容器运行日志归档压缩', 'docker-log-rotate-job', 'SCHEDULED', '0 0 2 * * ?', 'docker system prune -f', TRUE, 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '平台 MySQL 数据库每日定时冷备', 'mysql-backup-job', 'BACKUP', '0 30 3 * * ?', 'mysqldump -u root -p platform_db > /backup/daily.sql', TRUE, 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed AI Providers
REPLACE INTO ai_providers (id, name, provider_key, base_url, api_key, description, enabled, is_default, created_at) VALUES
(1, '汇付天下 AI 网关 (Huifu)', 'huifu', 'https://ai.cloudpnr.com/token-plan/v1', '9UhsCipzFJRLJFjg', '汇付官方 AI Token Plan 网关，聚合千问、DeepSeek、万相、HappyHorse 等多模态模型', TRUE, TRUE, CURRENT_TIMESTAMP);

-- Seed AI Models
REPLACE INTO ai_models (id, provider_key, brand, model_name, model_key, capabilities, model_type, tag, context_length, enabled, sort_order) VALUES
(1, 'huifu', '千问', 'qwen3.8-max', 'qwen3.8-max', '文本生成、推理模型、视觉理解', 'CHAT', 'New', 131072, TRUE, 1),
(2, 'huifu', '千问', 'qwen3.8-flash', 'qwen3.8-flash', '文本生成、推理模型、视觉理解', 'CHAT', '', 131072, TRUE, 2),
(3, 'huifu', '千问', 'qwen3.7-plus', 'qwen3.7-plus', '文本生成、推理模型、视觉理解', 'CHAT', '', 131072, TRUE, 3),
(4, 'huifu', '千问', 'qwen3.7-max', 'qwen3.7-max', '文本生成、推理模型', 'CHAT', '', 131072, TRUE, 4),
(5, 'huifu', '千问', 'qwen3.6-plus', 'qwen3.6-plus', '文本生成、推理模型、视觉理解', 'CHAT', '', 131072, TRUE, 5),
(6, 'huifu', '千问', 'qwen3.6-flash', 'qwen3.6-flash', '文本生成、推理模型、视觉理解', 'CHAT', '', 131072, TRUE, 6),
(7, 'huifu', '千问', 'qwen-image-3.0-pro', 'qwen-image-3.0-pro', '图片生成', 'IMAGE', '', 0, TRUE, 7),
(8, 'huifu', '千问', 'qwen-image-2.0', 'qwen-image-2.0', '图片生成', 'IMAGE', '', 0, TRUE, 8),
(9, 'huifu', '千问', 'qwen-image-2.0-pro', 'qwen-image-2.0-pro', '图片生成', 'IMAGE', '', 0, TRUE, 9),
(10, 'huifu', '千问', 'qwen-audio-3.0-asr-flash', 'qwen-audio-3.0-asr-flash', '语音识别', 'AUDIO', '', 0, TRUE, 10),
(11, 'huifu', '千问', 'qwen-audio-3.0-tts-plus', 'qwen-audio-3.0-tts-plus', '实时语音合成、语音合成', 'AUDIO', '', 0, TRUE, 11),
(12, 'huifu', '千问', 'qwen-audio-3.0-realtime-plus', 'qwen-audio-3.0-realtime-plus', '实时语音对话', 'AUDIO', '', 0, TRUE, 12),
(13, 'huifu', '万相', 'wan2.7-image', 'wan2.7-image', '图片生成', 'IMAGE', '', 0, TRUE, 13),
(14, 'huifu', '万相', 'wan2.7-image-pro', 'wan2.7-image-pro', '图片生成', 'IMAGE', '', 0, TRUE, 14),
(15, 'huifu', 'HappyHorse', 'happyhorse-1.1-i2v', 'happyhorse-1.1-i2v', '视频生成 (图生视频)', 'VIDEO', '', 0, TRUE, 15),
(16, 'huifu', 'HappyHorse', 'happyhorse-1.1-t2v', 'happyhorse-1.1-t2v', '视频生成 (文生视频)', 'VIDEO', '', 0, TRUE, 16),
(17, 'huifu', 'HappyHorse', 'happyhorse-1.1-r2v', 'happyhorse-1.1-r2v', '视频生成 (参考生视频)', 'VIDEO', '', 0, TRUE, 17),
(18, 'huifu', 'DeepSeek', 'deepseek-v4-pro-0813', 'deepseek-v4-pro-0813', '文本生成、推理模型', 'CHAT', '限时夜间5折', 65536, TRUE, 18),
(19, 'huifu', 'DeepSeek', 'deepseek-v4-pro', 'deepseek-v4-pro', '文本生成、推理模型', 'CHAT', '', 65536, TRUE, 19),
(20, 'huifu', 'DeepSeek', 'deepseek-v4-flash-0731', 'deepseek-v4-flash-0731', '文本生成、推理模型', 'CHAT', '限时夜间5折', 65536, TRUE, 20),
(21, 'huifu', 'DeepSeek', 'deepseek-v4-flash', 'deepseek-v4-flash', '文本生成、推理模型', 'CHAT', '', 65536, TRUE, 21),
(22, 'huifu', 'DeepSeek', 'deepseek-v3.2', 'deepseek-v3.2', '文本生成、推理模型', 'CHAT', '', 65536, TRUE, 22),
(23, 'huifu', '智谱AI', 'glm-5.2', 'glm-5.2', '文本生成、推理模型', 'CHAT', '', 131072, TRUE, 23),
(24, 'huifu', '智谱AI', 'glm-5.1', 'glm-5.1', '文本生成、推理模型', 'CHAT', '', 131072, TRUE, 24),
(25, 'huifu', '智谱AI', 'glm-5', 'glm-5', '文本生成、推理模型', 'CHAT', '', 131072, TRUE, 25),
(26, 'huifu', '月之暗面', 'kimi-k2.7-code', 'kimi-k2.7-code', '文本生成、推理模型、视觉理解', 'CHAT', '', 200000, TRUE, 26),
(27, 'huifu', '月之暗面', 'kimi-k2.6', 'kimi-k2.6', '文本生成、推理模型、视觉理解', 'CHAT', '', 200000, TRUE, 27),
(28, 'huifu', '月之暗面', 'kimi-k2.5', 'kimi-k2.5', '文本生成、推理模型、视觉理解', 'CHAT', '', 200000, TRUE, 28),
(29, 'huifu', 'MiniMax', 'MiniMax-M2.5', 'MiniMax-M2.5', '文本生成、推理模型', 'CHAT', '', 131072, TRUE, 29);
