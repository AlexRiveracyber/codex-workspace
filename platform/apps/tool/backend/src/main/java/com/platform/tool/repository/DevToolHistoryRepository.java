package com.platform.tool.repository;

import com.platform.tool.entity.DevToolHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevToolHistoryRepository extends JpaRepository<DevToolHistory, Long> {
    List<DevToolHistory> findByToolKeyOrderByCreatedAtDesc(String toolKey);
    List<DevToolHistory> findTop50ByOrderByCreatedAtDesc();
}
