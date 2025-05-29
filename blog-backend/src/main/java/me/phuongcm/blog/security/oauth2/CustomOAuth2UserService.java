package me.phuongcm.blog.security.oauth2;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import me.phuongcm.blog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.stereotype.Service;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    @Autowired
    UserRepository userRepository;


}
