// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Errors
/// @notice Centralized custom error definitions for all Cross-Chain Drips contracts.
///         Using custom errors instead of require strings saves gas and enables
///         better error handling in off-chain code.
library Errors {
    // ════════════════════════════════════════════════════════════
    // General (shared across multiple contracts)
    // ════════════════════════════════════════════════════════════

    /// @notice Thrown when an address parameter is zero.
    error ZeroAddress(string param);

    /// @notice Thrown when a uint256 parameter has value zero but must be positive.
    error ZeroValue(string param);

    /// @notice Thrown when the caller lacks permission for the operation.
    error Unauthorized(address caller);

    /// @notice Thrown when an input value fails validation.
    error InvalidInput(string reason);

    // ════════════════════════════════════════════════════════════
    // WaveEscrow
    // ════════════════════════════════════════════════════════════

    /// @notice Thrown when trying to modify an already-finalized Wave.
    error WaveAlreadyFinalized(uint256 waveId);

    /// @notice Thrown when trying to claim from a non-finalized Wave.
    error WaveNotFinalized(uint256 waveId);

    /// @notice Thrown when depositing into a Wave past its deadline.
    error WaveDeadlinePassed(uint256 waveId);

    /// @notice Thrown when trying to finalize a Wave before its deadline.
    error WaveDeadlineNotReached(uint256 waveId);

    /// @notice Thrown when a contributor tries to claim more than once.
    error AlreadyClaimed(uint256 waveId, address contributor);

    /// @notice Thrown when there are insufficient funds in the pool.
    error InsufficientPoolBalance(uint256 waveId, uint256 requested, uint256 available);

    /// @notice Thrown when an ETH transfer fails at the protocol level.
    error TransferFailed(address to, uint256 amount);

    // ════════════════════════════════════════════════════════════
    // WaveReputation
    // ════════════════════════════════════════════════════════════

    /// @notice Thrown when trying to re-verify an already-verified contributor.
    error ContributorAlreadyVerified(address contributor);

    /// @notice Thrown when an action requires a verified contributor but none exists.
    error ContributorNotVerified(address contributor);

    /// @notice Thrown when a contributor lacks the minimum reputation required.
    error InsufficientReputation(address contributor, uint256 required, uint256 actual);

    // ════════════════════════════════════════════════════════════
    // WaveScoping
    // ════════════════════════════════════════════════════════════

    /// @notice Thrown when trying to modify a finalized issue.
    error IssueAlreadyFinalized(uint256 issueId);

    /// @notice Thrown when trying to re-select an already-selected issue.
    error IssueAlreadySelected(uint256 issueId);

    /// @notice Thrown when trying to use an issue that was not selected.
    error IssueNotSelected(uint256 issueId);

    /// @notice Thrown when an issue has insufficient vote weight to be selected.
    error InsufficientVoteWeight(uint256 issueId, uint256 weight, uint256 required);

    // ════════════════════════════════════════════════════════════
    // RewardSplitter
    // ════════════════════════════════════════════════════════════

    /// @notice Thrown when a payout is attempted while the splitter is paused.
    error SplitterPaused();

    /// @notice Thrown when a split configuration has invalid share values.
    error InvalidSplitConfiguration(uint256 value, uint256 maxAllowed);

    /// @notice Thrown when attempting a payout for a contributor with no config.
    error NoSplitConfigFound(address contributor);
}
