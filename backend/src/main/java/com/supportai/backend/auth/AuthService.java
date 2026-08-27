package com.supportai.backend.auth;

import com.supportai.backend.exception.BadRequestException;
import com.supportai.backend.exception.ConflictException;
import com.supportai.backend.exception.ForbiddenException;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(
            RegisterRequest request
    ) {

        String normalizedEmail =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {

            throw new ConflictException(
                    "Email already registered"
            );
        }

        User user = User.builder()
                .firstName(
                        request.getFirstName().trim()
                )
                .lastName(
                        request.getLastName().trim()
                )
                .email(
                        normalizedEmail
                )
                .password(
                        passwordEncoder.encode(
                                request.getPassword()
                        )
                )
                .role(
                        Role.EMPLOYEE
                )
                .enabled(true)
                .build();

        userRepository.save(user);

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        return new AuthResponse(token);
    }

    public AuthResponse login(
            LoginRequest request
    ) {

        String normalizedEmail =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        User user =
                userRepository
                        .findByEmail(normalizedEmail)
                        .orElseThrow(
                                () -> new BadRequestException(
                                        "Invalid email or password"
                                )
                        );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {

            throw new BadRequestException(
                    "Invalid email or password"
            );
        }

        if (!user.isEnabled()) {

            throw new ForbiddenException(
                    "User account is disabled"
            );
        }

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        return new AuthResponse(token);
    }
}