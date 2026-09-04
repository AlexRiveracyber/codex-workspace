package com.platform.document;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private static final Set<String> SUPPORTED = Set.of("doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "md", "txt", "json", "xml", "yaml", "yml", "csv", "log");
    private final Path root;

    public DocumentController(@Value("${document.library-path:/documents}") String libraryPath) {
        root = Paths.get(libraryPath).toAbsolutePath().normalize();
    }

    @GetMapping
    public LibraryResponse list() throws IOException {
        if (!Files.isDirectory(root)) return new LibraryResponse(root.getFileName().toString(), root.toString(), List.of());
        try (Stream<Path> paths = Files.walk(root)) {
            List<DocumentItem> items = paths.filter(Files::isRegularFile).filter(this::supported).map(this::toItem).sorted(Comparator.comparing(DocumentItem::modified).reversed()).toList();
            return new LibraryResponse(root.getFileName().toString(), root.toString(), items);
        }
    }

    @GetMapping("/content")
    public ResponseEntity<FileSystemResource> content(@RequestParam String path, @RequestParam(defaultValue = "false") boolean download) throws IOException {
        Path file = safeResolve(path);
        String type = Files.probeContentType(file);
        MediaType mediaType = type == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(type);
        ResponseEntity.BodyBuilder response = ResponseEntity.ok().contentType(mediaType);
        if (download) response.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(file.getFileName().toString(), StandardCharsets.UTF_8));
        return response.body(new FileSystemResource(file));
    }

    private Path safeResolve(String relative) throws IOException {
        Path resolved = root.resolve(relative).normalize();
        if (!resolved.startsWith(root) || !Files.isRegularFile(resolved)) throw new IOException("Document does not exist");
        return resolved;
    }

    private boolean supported(Path path) { return SUPPORTED.contains(extension(path)); }
    private String extension(Path path) { String name = path.getFileName().toString(); int index = name.lastIndexOf('.'); return index < 0 ? "" : name.substring(index + 1).toLowerCase(); }
    private DocumentItem toItem(Path path) {
        try {
            Path relative = root.relativize(path);
            String parent = relative.getParent() == null ? root.getFileName().toString() : relative.getParent().toString().replace('\\', '/');
            return new DocumentItem(relative.toString().replace('\\', '/'), path.getFileName().toString(), parent, extension(path), Files.size(path), Files.getLastModifiedTime(path).toInstant());
        } catch (IOException error) { throw new IllegalStateException(error); }
    }

    public record LibraryResponse(String name, String root, List<DocumentItem> documents) {}
    public record DocumentItem(String id, String name, String path, String extension, long size, Instant modified) {}
}
