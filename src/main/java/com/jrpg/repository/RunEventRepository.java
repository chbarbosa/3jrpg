package com.jrpg.repository;

import com.jrpg.entity.RunEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunEventRepository extends JpaRepository<RunEvent, Long> {
    Optional<RunEvent> findByUuid(UUID uuid);
    List<RunEvent> findByRunUuid(UUID runUuid);
}
