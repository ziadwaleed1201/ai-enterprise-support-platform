package com.supportai.backend.auth;

import com.supportai.backend.exception.ConflictException;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {

        registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123");
    }

    @Test
    void registerShouldCreateEmployeeUser() {

        when(
                userRepository.existsByEmail(
                        "test@example.com"
                )
        ).thenReturn(false);

        when(
                passwordEncoder.encode(
                        "Password123"
                )
        ).thenReturn("hashed-password");

        when(
                userRepository.save(any(User.class))
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        when(
                jwtService.generateToken(
                        "test@example.com"
                )
        ).thenReturn("jwt-token");

        AuthResponse response =
                authService.register(
                        registerRequest
                );

        assertNotNull(response);

        assertEquals(
                "jwt-token",
                response.getToken()
        );

        verify(userRepository)
                .save(
                        argThat(user ->
                                user.getRole()
                                        == Role.EMPLOYEE
                                        && user.isEnabled()
                                        && user.getEmail()
                                        .equals(
                                                "test@example.com"
                                        )
                        )
                );
    }

    @Test
    void registerShouldRejectDuplicateEmail() {

        when(
                userRepository.existsByEmail(
                        "test@example.com"
                )
        ).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () ->
                        authService.register(
                                registerRequest
                        )
        );

        verify(
                userRepository,
                never()
        ).save(any());
    }

    @Test
    void loginShouldReturnTokenForValidCredentials() {

        LoginRequest request =
                new LoginRequest();

        request.setEmail(
                "test@example.com"
        );

        request.setPassword(
                "Password123"
        );

        User user =
                User.builder()
                        .email(
                                "test@example.com"
                        )
                        .password(
                                "hashed-password"
                        )
                        .role(
                                Role.EMPLOYEE
                        )
                        .enabled(true)
                        .build();

        when(
                userRepository.findByEmail(
                        "test@example.com"
                )
        ).thenReturn(
                Optional.of(user)
        );

        when(
                passwordEncoder.matches(
                        "Password123",
                        "hashed-password"
                )
        ).thenReturn(true);

        when(
                jwtService.generateToken(
                        "test@example.com"
                )
        ).thenReturn(
                "jwt-token"
        );

        AuthResponse response =
                authService.login(
                        request
                );

        assertEquals(
                "jwt-token",
                response.getToken()
        );
    }
}