package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByName(String name);

    boolean existsByName(String name);

    /**
     * Lấy tất cả permissions của một user thông qua User → UserRole → Role → RolePermission → Permission.
     */
    @Query("SELECT p FROM RolePermission rp " +
           "INNER JOIN rp.permission p " +
           "INNER JOIN rp.role r " +
           "INNER JOIN UserRole ur ON ur.role.id = r.id " +
           "INNER JOIN ur.user u " +
           "WHERE u.username = :username")
    Set<Permission> findPermissionsByUsername(@Param("username") String username);

    /**
     * Lấy tất cả permissions của một user theo userId.
     */
    @Query("SELECT p FROM RolePermission rp " +
           "INNER JOIN rp.permission p " +
           "INNER JOIN rp.role r " +
           "INNER JOIN UserRole ur ON ur.role.id = r.id " +
           "INNER JOIN ur.user u " +
           "WHERE u.id = :userId")
    Set<Permission> findPermissionsByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM RolePermission rp INNER JOIN rp.permission p WHERE rp.role.id = :roleId")
    Set<Permission> findByRoleId(@Param("roleId") Long roleId);
}
