package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    @Query("SELECT r FROM UserRole ur " +
            "INNER JOIN ur.user u " +
            "INNER JOIN ur.role r " +
            "WHERE u.username = :username")
    Set<Role> findRoleByUsername(@Param("username") String username);

    @Query("SELECT r FROM UserRole ur " +
            "INNER JOIN ur.user u " +
            "INNER JOIN ur.role r " +
            "WHERE u.email = :email")
    Set<Role> findRoleByEmail(@Param("email") String email);

    /**
     * Fix: "select ur" → "select r" để trả đúng kiểu dữ liệu Set<Role>
     * Trước đây dùng "select ur" (UserRole) nhưng return type là Set<Role> → ClassCastException
     */
    @Query("SELECT r FROM UserRole ur " +
            "INNER JOIN ur.user u " +
            "INNER JOIN ur.role r " +
            "WHERE u.id = :userId")
    Set<Role> findRoleByUserId(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    long countByRoleId(Long roleId);

    @Query("SELECT ur.user.id FROM UserRole ur WHERE ur.role.name = :roleName")
    List<Long> findUserIdsByRoleName(@Param("roleName") String roleName);
}
