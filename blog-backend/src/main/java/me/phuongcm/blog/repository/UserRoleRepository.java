package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    @Query(value = "select r from UserRole ur " +
            "inner join ur.user u " +
            "inner join ur.role r " +
            "where u.username = :username")
    Set<Role> findRoleByUsername(@Param("username") String username);

    @Query(value = "select ur from UserRole ur " +
            "inner join ur.user u " +
            "inner join ur.role r " +
            "where u.email = :email")
    Set<Role> findRoleByEmail(@Param("email") String email);
}
