package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @Query(value = "SELECT u FROM User u " +
            "WHERE u.firstName LIKE %:name% " +
            "or u.lastName LIKE %:name%")
    List<User> findByNameContaining(@Param("name") String name);
}
