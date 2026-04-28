package com.jrpg.repository;

import com.jrpg.entity.Run;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunRepository extends JpaRepository<Run, Long> {
    Optional<Run> findByUuid(UUID uuid);
    List<Run> findByPlayerUuid(UUID playerUuid);
}
