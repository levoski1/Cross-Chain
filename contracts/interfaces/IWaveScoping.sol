// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IWaveScoping
/// @notice Phase 3: Community governance for issue selection.
/// Allows community members to propose issues and vote on them.
/// Selected issues are associated with Wave rounds for funding.
interface IWaveScoping {
    event IssueProposed(
        uint256 indexed issueId,
        address indexed proposer,
        string description,
        uint256 rewardPool
    );

    event IssueSelected(
        uint256 indexed issueId,
        uint256 indexed waveId,
        uint256 approvalWeight,
        uint256 totalVotes
    );

    event VoteCast(
        uint256 indexed issueId,
        address indexed voter,
        uint256 weight,
        bool inFavor
    );

    event IssueFinalized(uint256 indexed issueId, bool selected);

    struct Issue {
        uint256 id;
        address proposer;
        string description;
        uint256 rewardPool;
        uint256 approvalWeight;
        uint256 rejectionWeight;
        bool selected;
        bool finalized;
    }

    /// @notice Propose a new issue for community voting.
    /// @param description Description of the issue (10-1024 chars).
    /// @param rewardPool Proposed reward pool for the issue.
    /// @return issueId The ID of the newly created issue.
    function proposeIssue(string calldata description, uint256 rewardPool) external returns (uint256 issueId);

    /// @notice Cast a weighted vote on an issue.
    /// @param issueId The issue to vote on.
    /// @param inFavor True to approve, false to reject.
    /// @param weight The voting weight to apply.
    function voteOnIssue(uint256 issueId, bool inFavor, uint256 weight) external;

    /// @notice Select an approved issue for a Wave. Owner-only.
    /// @param issueId The issue to select.
    /// @param waveId The Wave ID to associate.
    function selectIssueForWave(uint256 issueId, uint256 waveId) external;

    /// @notice Get the full details of an issue.
    /// @param issueId The issue ID.
    /// @return The Issue struct.
    function getIssue(uint256 issueId) external view returns (Issue memory);

    /// @notice Get total votes (approval + rejection) on an issue.
    /// @param issueId The issue ID.
    /// @return Total vote weight.
    function getTotalVotes(uint256 issueId) external view returns (uint256);

    /// @notice Check if an issue has been selected for a Wave.
    /// @param issueId The issue ID.
    /// @return True if selected.
    function isIssueSelected(uint256 issueId) external view returns (bool);

    /// @notice Check if a specific address has voted on an issue.
    /// @param issueId The issue ID.
    /// @param voter The voter address.
    /// @return True if already voted.
    function hasVoted(uint256 issueId, address voter) external view returns (bool);
}
