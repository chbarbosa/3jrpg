package com.jrpg.repository;

import com.jrpg.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    Optional<Season> findByUuid(UUID uuid);
}
