package com.jrpg.repository;

import com.jrpg.entity.SeasonResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeasonResultRepository extends JpaRepository<SeasonResult, Long> {
    Optional<SeasonResult> findByUuid(UUID uuid);
    List<SeasonResult> findBySeasonUuid(UUID seasonUuid);
    List<SeasonResult> findByPlayerUuid(UUID playerUuid);
    Optional<SeasonResult> findBySeasonUuidAndPlayerUuid(UUID seasonUuid, UUID playerUuid);
}
