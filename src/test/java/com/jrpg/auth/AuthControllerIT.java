package com.jrpg.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthControllerIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private static final String BASE_EMAIL = "itplayer@test.com";
    private static final String BASE_NICKNAME = "ITPlayer";
    private static final String BASE_PASSWORD = "securepass123";

    private String authToken;

    // Registers one player and logs in to obtain a JWT for tests that need auth.
    // Uses 2 of the 10 rate-limit slots on 127.0.0.1 for this test class.
    @BeforeAll
    void setUpPlayer() throws Exception {
        String registerBody = objectMapper.writeValueAsString(Map.of(
                "email", BASE_EMAIL,
                "nickname", BASE_NICKNAME,
                "password", BASE_PASSWORD));

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
                .andExpect(status().isOk());

        String loginBody = objectMapper.writeValueAsString(Map.of(
                "email", BASE_EMAIL,
                "password", BASE_PASSWORD));

        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
                .andExpect(status().isOk())
                .andReturn();

        authToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    @Test
    void register_validRequest_returns200WithTokenAndDefaults() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "newplayer@test.com",
                "nickname", "NewPlayer",
                "password", BASE_PASSWORD));

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.nickname").value("NewPlayer"))
                .andExpect(jsonPath("$.avatarId").value("warrior"))
                .andExpect(jsonPath("$.playerUuid").isNotEmpty());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", BASE_EMAIL,
                "nickname", "Duplicate",
                "password", BASE_PASSWORD));

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void register_invalidPayload_returns400() throws Exception {
        // validation fires before the method body, so this does NOT consume a rate-limit slot
        String body = objectMapper.writeValueAsString(Map.of(
                "email", "not-an-email",
                "nickname", "X",
                "password", "short"));

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_correctCredentials_returns200WithToken() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", BASE_EMAIL,
                "password", BASE_PASSWORD));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.nickname").value(BASE_NICKNAME));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email", BASE_EMAIL,
                "password", "wrongpassword"));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sessionCheck_withValidToken_returns200AndNoTimeout() throws Exception {
        mockMvc.perform(get("/auth/session-check")
                .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeout").value(false));
    }

    @Test
    void sessionCheck_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/auth/session-check"))
                .andExpect(status().isUnauthorized());
    }
}
