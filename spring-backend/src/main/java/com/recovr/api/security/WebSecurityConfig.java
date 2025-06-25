package com.recovr.api.security;

import com.recovr.api.security.jwt.JwtAuthenticationEntryPoint;
import com.recovr.api.security.jwt.JwtRequestFilter;
import com.recovr.api.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods}")
    private String allowedMethods;

    @Value("${cors.allowed-headers}")
    private String allowedHeaders;

    @Value("${cors.exposed-headers}")
    private String exposedHeaders;

    @Bean
    public JwtRequestFilter authenticationJwtTokenFilter() {
        return new JwtRequestFilter();
    }

    @Bean
    public RateLimitingFilter rateLimitingFilter() {
        return new RateLimitingFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) 
            throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8082", "http://localhost:3000", "http://localhost:3001"));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        configuration.setExposedHeaders(Arrays.asList(exposedHeaders.split(",")));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/api/test/**").permitAll()
                
                // Public read access to items (limited) - MUST come before general /api/items patterns
                .requestMatchers(HttpMethod.GET, "/api/items/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/items/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/items/search").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/items/search").permitAll()
                
                // Item CRUD - allow public item creation, require auth for other operations (general patterns come after specific ones)
                .requestMatchers(HttpMethod.POST, "/api/items").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/items/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/items").authenticated()
                
                // File access - allow public read for images and detected objects
                .requestMatchers(HttpMethod.GET, "/api/files/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/detected-objects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                
                // File upload - require authentication
                .requestMatchers(HttpMethod.POST, "/api/files/upload").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/files/detection/upload").hasRole("ADMIN")
                
                // Detection endpoints - more secure
                .requestMatchers("/api/detection/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/detection/process").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/detection/sessions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/detection/stats").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/detection/recent").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/detection/abandoned").authenticated()
                
                // Health checks
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                
                // API documentation
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Claim requests - require authentication
                .requestMatchers("/api/claims/**").authenticated()
                
                // User profile - require authentication
                .requestMatchers("/api/user/**").authenticated()
                
                // Item updates - require authentication
                .requestMatchers(HttpMethod.PUT, "/api/items/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/items/**").hasRole("ADMIN")
                
                // Search endpoints - public
                .requestMatchers("/api/search/**").permitAll()
                
                // File upload for multiple files - require authentication
                .requestMatchers(HttpMethod.POST, "/api/files/upload-multiple").authenticated()
                
                // Detection sessions - allow public access for testing
                .requestMatchers("/api/detection/sessions/**").permitAll()
                
                // All other requests require authentication
                .anyRequest().authenticated()
            );

        // For H2 Console (development only)
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        http.authenticationProvider(authenticationProvider());
        
        // Add filters in correct order
        http.addFilterBefore(rateLimitingFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}