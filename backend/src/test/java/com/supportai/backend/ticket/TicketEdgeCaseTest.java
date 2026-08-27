package com.supportai.backend.ticket;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import com.supportai.backend.exception.BadRequestException;
import com.supportai.backend.notification.NotificationService;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketEdgeCaseTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TicketCommentRepository ticketCommentRepository;

    @Mock
    private TicketHistoryRepository ticketHistoryRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TicketService ticketService;

    private User employee;
    private User agent;
    private Department department;
    private Category category;
    private Ticket ticket;

    @BeforeEach
    void setUp() {

        employee = User.builder()
                .id(1L)
                .firstName("Test")
                .lastName("Employee")
                .email("employee@test.com")
                .password("hashed-password")
                .role(Role.EMPLOYEE)
                .enabled(true)
                .build();

        agent = User.builder()
                .id(2L)
                .firstName("Support")
                .lastName("Agent")
                .email("agent@test.com")
                .password("hashed-password")
                .role(Role.SUPPORT_AGENT)
                .enabled(true)
                .build();

        department = Department.builder()
                .id(1L)
                .name("IT")
                .description("IT Support")
                .active(true)
                .build();

        category = Category.builder()
                .id(1L)
                .name("Laptop Issue")
                .department(department)
                .active(true)
                .build();

        ticket = Ticket.builder()
                .id(1L)
                .title("Laptop Issue")
                .description("Laptop is not working")
                .status(TicketStatus.OPEN)
                .priority(TicketPriority.MEDIUM)
                .department(department)
                .category(category)
                .createdBy(employee)
                .assignedAgent(agent)
                .build();
    }

    @Test
    void updateStatusShouldRejectSameStatus() {

        when(
                ticketRepository.findById(1L)
        ).thenReturn(
                Optional.of(ticket)
        );

        when(
                userRepository.findByEmail(
                        "agent@test.com"
                )
        ).thenReturn(
                Optional.of(agent)
        );

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.updateStatus(
                                1L,
                                TicketStatus.OPEN,
                                "agent@test.com"
                        )
        );

        verify(
                ticketRepository,
                never()
        ).save(any());
    }

    @Test
    void assignTicketShouldRejectEmployeeAsAgent() {

        when(
                ticketRepository.findById(1L)
        ).thenReturn(
                Optional.of(ticket)
        );

        when(
                userRepository.findById(1L)
        ).thenReturn(
                Optional.of(employee)
        );

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.assignTicket(
                                1L,
                                1L
                        )
        );
    }

    @Test
    void assignTicketShouldRejectDisabledAgent() {

        User disabledAgent =
                User.builder()
                        .id(3L)
                        .email("disabled@test.com")
                        .role(Role.SUPPORT_AGENT)
                        .enabled(false)
                        .build();

        when(
                ticketRepository.findById(1L)
        ).thenReturn(
                Optional.of(ticket)
        );

        when(
                userRepository.findById(3L)
        ).thenReturn(
                Optional.of(disabledAgent)
        );

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.assignTicket(
                                1L,
                                3L
                        )
        );
    }

    @Test
    void searchShouldRejectInvalidPageSize() {

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.searchTickets(
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                0,
                                0,
                                "createdAt",
                                "desc"
                        )
        );
    }

    @Test
    void searchShouldRejectInvalidSortField() {

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.searchTickets(
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                0,
                                10,
                                "somethingInvalid",
                                "desc"
                        )
        );
    }

    @Test
    void searchShouldRejectInvalidSortDirection() {

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.searchTickets(
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                0,
                                10,
                                "createdAt",
                                "sideways"
                        )
        );
    }
}