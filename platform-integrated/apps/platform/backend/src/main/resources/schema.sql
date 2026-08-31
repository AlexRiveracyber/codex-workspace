-- Initialize database schema for platform
CREATE TABLE IF NOT EXISTS managed_apps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    app_key VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(500),
    category VARCHAR(50) DEFAULT 'WEB',
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

-- Seed pre-defined popular templates if empty
INSERT IGNORE INTO app_templates (id, name, template_key, description, category, docker_image, default_host_port, default_container_port, default_env_vars, icon, tags) VALUES
(1, 'Nginx Web Server', 'nginx-web', 'High-performance HTTP server and reverse proxy', 'WEB', 'nginx:alpine', 8088, 80, '', 'Globe', 'Web,Proxy,HTTP'),
(2, 'Redis Cache', 'redis-cache', 'In-memory data structure store used as database and cache', 'DATABASE', 'redis:alpine', 6379, 6379, '', 'Database', 'Cache,NoSQL,Redis'),
(3, 'PostgreSQL DB', 'postgres-db', 'Powerful open source object-relational database system', 'DATABASE', 'postgres:16-alpine', 5432, 5432, 'POSTGRES_PASSWORD=postgres\nPOSTGRES_USER=postgres\nPOSTGRES_DB=app_db', 'Database', 'SQL,PostgreSQL,RDBMS'),
(4, 'RabbitMQ Message Queue', 'rabbitmq-mq', 'Robust and scalable messaging broker with management UI', 'QUEUE', 'rabbitmq:3-management-alpine', 15672, 15672, 'RABBITMQ_DEFAULT_USER=admin\nRABBITMQ_DEFAULT_PASS=admin123', 'Layers', 'MessageQueue,AMQP,Broker'),
(5, 'MongoDB NoSQL', 'mongodb-db', 'Document-oriented database designed for high availability', 'DATABASE', 'mongo:latest', 27017, 27017, 'MONGO_INITDB_ROOT_USERNAME=root\nMONGO_INITDB_ROOT_PASSWORD=example', 'Server', 'NoSQL,Document,Database'),
(6, 'Node.js Express App', 'node-demo-app', 'Lightweight sample Node.js web application', 'APPLICATION', 'crccheck/hello-world', 8000, 8000, '', 'Code2', 'Node,Web,Demo');

-- Seed initial managed apps if table is empty
INSERT IGNORE INTO managed_apps (id, name, app_key, description, category, app_type, docker_image, container_name, host_port, container_port, env_vars, status, icon, auto_start, created_at) VALUES
(1, 'Nginx Gateway', 'nginx-gateway', 'Default ingress web proxy and frontend static router', 'WEB', 'DOCKER', 'nginx:alpine', 'platform-sample-nginx', 8088, 80, '', 'STOPPED', 'Globe', FALSE, CURRENT_TIMESTAMP),
(2, 'Redis Data Cache', 'redis-cache-service', 'High-speed Redis cache service for caching & session store', 'DATABASE', 'DOCKER', 'redis:alpine', 'platform-sample-redis', 6379, 6379, '', 'STOPPED', 'Database', FALSE, CURRENT_TIMESTAMP);
