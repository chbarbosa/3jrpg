package com.jrpg.player;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.auth.JwtUtil;
import com.jrpg.entity.Player;
import com.jrpg.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PlayerControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PlayerRepository playerRepository;
    @Autowired private JwtUtil jwtUtil;

    private Player player;
    private String token;

    @BeforeEach
    void setUpPlayer() {
        Player p = new Player();
        p.setNickname("ProfileHero");
        p.setEmail("profile-" + UUID.randomUUID() + "@test.com");
        p.setPasswordHash("unused-in-controller-test");
        p.setAvatarId("warrior");

        player = playerRepository.save(p);
        token = jwtUtil.generateToken(player);
    }

    @Test
    void getProfile_withValidToken_returnsPlayerProfile() throws Exception {
        mockMvc.perform(get("/api/player/profile")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerUuid").value(player.getUuid().toString()))
                .andExpect(jsonPath("$.nickname").value("ProfileHero"))
                .andExpect(jsonPath("$.avatarId").value("warrior"))
                .andExpect(jsonPath("$.totalRuns").value(0))
                .andExpect(jsonPath("$.bestRunFightsSurvived").value(0));
    }

    @Test
    void getProfile_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/player/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_withValidFields_returnsUpdatedProfile() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "UpdatedHero",
                "avatarId", "mage"));

        mockMvc.perform(put("/api/player/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerUuid").value(player.getUuid().toString()))
                .andExpect(jsonPath("$.nickname").value("UpdatedHero"))
                .andExpect(jsonPath("$.avatarId").value("mage"));
    }

    @Test
    void updateProfile_withInvalidAvatar_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("avatarId", "not-real"));

        mockMvc.perform(put("/api/player/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid avatar id: not-real"));
    }

    @Test
    void updateProfile_withTooShortNickname_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("nickname", "ab"));

        mockMvc.perform(put("/api/player/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfile_withNoFields_returns400() throws Exception {
        mockMvc.perform(put("/api/player/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("At least one field must be provided"));
    }

    @Test
    void getAvatars_returnsAvailableAvatarOptions() throws Exception {
        mockMvc.perform(get("/api/player/avatars"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("warrior"))
                .andExpect(jsonPath("$[0].label").value("Warrior"))
                .andExpect(jsonPath("$[1].id").value("ranger"));
    }
}
