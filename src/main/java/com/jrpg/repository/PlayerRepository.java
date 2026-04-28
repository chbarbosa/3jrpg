package com.jrpg.repository;

import com.jrpg.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    Optional<Player> findByUuid(UUID uuid);
    Optional<Player> findByEmail(String email);
}
