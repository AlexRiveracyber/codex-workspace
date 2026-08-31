package com.platform.task.repository;

import com.platform.task.entity.ScheduledTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScheduledTaskRepository extends JpaRepository<ScheduledTask, Long> {
    Optional<ScheduledTask> findByTaskKey(String taskKey);
}
