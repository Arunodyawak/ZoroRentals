package com.zororentals.backend.review;

import com.zororentals.backend.user.User;
import com.zororentals.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    public List<Review> getReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    public Review createReview(ReviewRequest request) {
        User user = getUser(request.userId());
        Review review = new Review();
        review.setUser(user);
        applyReviewDetails(review, request);
        return reviewRepository.save(review);
    }

    public Review updateReview(Long id, ReviewRequest request) {
        Review review = getReview(id);
        // A user can edit only the review that belongs to their user account.
        assertOwner(review, request.userId());
        applyReviewDetails(review, request);
        return reviewRepository.save(review);
    }

    public void deleteReview(Long id, Long userId) {
        Review review = getReview(id);
        // A user can delete only the review that belongs to their user account.
        assertOwner(review, userId);
        reviewRepository.delete(review);
    }

    private Review getReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found."));
    }

    private User getUser(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required.");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private void applyReviewDetails(Review review, ReviewRequest request) {
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5.");
        }

        if (!StringUtils.hasText(request.comment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review comment is required.");
        }

        String cleanComment = request.comment().trim();

        if (cleanComment.length() < 10 || cleanComment.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review comment must be between 10 and 500 characters.");
        }

        review.setRating(request.rating());
        review.setComment(cleanComment);
    }

    private void assertOwner(Review review, Long userId) {
        if (userId == null || !review.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only change your own reviews.");
        }
    }
}
