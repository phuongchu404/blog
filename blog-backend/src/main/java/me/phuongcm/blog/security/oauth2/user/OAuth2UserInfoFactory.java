package me.phuongcm.blog.security.oauth2.user;

import me.phuongcm.blog.common.exception.OAuth2AuthenticationProcessingException;
import me.phuongcm.blog.common.utils.AuthProvider;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

public class OAuth2UserInfoFactory {
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        if(AuthProvider.google.toString().equalsIgnoreCase(registrationId)) {
            return new GoogleOAuth2UserInfo(attributes);
        } else if(AuthProvider.facebook.toString().equalsIgnoreCase(registrationId)) {
            return new FacebookOAuth2UserInfo(attributes);
        } else if(AuthProvider.github.toString().equalsIgnoreCase(registrationId)) {
            return new GithubOAuth2UserInfo(attributes);
        } else {
            throw new OAuth2AuthenticationProcessingException("Sorry! Login with " + registrationId + " is not supported yet.");
        }
    }
}
