package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.RegisterRequest;
import me.phuongcm.blog.dto.UserDTO;

import java.util.List;
import java.util.Optional;

public interface UserService {

    UserDTO getCurrentUser(String username);

    UserDTO register(RegisterRequest registerRequest);

    List<UserDTO> getAllUsers();

    Optional<UserDTO> getUserById(Long id);

    Optional<UserDTO> getUserByEmail(String email);

    UserDTO createUser(UserDTO userDTO, String password);

    UserDTO updateUser(Long id, UserDTO userDTO);

    void deleteUser(Long id);

    List<UserDTO> searchUsers(String name);

    void assignRolesToUser(Long userId, List<Long> roleIds);
}
