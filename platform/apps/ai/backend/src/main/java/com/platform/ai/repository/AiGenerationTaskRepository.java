package com.platform.ai.repository;

import com.platform.ai.entity.AiGenerationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiGenerationTaskRepository extends JpaRepository<AiGenerationTask, Long> {
    List<AiGenerationTask> findByTaskTypeOrderByCreatedAtDesc(String taskType);
    List<AiGenerationTask> findAllByOrderByCreatedAtDesc();
}
