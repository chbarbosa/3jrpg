package com.jrpg.security;

import com.jrpg.entity.Player;
import com.jrpg.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerDetailsService implements UserDetailsService {

    private final PlayerRepository playerRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Player player = playerRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Player not found with email: {}", email);
                    return new UsernameNotFoundException("Player not found: " + email);
                });
        return User.builder()
                .username(player.getEmail())
                .password(player.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_PLAYER")))
                .build();
    }
}
