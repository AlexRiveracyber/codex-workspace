package com.platform.tool.repository;

import com.platform.tool.entity.DevToolSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevToolSnippetRepository extends JpaRepository<DevToolSnippet, Long> {
    List<DevToolSnippet> findByCategoryOrderByIsPinnedDescCreatedAtDesc(String category);
    List<DevToolSnippet> findAllByOrderByIsPinnedDescCreatedAtDesc();
    List<DevToolSnippet> findByTitleContainingIgnoreCaseOrTagsContainingIgnoreCase(String title, String tag);
}
