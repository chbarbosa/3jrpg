package com.jrpg.repository;

import com.jrpg.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    Optional<Season> findByUuid(UUID uuid);

    // Finds a season where startDate <= date AND endDate >= date (i.e. date is within range)
    Optional<Season> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate startBound, LocalDate endBound);

    List<Season> findAllByOrderByStartDateDesc();
}
