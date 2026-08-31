package com.platform.repository;

import com.platform.entity.ManagedApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagedAppRepository extends JpaRepository<ManagedApp, Long> {
    Optional<ManagedApp> findByAppKey(String appKey);
    Optional<ManagedApp> findByContainerName(String containerName);
    Optional<ManagedApp> findByContainerId(String containerId);
    List<ManagedApp> findByCategory(String category);
    List<ManagedApp> findByStatus(String status);
    List<ManagedApp> findByNameContainingIgnoreCase(String keyword);
    long countByStatus(String status);
}
