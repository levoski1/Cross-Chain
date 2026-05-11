// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWaveReputation {
    event ReputationAwarded(
        address indexed contributor,
        uint256 points,
        string reason
    );

    event ContributorVerified(
        address indexed contributor,
        bytes32 indexed identityHash
    );

    event BadgeIssued(
        address indexed contributor,
        bytes32 indexed badgeId,
        uint256 expiry
    );

    struct ContributorProfile {
        bytes32 identityHash;
        uint256 totalPoints;
        uint256 contributionCount;
        uint256 lastActivity;
    }

    /// @notice Register a contributor with an on-chain identity hash.
    /// @param contributor The contributor's wallet address.
    /// @param identityHash A hash representing their off-chain identity.
    function verifyContributor(address contributor, bytes32 identityHash) external;

    /// @notice Award reputation points to a verified contributor.
    /// @param contributor The contributor address.
    /// @param points Number of points to award.
    /// @param reason Human-readable reason for the award.
    function awardPoints(address contributor, uint256 points, string calldata reason) external;

    /// @notice Issue a time-bound badge to a verified contributor.
    /// @param contributor The contributor address.
    /// @param badgeId Unique identifier for the badge type.
    /// @param expiry Unix timestamp when the badge expires.
    function issueBadge(address contributor, bytes32 badgeId, uint256 expiry) external;

    /// @notice Get the full profile for a contributor.
    /// @param contributor The contributor address.
    /// @return The ContributorProfile struct.
    function getContributorProfile(address contributor) external view returns (ContributorProfile memory);

    /// @notice Check if a contributor holds an unexpired badge.
    /// @param contributor The contributor address.
    /// @param badgeId The badge identifier.
    /// @return True if the badge is still valid.
    function hasBadge(address contributor, bytes32 badgeId) external view returns (bool);

    /// @notice Get the total reputation points for a contributor.
    /// @param contributor The contributor address.
    /// @return Total points accumulated.
    function getTotalPoints(address contributor) external view returns (uint256);

    /// @notice Get the total number of contributions by a contributor.
    /// @param contributor The contributor address.
    /// @return Total contribution count.
    function getContributionCount(address contributor) external view returns (uint256);
}
