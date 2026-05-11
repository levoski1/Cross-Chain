// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IRewardSplitter} from "../interfaces/IRewardSplitter.sol";
import {Errors} from "../libraries/Errors.sol";

/// @title RewardSplitter
/// @notice Phase 4: Configurable payout splitting engine.
/// Contributors register a split configuration that determines how
/// incoming ETH payouts are distributed across three destinations:
///   - Treasury (project fund)
///   - Savings Vault (long-term savings)
///   - Contributor (direct payout)
///
/// @dev Uses OpenZeppelin Ownable2Step for secure ownership management.
/// The split algorithm is:
///   treasuryPortion   = total * treasuryShare / 10000
///   savingsPortion    = total * savingsShare / 10000
///   contributorPortion = total - treasuryPortion - savingsPortion
///
/// treasuryShare + savingsShare must be <= 10000 (MAX_BASIS_POINTS).
contract RewardSplitter is Ownable2Step, IRewardSplitter {
    // ════════════════════════════════════════════════════════════
    // Constants
    // ════════════════════════════════════════════════════════════

    /// @notice Maximum basis points value representing 100%.
    uint256 public constant MAX_BASIS_POINTS = 10000;

    /// @notice Maximum allowed treasury share (2500 = 25%).
    uint256 public constant MAX_TREASURY_SHARE = 2500;

    /// @notice Maximum allowed savings share (9000 = 90%).
    uint256 public constant MAX_SAVINGS_SHARE = 9000;

    // ════════════════════════════════════════════════════════════
    // State
    // ════════════════════════════════════════════════════════════

    /// @dev Whether the splitter is paused (emergency stop).
    bool private _paused;

    /// @dev Mapping from contributor address to their split configuration.
    mapping(address => SplitConfig) private _configs;

    // ════════════════════════════════════════════════════════════
    // Modifiers
    // ════════════════════════════════════════════════════════════

    /// @dev Reverts if the caller is not the contract owner.
    modifier onlyContractOwner() {
        if (msg.sender != owner()) revert Errors.Unauthorized(msg.sender);
        _;
    }

    /// @dev Reverts if the splitter is paused.
    modifier whenNotPaused() {
        if (_paused) revert Errors.SplitterPaused();
        _;
    }

    /// @dev Reverts if the contributor has no active config.
    modifier configExists(address contributor) {
        if (!_configs[contributor].active) revert Errors.NoSplitConfigFound(contributor);
        _;
    }

    // ════════════════════════════════════════════════════════════
    // Constructor
    // ════════════════════════════════════════════════════════════

    /// @notice Initializes the splitter with the deployer as owner and unpaused.
    constructor() Ownable2Step() {
        _paused = false;
    }

    // ════════════════════════════════════════════════════════════
    // Configuration
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IRewardSplitter
    /// @dev Example: 70/20/10 split => treasuryShare=1000, savingsShare=2000.
    ///      contributorShare = 10000 - 1000 - 2000 = 7000 (70%).
    function configureSplit(
        address savingsVault,
        address treasury,
        uint256 treasuryShare,
        uint256 savingsShare
    ) external override {
        if (savingsVault == address(0)) revert Errors.ZeroAddress("savingsVault");
        if (treasury == address(0)) revert Errors.ZeroAddress("treasury");
        if (treasuryShare > MAX_TREASURY_SHARE) {
            revert Errors.InvalidSplitConfiguration(treasuryShare, MAX_TREASURY_SHARE);
        }
        if (savingsShare > MAX_SAVINGS_SHARE) {
            revert Errors.InvalidSplitConfiguration(savingsShare, MAX_SAVINGS_SHARE);
        }

        uint256 totalAllocated = treasuryShare + savingsShare;
        if (totalAllocated > MAX_BASIS_POINTS) {
            revert Errors.InvalidSplitConfiguration(totalAllocated, MAX_BASIS_POINTS);
        }

        uint256 contributorShare = MAX_BASIS_POINTS - totalAllocated;

        SplitConfig storage config = _configs[msg.sender];
        config.savingsVault = savingsVault;
        config.treasury = treasury;
        config.treasuryShare = treasuryShare;
        config.savingsShare = savingsShare;
        config.active = true;

        emit SplitConfigUpdated(
            msg.sender,
            savingsVault,
            treasury,
            treasuryShare,
            savingsShare,
            contributorShare
        );
    }

    // ════════════════════════════════════════════════════════════
    // Payout Execution
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IRewardSplitter
    /// @dev CEI pattern: all state reads happen before any external calls.
    ///      Three `call` operations send ETH to each destination.
    function splitPayout(
        address contributor
    ) external payable override whenNotPaused configExists(contributor) {
        if (msg.value == 0) revert Errors.ZeroValue("msg.value");

        SplitConfig memory config = _configs[contributor];

        uint256 forTreasury = (msg.value * config.treasuryShare) / MAX_BASIS_POINTS;
        uint256 forSavings = (msg.value * config.savingsShare) / MAX_BASIS_POINTS;
        uint256 forContributor = msg.value - forTreasury - forSavings;

        _sendEther(config.treasury, forTreasury);
        _sendEther(config.savingsVault, forSavings);
        _sendEther(contributor, forContributor);

        emit PayoutSplit(contributor, msg.value, forContributor, forSavings, forTreasury);
    }

    // ════════════════════════════════════════════════════════════
    // Emergency Controls
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IRewardSplitter
    function pauseSplitter() external override onlyContractOwner {
        _paused = true;
        emit SplitterPaused(msg.sender);
    }

    /// @inheritdoc IRewardSplitter
    function unpauseSplitter() external override onlyContractOwner {
        _paused = false;
        emit SplitterUnpaused(msg.sender);
    }

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IRewardSplitter
    function getSplitConfig(address contributor) external view returns (SplitConfig memory) {
        return _configs[contributor];
    }

    /// @inheritdoc IRewardSplitter
    function isPaused() external view returns (bool) {
        return _paused;
    }

    // ════════════════════════════════════════════════════════════
    // Internal
    // ════════════════════════════════════════════════════════════

    /// @dev Sends ETH using low-level `call`. Safe: amount is validated upstream.
    ///      Skips transfer if amount is zero (optimization).
    function _sendEther(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool sent,) = payable(to).call{value: amount}("");
        if (!sent) revert Errors.TransferFailed(to, amount);
    }
}
