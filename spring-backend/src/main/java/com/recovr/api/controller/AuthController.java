package com.recovr.api.controller;

import com.recovr.api.dto.JwtResponse;
import com.recovr.api.dto.LoginRequest;
import com.recovr.api.dto.MessageResponse;
import com.recovr.api.dto.SignupRequest;
import com.recovr.api.entity.ERole;
import com.recovr.api.entity.Role;
import com.recovr.api.entity.User;
import com.recovr.api.repository.RoleRepository;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.AccountLockoutService;
import com.recovr.api.security.PasswordPolicyService;
import com.recovr.api.security.jwt.JwtUtils;
import com.recovr.api.security.services.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    AccountLockoutService accountLockoutService;

    @Autowired
    PasswordPolicyService passwordPolicyService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, 
                                            HttpServletRequest request) {
        
        String identifier = loginRequest.getUsername(); // Can be username or email
        String clientIp = getClientIpAddress(request);
        
        logger.info("Login attempt for identifier: {} from IP: {}", identifier, clientIp);

        try {
            // Check if account is locked
            if (accountLockoutService.isAccountLocked(identifier)) {
                long remainingTime = accountLockoutService.getRemainingLockoutTime(identifier);
                logger.warn("Login attempt for locked account: {} from IP: {}", identifier, clientIp);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Account temporarily locked");
                errorResponse.put("message", "Account is locked due to multiple failed login attempts");
                errorResponse.put("remainingLockoutMinutes", remainingTime);
                errorResponse.put("type", "ACCOUNT_LOCKED");
                
                return ResponseEntity.status(HttpStatus.LOCKED).body(errorResponse);
            }

            // Attempt authentication
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

            // Record successful login
            accountLockoutService.recordSuccessfulLogin(identifier);
            
            // Update user's last login time
            userRepository.findByUsernameOrEmail(identifier, identifier)
                .ifPresent(user -> {
                    user.setLastLoginAt(LocalDateTime.now());
                    userRepository.save(user);
                });

            logger.info("Successful login for user: {} from IP: {}", identifier, clientIp);

            // Enhanced response with additional security info
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("type", "Bearer");
            response.put("id", userDetails.getId());
            response.put("username", userDetails.getUsername());
            response.put("email", userDetails.getEmail());
            response.put("roles", roles);
            response.put("loginTime", LocalDateTime.now());
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // Record failed attempt
            accountLockoutService.recordFailedAttempt(identifier);
            
            AccountLockoutService.LockoutStatus status = accountLockoutService.getLockoutStatus(identifier);
            
            logger.warn("Failed login attempt for identifier: {} from IP: {} (Attempt {}/{})", 
                       identifier, clientIp, status.getFailedAttempts(), status.getMaxAllowedAttempts());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid credentials");
            errorResponse.put("message", "Invalid username/email or password");
            errorResponse.put("remainingAttempts", status.getRemainingAttempts());
            errorResponse.put("type", "INVALID_CREDENTIALS");
            
            if (status.getRemainingAttempts() <= 2 && status.getRemainingAttempts() > 0) {
                errorResponse.put("warning", "Account will be locked after " + status.getRemainingAttempts() + " more failed attempts");
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            
        } catch (DisabledException e) {
            logger.warn("Login attempt for disabled account: {} from IP: {}", identifier, clientIp);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Account disabled");
            errorResponse.put("message", "Your account has been disabled. Please contact support.");
            errorResponse.put("type", "ACCOUNT_DISABLED");
            
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Authentication error for identifier: {} from IP: {}", identifier, clientIp, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Authentication failed");
            errorResponse.put("message", "An error occurred during authentication");
            errorResponse.put("type", "AUTHENTICATION_ERROR");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest,
                                        HttpServletRequest request) {
        
        String clientIp = getClientIpAddress(request);
        logger.info("Registration attempt for username: {} email: {} from IP: {}", 
                   signUpRequest.getUsername(), signUpRequest.getEmail(), clientIp);

        Map<String, Object> response = new HashMap<>();

        // Check if username exists
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            response.put("error", "Username already exists");
            response.put("message", "This username is already taken. Please choose another.");
            response.put("field", "username");
            return ResponseEntity.badRequest().body(response);
        }

        // Check if email exists
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            response.put("error", "Email already exists");
            response.put("message", "An account with this email already exists.");
            response.put("field", "email");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate password strength
        PasswordPolicyService.PasswordValidationResult passwordValidation = 
            passwordPolicyService.validatePassword(signUpRequest.getPassword());
        
        if (!passwordValidation.isValid()) {
            response.put("error", "Password policy violation");
            response.put("message", "Password does not meet security requirements");
            response.put("passwordErrors", passwordValidation.getErrors());
            response.put("passwordStrength", passwordValidation.getStrength());
            response.put("strengthDescription", passwordPolicyService.getStrengthDescription(passwordValidation.getStrength()));
            response.put("field", "password");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Create new user account
            User user = new User();
            user.setUsername(signUpRequest.getUsername());
            user.setEmail(signUpRequest.getEmail());
            user.setPassword(encoder.encode(signUpRequest.getPassword()));
            user.setFirstName(signUpRequest.getFirstName());
            user.setLastName(signUpRequest.getLastName());
            
            // Set full_name by concatenating firstName and lastName
            String fullName = (signUpRequest.getFirstName() != null ? signUpRequest.getFirstName() : "") + 
                             (signUpRequest.getLastName() != null ? " " + signUpRequest.getLastName() : "").trim();
            user.setFullName(fullName.isEmpty() ? signUpRequest.getUsername() : fullName);
            user.setPhone(signUpRequest.getPhone());
            user.setCreatedAt(LocalDateTime.now());
            user.setEnabled(true); // Account enabled by default

            // Assign default role
            Set<Role> roles = new HashSet<>();
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
            user.setRoles(roles);

            userRepository.save(user);

            logger.info("User registered successfully: {} from IP: {}", signUpRequest.getUsername(), clientIp);

            response.put("success", true);
            response.put("message", "User registered successfully!");
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("passwordStrength", passwordValidation.getStrength());
            response.put("strengthDescription", passwordPolicyService.getStrengthDescription(passwordValidation.getStrength()));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Registration error for username: {} from IP: {}", signUpRequest.getUsername(), clientIp, e);
            
            response.put("error", "Registration failed");
            response.put("message", "An error occurred during registration. Please try again.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/validate-password")
    public ResponseEntity<?> validatePassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        
        if (password == null || password.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("strength", 0);
            response.put("strengthDescription", "No password provided");
            response.put("errors", List.of("Password is required"));
            return ResponseEntity.badRequest().body(response);
        }

        PasswordPolicyService.PasswordValidationResult validation = 
            passwordPolicyService.validatePassword(password);

        Map<String, Object> response = new HashMap<>();
        response.put("valid", validation.isValid());
        response.put("strength", validation.getStrength());
        response.put("strengthDescription", passwordPolicyService.getStrengthDescription(validation.getStrength()));
        response.put("errors", validation.getErrors());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/lockout-status/{identifier}")
    public ResponseEntity<?> getLockoutStatus(@PathVariable String identifier) {
        AccountLockoutService.LockoutStatus status = accountLockoutService.getLockoutStatus(identifier);
        
        Map<String, Object> response = new HashMap<>();
        response.put("locked", status.isLocked());
        response.put("failedAttempts", status.getFailedAttempts());
        response.put("remainingAttempts", status.getRemainingAttempts());
        response.put("remainingLockoutMinutes", status.getRemainingLockoutMinutes());
        response.put("maxAllowedAttempts", status.getMaxAllowedAttempts());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/unlock-account")
    public ResponseEntity<?> unlockAccount(@RequestBody Map<String, String> request) {
        // This endpoint should be protected and only accessible by admins
        String identifier = request.get("identifier");
        
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Identifier is required"));
        }

        accountLockoutService.unlockAccount(identifier);
        
        logger.info("Account manually unlocked: {}", identifier);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Account unlocked successfully",
            "identifier", identifier
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new MessageResponse("Not authenticated"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new JwtResponse(
                null, // No token in response for this endpoint
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                userDetails.getAuthorities().stream()
                        .map(item -> item.getAuthority())
                        .collect(Collectors.toList())
        ));
    }

    /**
     * Get client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null || xForwardedForHeader.isEmpty()) {
            return request.getRemoteAddr();
        } else {
            return xForwardedForHeader.split(",")[0].trim();
        }
    }
}