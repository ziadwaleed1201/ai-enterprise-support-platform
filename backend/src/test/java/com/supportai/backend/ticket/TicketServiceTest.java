package com.supportai.backend.ticket;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import com.supportai.backend.exception.BadRequestException;
import com.supportai.backend.exception.ForbiddenException;
import com.supportai.backend.exception.ResourceNotFoundException;
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
class TicketServiceTest {

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
    private Department department;
    private Category category;

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

        department = Department.builder()
                .id(1L)
                .name("IT")
                .description("IT Support")
                .active(true)
                .build();

        category = Category.builder()
                .id(1L)
                .name("Laptop Issue")
                .description("Laptop support")
                .department(department)
                .active(true)
                .build();
    }

    @Test
    void createTicketShouldCreateTicketSuccessfully() {

        CreateTicketRequest request =
                new CreateTicketRequest();

        request.setTitle("Laptop issue");
        request.setDescription("Laptop is not working");
        request.setDepartmentId(1L);
        request.setCategoryId(1L);
        request.setPriority(TicketPriority.HIGH);

        when(
                userRepository.findByEmail(
                        "employee@test.com"
                )
        ).thenReturn(
                Optional.of(employee)
        );

        when(
                departmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(department)
        );

        when(
                categoryRepository.findById(1L)
        ).thenReturn(
                Optional.of(category)
        );

        when(
                ticketRepository.save(
                        any(Ticket.class)
                )
        ).thenAnswer(invocation -> {

            Ticket ticket =
                    invocation.getArgument(0);

            ticket.setId(1L);

            return ticket;
        });

        TicketResponse response =
                ticketService.createTicket(
                        request,
                        "employee@test.com"
                );

        assertNotNull(response);

        assertEquals(
                1L,
                response.getId()
        );

        assertEquals(
                "Laptop issue",
                response.getTitle()
        );

        assertEquals(
                TicketPriority.HIGH,
                response.getPriority()
        );

        assertEquals(
                TicketStatus.NEW,
                response.getStatus()
        );

        assertEquals(
                "IT",
                response.getDepartmentName()
        );

        assertEquals(
                "Laptop Issue",
                response.getCategoryName()
        );

        assertNotNull(
                response.getResponseDueAt()
        );

        assertNotNull(
                response.getResolutionDueAt()
        );

        verify(
                ticketRepository,
                times(1)
        ).save(any(Ticket.class));

        verify(
                ticketHistoryRepository,
                times(1)
        ).save(any(TicketHistory.class));

        verify(
                notificationService,
                times(1)
        ).createNotification(
                eq(employee),
                eq("Ticket Created"),
                anyString(),
                eq(1L)
        );
    }

    @Test
    void createTicketShouldRejectWrongCategoryDepartment() {

        Department otherDepartment =
                Department.builder()
                        .id(2L)
                        .name("HR")
                        .active(true)
                        .build();

        Category wrongCategory =
                Category.builder()
                        .id(2L)
                        .name("Payroll")
                        .department(otherDepartment)
                        .active(true)
                        .build();

        CreateTicketRequest request =
                new CreateTicketRequest();

        request.setTitle("Test");
        request.setDescription("Test");
        request.setDepartmentId(1L);
        request.setCategoryId(2L);

        when(
                userRepository.findByEmail(
                        "employee@test.com"
                )
        ).thenReturn(
                Optional.of(employee)
        );

        when(
                departmentRepository.findById(1L)
        ).thenReturn(
                Optional.of(department)
        );

        when(
                categoryRepository.findById(2L)
        ).thenReturn(
                Optional.of(wrongCategory)
        );

        assertThrows(
                BadRequestException.class,
                () ->
                        ticketService.createTicket(
                                request,
                                "employee@test.com"
                        )
        );

        verify(
                ticketRepository,
                never()
        ).save(any());
    }

    @Test
    void getTicketByIdShouldRejectUnknownTicket() {

        when(
                ticketRepository.findById(999L)
        ).thenReturn(
                Optional.empty()
        );

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        ticketService.getTicketById(
                                999L,
                                "employee@test.com"
                        )
        );
    }

    @Test
    void getTicketByIdShouldRejectUnauthorizedUser() {

        User otherEmployee =
                User.builder()
                        .id(2L)
                        .email("other@test.com")
                        .role(Role.EMPLOYEE)
                        .enabled(true)
                        .build();

        Ticket ticket =
                Ticket.builder()
                        .id(1L)
                        .title("Private ticket")
                        .description("Test")
                        .status(TicketStatus.NEW)
                        .priority(TicketPriority.MEDIUM)
                        .department(department)
                        .category(category)
                        .createdBy(employee)
                        .build();

        when(
                ticketRepository.findById(1L)
        ).thenReturn(
                Optional.of(ticket)
        );

        when(
                userRepository.findByEmail(
                        "other@test.com"
                )
        ).thenReturn(
                Optional.of(otherEmployee)
        );

        assertThrows(
                ForbiddenException.class,
                () ->
                        ticketService.getTicketById(
                                1L,
                                "other@test.com"
                        )
        );
    }
}