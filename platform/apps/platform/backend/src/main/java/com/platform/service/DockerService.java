package com.platform.service;

import com.platform.dto.AppStatsDTO;
import com.platform.dto.DockerContainerDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class DockerService {

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    public boolean isDockerAvailable() {
        try {
            CommandResult res = executeCommand(5, "docker", "version", "--format", "{{.Server.Version}}");
            return res.isSuccess() && StringUtils.hasText(res.getOutput());
        } catch (Exception e) {
            log.warn("Docker check failed: {}", e.getMessage());
            return false;
        }
    }

    public String getDockerVersion() {
        try {
            CommandResult res = executeCommand(5, "docker", "version", "--format", "{{.Server.Version}}");
            return res.isSuccess() ? res.getOutput().trim() : "Unknown";
        } catch (Exception e) {
            return "Unavailable";
        }
    }

    public List<DockerContainerDTO> listContainers(boolean all) {
        List<DockerContainerDTO> list = new ArrayList<>();
        try {
            List<String> cmd = new ArrayList<>();
            cmd.add("docker");
            cmd.add("ps");
            if (all) {
                cmd.add("-a");
            }
            cmd.add("--format");
            cmd.add("{{.ID}}|||{{.Names}}|||{{.Image}}|||{{.Status}}|||{{.State}}|||{{.Ports}}|||{{.CreatedAt}}");

            CommandResult res = executeCommand(10, cmd.toArray(new String[0]));
            if (res.isSuccess() && StringUtils.hasText(res.getOutput())) {
                String[] lines = res.getOutput().split("\n");
                for (String line : lines) {
                    if (line.trim().isEmpty()) continue;
                    String[] parts = line.split("\\|\\|\\|", -1);
                    if (parts.length >= 7) {
                        list.add(DockerContainerDTO.builder()
                                .id(parts[0].trim())
                                .name(parts[1].trim())
                                .image(parts[2].trim())
                                .status(parts[3].trim())
                                .state(parts[4].trim())
                                .ports(parts[5].trim())
                                .created(parts[6].trim())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to list docker containers: {}", e.getMessage());
        }
        return list;
    }

    public String runContainer(String image, String containerName, Integer hostPort, Integer containerPort, String envVars, String command) {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("-d");
        if (StringUtils.hasText(containerName)) {
            cmd.add("--name");
            cmd.add(containerName.trim());
        }
        if (hostPort != null && containerPort != null && hostPort > 0 && containerPort > 0) {
            cmd.add("-p");
            cmd.add(hostPort + ":" + containerPort);
        }
        if (StringUtils.hasText(envVars)) {
            String[] envs = envVars.split("[\\r\\n]+");
            for (String env : envs) {
                if (env.trim().contains("=")) {
                    cmd.add("-e");
                    cmd.add(env.trim());
                }
            }
        }
        cmd.add(image.trim());
        if (StringUtils.hasText(command)) {
            for (String arg : command.trim().split("\\s+")) {
                if (StringUtils.hasText(arg)) {
                    cmd.add(arg);
                }
            }
        }

        CommandResult res = executeCommand(30, cmd.toArray(new String[0]));
        if (res.isSuccess()) {
            return res.getOutput().trim();
        } else {
            throw new RuntimeException("Failed to run docker container: " + res.getError());
        }
    }

    public boolean startContainer(String containerNameOrId) {
        CommandResult res = executeCommand(15, "docker", "start", containerNameOrId);
        if (!res.isSuccess()) {
            log.error("Failed to start container {}: {}", containerNameOrId, res.getError());
        }
        return res.isSuccess();
    }

    public boolean stopContainer(String containerNameOrId) {
        CommandResult res = executeCommand(20, "docker", "stop", containerNameOrId);
        if (!res.isSuccess()) {
            log.error("Failed to stop container {}: {}", containerNameOrId, res.getError());
        }
        return res.isSuccess();
    }

    public boolean restartContainer(String containerNameOrId) {
        CommandResult res = executeCommand(25, "docker", "restart", containerNameOrId);
        if (!res.isSuccess()) {
            log.error("Failed to restart container {}: {}", containerNameOrId, res.getError());
        }
        return res.isSuccess();
    }

    public boolean removeContainer(String containerNameOrId, boolean force) {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("rm");
        if (force) {
            cmd.add("-f");
        }
        cmd.add(containerNameOrId);
        CommandResult res = executeCommand(15, cmd.toArray(new String[0]));
        return res.isSuccess();
    }

    public String getContainerLogs(String containerNameOrId, int tailLines) {
        CommandResult res = executeCommand(10, "docker", "logs", "--tail", String.valueOf(tailLines), containerNameOrId);
        if (res.isSuccess()) {
            return res.getOutput();
        } else if (StringUtils.hasText(res.getError())) {
            return res.getError();
        }
        return "No logs available or container not found.";
    }

    public String getContainerState(String containerNameOrId) {
        CommandResult res = executeCommand(5, "docker", "inspect", "--format", "{{.State.Status}}", containerNameOrId);
        if (res.isSuccess() && StringUtils.hasText(res.getOutput())) {
            return res.getOutput().trim();
        }
        return "not_found";
    }

    public AppStatsDTO getContainerStats(String containerNameOrId) {
        try {
            CommandResult res = executeCommand(8, "docker", "stats", "--no-stream", "--format",
                    "{{.Container}}|||{{.Name}}|||{{.CPUPerc}}|||{{.MemUsage}}|||{{.MemPerc}}|||{{.NetIO}}|||{{.BlockIO}}|||{{.PIDs}}",
                    containerNameOrId);
            if (res.isSuccess() && StringUtils.hasText(res.getOutput())) {
                String[] parts = res.getOutput().trim().split("\\|\\|\\|", -1);
                if (parts.length >= 8) {
                    String memUsage = parts[3];
                    String usedMem = memUsage;
                    String limitMem = "";
                    if (memUsage.contains("/")) {
                        String[] m = memUsage.split("/");
                        usedMem = m[0].trim();
                        limitMem = m[1].trim();
                    }
                    return AppStatsDTO.builder()
                            .containerId(parts[0].trim())
                            .containerName(parts[1].trim())
                            .cpuPercent(parts[2].trim())
                            .memoryUsage(usedMem)
                            .memoryLimit(limitMem)
                            .memoryPercent(parts[4].trim())
                            .netIO(parts[5].trim())
                            .blockIO(parts[6].trim())
                            .pids(parts[7].trim())
                            .status("RUNNING")
                            .uptime("Active")
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch stats for container {}: {}", containerNameOrId, e.getMessage());
        }

        return AppStatsDTO.builder()
                .containerId(containerNameOrId)
                .containerName(containerNameOrId)
                .cpuPercent("0.0%")
                .memoryUsage("0 MB")
                .memoryLimit("0 MB")
                .memoryPercent("0.0%")
                .netIO("0 B / 0 B")
                .blockIO("0 B / 0 B")
                .pids("0")
                .status("STOPPED")
                .uptime("Offline")
                .build();
    }

    private CommandResult executeCommand(int timeoutSeconds, String... command) {
        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            Process process = pb.start();

            Thread outThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stdout.append(line).append("\n");
                    }
                } catch (Exception ignored) {}
            });

            Thread errThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stderr.append(line).append("\n");
                    }
                } catch (Exception ignored) {}
            });

            outThread.start();
            errThread.start();

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new CommandResult(false, "", "Command timed out after " + timeoutSeconds + "s");
            }
            outThread.join(1000);
            errThread.join(1000);

            int exitCode = process.exitValue();
            return new CommandResult(exitCode == 0, stdout.toString(), stderr.toString());
        } catch (Exception e) {
            return new CommandResult(false, "", e.getMessage());
        }
    }

    private static class CommandResult {
        private final boolean success;
        private final String output;
        private final String error;

        public CommandResult(boolean success, String output, String error) {
            this.success = success;
            this.output = output;
            this.error = error;
        }

        public boolean isSuccess() { return success; }
        public String getOutput() { return output; }
        public String getError() { return error; }
    }
}
