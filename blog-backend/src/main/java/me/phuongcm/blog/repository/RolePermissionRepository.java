package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId")
    Set<RolePermission> findByRoleId(@Param("roleId") Long roleId);

    boolean existsByRoleIdAndPermissionId(Long roleId, Long permissionId);
}
