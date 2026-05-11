// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IWaveScoping} from "../interfaces/IWaveScoping.sol";
import {Errors} from "../libraries/Errors.sol";

/// @title WaveScoping
/// @notice Phase 3: Community governance for issue selection.
/// Allows permissionless issue proposals with weighted voting.
/// The owner selects approved issues for association with Waves.
/// @dev Uses OpenZeppelin Ownable2Step for secure ownership management.
contract WaveScoping is Ownable2Step, IWaveScoping {
    /// @notice Counter for total issues proposed (1-indexed).
    uint256 public issueCount;

    uint256 public constant MIN_DESCRIPTION_LENGTH = 10;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 1024;

    /// @dev Internal storage for issues.
    mapping(uint256 => Issue) private _issues;

    /// @dev Tracks whether an address has voted on a specific issue.
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    /// @dev Reverts if the caller is not the contract owner.
    modifier onlyContractOwner() {
        if (msg.sender != owner()) revert Errors.Unauthorized(msg.sender);
        _;
    }

    /// @dev Reverts if the issue ID is invalid.
    modifier issueExists(uint256 issueId) {
        if (issueId == 0 || issueId > issueCount) revert Errors.InvalidInput("issue does not exist");
        _;
    }

    /// @dev Reverts if the issue has already been finalized.
    modifier issueNotFinalized(uint256 issueId) {
        if (_issues[issueId].finalized) revert Errors.IssueAlreadyFinalized(issueId);
        _;
    }

    /// @notice Initializes the contract with the deployer as the initial owner.
    constructor() Ownable2Step() {}

    // ════════════════════════════════════════════════════════════
    // Public: Issue Lifecycle
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveScoping
    function proposeIssue(
        string calldata description,
        uint256 rewardPool
    ) external returns (uint256) {
        if (bytes(description).length < MIN_DESCRIPTION_LENGTH) {
            revert Errors.InvalidInput("description too short");
        }
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) {
            revert Errors.InvalidInput("description too long");
        }

        issueCount++;
        uint256 issueId = issueCount;

        _issues[issueId] = Issue({
            id: issueId,
            proposer: msg.sender,
            description: description,
            rewardPool: rewardPool,
            approvalWeight: 0,
            rejectionWeight: 0,
            selected: false,
            finalized: false
        });

        emit IssueProposed(issueId, msg.sender, description, rewardPool);

        return issueId;
    }

    /// @inheritdoc IWaveScoping
    function voteOnIssue(
        uint256 issueId,
        bool inFavor,
        uint256 weight
    ) external issueExists(issueId) issueNotFinalized(issueId) {
        if (weight == 0) revert Errors.ZeroValue("weight");
        if (_hasVoted[issueId][msg.sender]) revert Errors.InvalidInput("already voted");

        _hasVoted[issueId][msg.sender] = true;

        Issue storage issue = _issues[issueId];

        if (inFavor) {
            issue.approvalWeight += weight;
        } else {
            issue.rejectionWeight += weight;
        }

        emit VoteCast(issueId, msg.sender, weight, inFavor);
    }

    // ════════════════════════════════════════════════════════════
    // Owner-Only: Issue Finalization
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveScoping
    function selectIssueForWave(
        uint256 issueId,
        uint256 waveId
    ) external onlyContractOwner issueExists(issueId) issueNotFinalized(issueId) {
        Issue storage issue = _issues[issueId];

        uint256 totalVotes = issue.approvalWeight + issue.rejectionWeight;
        if (totalVotes == 0) revert Errors.InsufficientVoteWeight(issueId, 0, 1);

        issue.selected = true;
        issue.finalized = true;

        emit IssueSelected(issueId, waveId, issue.approvalWeight, totalVotes);
    }

    /// @notice Finalize an issue without selecting it (rejected/expired).
    /// @param issueId The issue ID to finalize.
    function finalizeIssue(uint256 issueId) external onlyContractOwner issueExists(issueId) {
        Issue storage issue = _issues[issueId];
        if (issue.selected) revert Errors.IssueAlreadySelected(issueId);
        issue.finalized = true;

        emit IssueFinalized(issueId, false);
    }

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveScoping
    function getIssue(uint256 issueId) external view returns (Issue memory) {
        return _issues[issueId];
    }

    /// @inheritdoc IWaveScoping
    function getTotalVotes(uint256 issueId) external view returns (uint256) {
        Issue memory issue = _issues[issueId];
        return issue.approvalWeight + issue.rejectionWeight;
    }

    /// @inheritdoc IWaveScoping
    function isIssueSelected(uint256 issueId) external view returns (bool) {
        return _issues[issueId].selected;
    }

    /// @inheritdoc IWaveScoping
    function hasVoted(uint256 issueId, address voter) external view returns (bool) {
        return _hasVoted[issueId][voter];
    }
}
