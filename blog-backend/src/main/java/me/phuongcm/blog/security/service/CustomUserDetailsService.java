package me.phuongcm.blog.security.service;

import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.repository.UserRoleRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    private final UserRoleRepository userRoleRepository;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username).orElseThrow(() ->
                new UsernameNotFoundException("User not found with username: " + username)
        );

        Set<Role> roles = userRoleRepository.findRoleByUsername(user.getUsername());
        Set<String> roleNames = roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return new CustomUserDetails(user.getId(), user.getUsername(), user.getEmail(), user.getPassword(), roleNames);
    }
}
