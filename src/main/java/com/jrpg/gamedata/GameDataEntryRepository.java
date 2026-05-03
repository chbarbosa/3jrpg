package com.jrpg.gamedata;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameDataEntryRepository extends JpaRepository<GameDataEntry, Long> {
    Optional<GameDataEntry> findByDataKey(String dataKey);
    boolean existsByDataKey(String dataKey);
}
