// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IWaveReputation} from "../interfaces/IWaveReputation.sol";
import {Errors} from "../libraries/Errors.sol";

/// @title WaveReputation
/// @notice Phase 2: On-chain identity and reputation tracking for contributors.
/// Supports identity verification, points-based reputation, and time-bound badges.
/// @dev Uses OpenZeppelin Ownable2Step for secure ownership management.
contract WaveReputation is Ownable2Step, IWaveReputation {
    /// @dev Storage mapping: contributor address => full profile.
    mapping(address => ContributorProfile) private _profiles;

    /// @dev Storage mapping: contributor => badgeId => expiry timestamp.
    mapping(address => mapping(bytes32 => uint256)) private _badges;

    /// @dev Reverts if the caller is not the contract owner.
    modifier onlyContractOwner() {
        if (msg.sender != owner()) revert Errors.Unauthorized(msg.sender);
        _;
    }

    /// @dev Reverts if the contributor has not been verified yet.
    modifier contributorExists(address contributor) {
        if (_profiles[contributor].identityHash == bytes32(0)) {
            revert Errors.ContributorNotVerified(contributor);
        }
        _;
    }

    /// @notice Initializes the contract with the deployer as the initial owner.
    constructor() Ownable2Step() {}

    // ════════════════════════════════════════════════════════════
    // Owner-Only: Identity Management
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveReputation
    function verifyContributor(address contributor, bytes32 identityHash) external onlyContractOwner {
        if (contributor == address(0)) revert Errors.ZeroAddress("contributor");
        if (identityHash == bytes32(0)) revert Errors.ZeroValue("identityHash");
        if (_profiles[contributor].identityHash != bytes32(0)) {
            revert Errors.ContributorAlreadyVerified(contributor);
        }

        _profiles[contributor] = ContributorProfile({
            identityHash: identityHash,
            totalPoints: 0,
            contributionCount: 0,
            lastActivity: block.timestamp
        });

        emit ContributorVerified(contributor, identityHash);
    }

    /// @inheritdoc IWaveReputation
    function awardPoints(
        address contributor,
        uint256 points,
        string calldata reason
    ) external onlyContractOwner contributorExists(contributor) {
        if (points == 0) revert Errors.ZeroValue("points");

        ContributorProfile storage profile = _profiles[contributor];
        profile.totalPoints += points;
        profile.contributionCount++;
        profile.lastActivity = block.timestamp;

        emit ReputationAwarded(contributor, points, reason);
    }

    /// @inheritdoc IWaveReputation
    function issueBadge(
        address contributor,
        bytes32 badgeId,
        uint256 expiry
    ) external onlyContractOwner contributorExists(contributor) {
        if (badgeId == bytes32(0)) revert Errors.ZeroValue("badgeId");
        if (expiry <= block.timestamp) revert Errors.InvalidInput("expiry must be in future");

        _badges[contributor][badgeId] = expiry;

        emit BadgeIssued(contributor, badgeId, expiry);
    }

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveReputation
    function getContributorProfile(address contributor) external view returns (ContributorProfile memory) {
        return _profiles[contributor];
    }

    /// @inheritdoc IWaveReputation
    function hasBadge(address contributor, bytes32 badgeId) external view returns (bool) {
        uint256 expiry = _badges[contributor][badgeId];
        if (expiry == 0) return false;
        if (block.timestamp >= expiry) return false;
        return true;
    }

    /// @inheritdoc IWaveReputation
    function getTotalPoints(address contributor) external view returns (uint256) {
        return _profiles[contributor].totalPoints;
    }

    /// @inheritdoc IWaveReputation
    function getContributionCount(address contributor) external view returns (uint256) {
        return _profiles[contributor].contributionCount;
    }

    /// @notice Get the expiry timestamp for a specific badge.
    /// @param contributor The contributor address.
    /// @param badgeId The badge identifier.
    /// @return The expiry timestamp, or 0 if never issued.
    function getBadgeExpiry(address contributor, bytes32 badgeId) external view returns (uint256) {
        return _badges[contributor][badgeId];
    }
}
