package com.platform.ai.repository;

import com.platform.ai.entity.AiProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiProviderRepository extends JpaRepository<AiProvider, Long> {
    Optional<AiProvider> findByProviderKey(String providerKey);
    Optional<AiProvider> findFirstByIsDefaultTrue();
}
