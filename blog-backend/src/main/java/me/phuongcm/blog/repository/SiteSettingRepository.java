package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteSettingRepository extends JpaRepository<SiteSetting, Long> {

    List<SiteSetting> findByGroup(String group);

    Optional<SiteSetting> findByKey(String key);

    boolean existsByKey(String key);
}
