// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IWaveEscrow
/// @notice Phase 1: Escrow vault for Wave reward pools.
/// Holds contributor deposits during a Wave's active period and enables
/// post-finalization claims. Provides an emergency withdrawal mechanism.
interface IWaveEscrow {
    // ════════════════════════════════════════════════════════════
    // Events
    // ════════════════════════════════════════════════════════════

    /// @notice Emitted when a contributor claims their Wave payout.
    /// @param contributor The address claiming the payout.
    /// @param waveId The ID of the Wave being claimed from.
    /// @param amount The total pool amount at claim time.
    event WaveClaimed(address indexed contributor, uint256 indexed waveId, uint256 amount);

    /// @notice Emitted when ETH is deposited into a Wave pool.
    /// @param depositor The address that deposited.
    /// @param waveId The target Wave ID.
    /// @param amount The amount of ETH deposited.
    event EscrowDeposited(address indexed depositor, uint256 indexed waveId, uint256 amount);

    /// @notice Emitted when the owner emergency-withdraws from a Wave.
    /// @param caller The address that triggered the withdrawal.
    /// @param waveId The Wave ID being withdrawn from.
    /// @param amount The amount withdrawn.
    event EmergencyWithdrawn(address indexed caller, uint256 indexed waveId, uint256 amount);

    /// @notice Emitted when a new Wave is created.
    /// @param waveId The ID of the newly created Wave.
    /// @param deadline The unix timestamp deadline for deposits.
    /// @param creator The address that created the Wave.
    event WaveCreated(uint256 indexed waveId, uint256 deadline, address indexed creator);

    // ════════════════════════════════════════════════════════════
    // Data Structures
    // ════════════════════════════════════════════════════════════

    /// @notice Represents a single Wave funding round.
    /// @dev `claimed` is tracked via a separate mapping, NOT in this struct,
    ///      because Solidity cannot return mappings from view functions.
    /// @param id Unique Wave identifier.
    /// @param totalPool Total ETH deposited into this Wave.
    /// @param deadline Unix timestamp after which no deposits are allowed.
    /// @param finalized Whether the Wave has been finalized.
    struct Wave {
        uint256 id;
        uint256 totalPool;
        uint256 deadline;
        bool finalized;
    }

    // ════════════════════════════════════════════════════════════
    // State-Changing Functions
    // ════════════════════════════════════════════════════════════

    /// @notice Create a new Wave with a specified deadline.
    /// @dev Minimum duration: 1 day. Maximum: 365 days. Owner-only.
    /// @param deadline Unix timestamp for when the Wave closes.
    /// @return waveId The ID of the newly created Wave (1-indexed).
    function createWave(uint256 deadline) external returns (uint256 waveId);

    /// @notice Deposit ETH into an active Wave.
    /// @param waveId The target Wave ID.
    function deposit(uint256 waveId) external payable;

    /// @notice Mark a contributor as having claimed their payout from a finalized Wave.
    /// @param waveId The finalized Wave ID.
    /// @param contributor The contributor address.
    function claimPayout(uint256 waveId, address contributor) external;

    /// @notice Finalize a Wave after its deadline has passed. Owner-only.
    /// @param waveId The Wave ID to finalize.
    function finalizeWave(uint256 waveId) external;

    /// @notice Emergency withdrawal of all funds from a Wave. Owner-only.
    /// @param waveId The Wave ID.
    /// @param to The address to send the funds to.
    function emergencyWithdraw(uint256 waveId, address to) external;

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @notice Get the total pool balance of a Wave.
    /// @param waveId The Wave ID.
    /// @return The total ETH deposited.
    function getWavePool(uint256 waveId) external view returns (uint256);

    /// @notice Check if a contributor has claimed from a Wave.
    /// @param waveId The Wave ID.
    /// @param contributor The contributor address.
    /// @return True if already claimed.
    function hasClaimed(uint256 waveId, address contributor) external view returns (bool);

    /// @notice Check if a Wave has been finalized.
    /// @param waveId The Wave ID.
    /// @return True if finalized.
    function isWaveFinalized(uint256 waveId) external view returns (bool);
}
