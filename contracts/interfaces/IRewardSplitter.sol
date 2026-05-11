// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRewardSplitter
/// @notice Phase 4: Configurable payout splitting engine.
/// Allows contributors to split Wave rewards across three destinations:
/// self (wallet), savings vault, and project treasury.
interface IRewardSplitter {
    // ════════════════════════════════════════════════════════════
    // Events
    // ════════════════════════════════════════════════════════════

    /// @notice Emitted when a contributor creates or updates their split config.
    /// @param contributor The contributor address.
    /// @param savingsVault The savings vault address.
    /// @param treasury The treasury address.
    /// @param treasuryShare Share to treasury, in basis points (e.g. 1000 = 10%).
    /// @param savingsShare Share to savings vault, in basis points.
    /// @param contributorShare Calculated remainder share to contributor.
    event SplitConfigUpdated(
        address indexed contributor,
        address savingsVault,
        address treasury,
        uint256 treasuryShare,
        uint256 savingsShare,
        uint256 contributorShare
    );

    /// @notice Emitted every time a payout is split and distributed.
    /// @param contributor The contributor whose config was used.
    /// @param totalAmount The total msg.value of the payout.
    /// @param toContributor Amount sent directly to the contributor.
    /// @param toSavings Amount sent to the savings vault.
    /// @param toTreasury Amount sent to the treasury.
    event PayoutSplit(
        address indexed contributor,
        uint256 totalAmount,
        uint256 toContributor,
        uint256 toSavings,
        uint256 toTreasury
    );

    /// @notice Emitted when the splitter is paused (emergency stop).
    event SplitterPaused(address indexed by);

    /// @notice Emitted when the splitter is unpaused.
    event SplitterUnpaused(address indexed by);

    // ════════════════════════════════════════════════════════════
    // Data Structures
    // ════════════════════════════════════════════════════════════

    /// @notice Complete split configuration for a contributor.
    /// @param savingsVault Address receiving the savings portion.
    /// @param treasury Address receiving the treasury portion.
    /// @param treasuryShare Percentage to treasury in basis points (e.g. 1000 = 10%).
    /// @param savingsShare Percentage to savings in basis points (e.g. 2000 = 20%).
    /// @param active Whether this config is active/initialized.
    /// @dev contributorShare = MAX_BASIS_POINTS - treasuryShare - savingsShare (implicit).
    struct SplitConfig {
        address savingsVault;
        address treasury;
        uint256 treasuryShare;
        uint256 savingsShare;
        bool active;
    }

    // ════════════════════════════════════════════════════════════
    // State-Changing Functions
    // ════════════════════════════════════════════════════════════

    /// @notice Configure or update a contributor's payout split.
    /// @dev Both shares are in basis points (1/100 of 1%).
    ///      treasuryShare + savingsShare must be <= MAX_BASIS_POINTS (10000).
    ///      The remainder implicitly goes to the contributor.
    /// @param savingsVault Address to receive the savings allocation.
    /// @param treasury Address to receive the treasury allocation.
    /// @param treasuryShare Treasury share in basis points.
    /// @param savingsShare Savings share in basis points.
    function configureSplit(
        address savingsVault,
        address treasury,
        uint256 treasuryShare,
        uint256 savingsShare
    ) external;

    /// @notice Split an incoming ETH payout according to contributor's config.
    /// @dev Called by a Wave contract or any payout distributor.
    ///      Emits PayoutSplit with exact amounts sent to each destination.
    /// @param contributor The contributor whose config to use.
    function splitPayout(address contributor) external payable;

    /// @notice Pause all split operations. Owner-only emergency stop.
    function pauseSplitter() external;

    /// @notice Unpause split operations. Owner-only.
    function unpauseSplitter() external;

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @notice Get the split configuration for a contributor.
    /// @param contributor The contributor address.
    /// @return The full SplitConfig struct.
    function getSplitConfig(address contributor) external view returns (SplitConfig memory);

    /// @notice Check if the splitter is currently paused.
    /// @return True if paused, false otherwise.
    function isPaused() external view returns (bool);
}
