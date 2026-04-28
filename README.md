# 3JRPG

A web-based RPG game backend built with Spring Boot 3. Players join seasons, start runs, fight enemies, and compete for the top of the leaderboard.

## Requirements

- Java 17+
- Maven 3.8+

## Running

```bash
mvn spring-boot:run
```

The server starts on `http://localhost:8080`.

## Useful endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /actuator/health` | No | Health check |
| `GET /actuator/info` | No | App info |
| `GET /h2-console` | No | In-memory DB browser |
| `POST /auth/**` | No | Authentication |
| Everything else | Bearer JWT | Game API |

## H2 Console

Available at `http://localhost:8080/h2-console` while the app is running.

| Field | Value |
|---|---|
| JDBC URL | `jdbc:h2:mem:jrpgdb` |
| Username | `sa` |
| Password | _(empty)_ |

> **Note:** The database is in-memory — all data is lost on restart.

## JWT Authentication

Protected endpoints require an `Authorization: Bearer <token>` header. Tokens are issued by the `/auth` routes and expire after 1 hour by default.

Before going to production, replace the `jwt.secret` value in `application.properties` with a securely generated secret of at least 256 bits.

## Project structure

```
src/main/java/com/jrpg/
├── Jrpg3Application.java
├── config/
│   ├── CorsConfig.java           # CORS (allowed origin: http://localhost:5173)
│   └── SecurityConfig.java       # Spring Security + JWT filter chain
├── entity/
│   ├── Player.java
│   ├── Run.java                  # A single game run
│   ├── RunEvent.java             # Events emitted during a run
│   ├── Season.java
│   ├── SeasonResult.java
│   └── EndReason.java            # DEFEATED | GAVE_UP | TIMEOUT | RESTARTED
├── repository/                   # Spring Data JPA repositories
└── security/
    ├── JwtUtil.java
    ├── JwtAuthenticationFilter.java
    ├── JwtAuthenticationEntryPoint.java
    └── PlayerDetailsService.java
```

## Configuration

Key properties in `src/main/resources/application.properties`:

| Property | Default | Description |
|---|---|---|
| `jwt.secret` | placeholder | HMAC-SHA256 signing secret |
| `jwt.expiration.ms` | `3600000` | Token TTL (1 hour) |
| `app.cors.allowed-origin` | `http://localhost:5173` | Frontend origin |
