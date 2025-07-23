package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.RegisterRequest;
import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.entity.User;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

public interface UserService {

    User getCurrentUser(String username);

    User register(RegisterRequest registerRequest);

    List<User> getAllUsers();

    Optional<User> getUserById(Long id);

    Optional<User> getUserByEmail(String email);

    User createUser(UserDTO userDTO, String password);

    User updateUser(Long id, UserDTO userDTO);

    void deleteUser(Long id);

    List<User> searchUsers(String name);
}
