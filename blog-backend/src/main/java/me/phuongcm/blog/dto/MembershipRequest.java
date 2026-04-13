package me.phuongcm.blog.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MembershipRequest {
    /** Ngày hết hạn membership, null = không hết hạn */
    private LocalDateTime expiredAt;
}
