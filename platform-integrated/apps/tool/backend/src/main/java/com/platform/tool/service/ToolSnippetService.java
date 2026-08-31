package com.platform.tool.service;

import com.platform.tool.entity.DevToolSnippet;
import com.platform.tool.repository.DevToolSnippetRepository;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ToolSnippetService {

    private final DevToolSnippetRepository snippetRepository;

    public ToolSnippetService(DevToolSnippetRepository snippetRepository) {
        this.snippetRepository = snippetRepository;
    }

    public List<DevToolSnippet> listSnippets(String category, String keyword) {
        if (StringUtils.isNotBlank(keyword)) {
            return snippetRepository.findByTitleContainingIgnoreCaseOrTagsContainingIgnoreCase(keyword, keyword);
        }
        if (StringUtils.isNotBlank(category) && !"ALL".equalsIgnoreCase(category)) {
            return snippetRepository.findByCategoryOrderByIsPinnedDescCreatedAtDesc(category);
        }
        return snippetRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
    }

    public Optional<DevToolSnippet> getSnippetById(Long id) {
        return snippetRepository.findById(id);
    }

    public DevToolSnippet saveSnippet(DevToolSnippet snippet) {
        if (StringUtils.isBlank(snippet.getTitle())) {
            throw new IllegalArgumentException("片段标题不能为空");
        }
        if (StringUtils.isBlank(snippet.getCodeContent())) {
            throw new IllegalArgumentException("代码内容不能为空");
        }
        return snippetRepository.save(snippet);
    }

    public void deleteSnippet(Long id) {
        snippetRepository.deleteById(id);
    }

    public DevToolSnippet togglePin(Long id) {
        DevToolSnippet snippet = snippetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("代码片段不存在"));
        snippet.setIsPinned(!Boolean.TRUE.equals(snippet.getIsPinned()));
        return snippetRepository.save(snippet);
    }
}
