package com.supportai.backend.ticket;

import com.supportai.backend.auth.JwtService;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
                "spring.datasource.url=jdbc:h2:mem:testdb",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.jwt.secret=SupportAITestSecretKey12345678901234567890",
                "app.jwt.expiration-ms=86400000"
        }
)
@AutoConfigureMockMvc
class TicketControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String employeeToken;
    private String agentToken;

    @BeforeEach
    void setUp() {

        userRepository.deleteAll();

        User employee = User.builder()
                .firstName("Test")
                .lastName("Employee")
                .email("employee@test.com")
                .password(
                        passwordEncoder.encode("Password123")
                )
                .role(Role.EMPLOYEE)
                .enabled(true)
                .build();

        User agent = User.builder()
                .firstName("Test")
                .lastName("Agent")
                .email("agent@test.com")
                .password(
                        passwordEncoder.encode("Password123")
                )
                .role(Role.SUPPORT_AGENT)
                .enabled(true)
                .build();

        userRepository.save(employee);
        userRepository.save(agent);

        employeeToken =
                jwtService.generateToken(
                        employee.getEmail()
                );

        agentToken =
                jwtService.generateToken(
                        agent.getEmail()
                );
    }

    @Test
    void searchTicketsShouldRejectUnauthenticatedRequest()
            throws Exception {

        mockMvc.perform(
                        get("/api/tickets/search")
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    @Test
    void searchTicketsShouldRejectEmployee()
            throws Exception {

        mockMvc.perform(
                        get("/api/tickets/search")
                                .header(
                                        "Authorization",
                                        "Bearer " + employeeToken
                                )
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    @Test
    void searchTicketsShouldAllowSupportAgent()
            throws Exception {

        mockMvc.perform(
                        get("/api/tickets/search")
                                .header(
                                        "Authorization",
                                        "Bearer " + agentToken
                                )
                )
                .andExpect(
                        status().isOk()
                );
    }
}