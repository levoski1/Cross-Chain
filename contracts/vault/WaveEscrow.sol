// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IWaveEscrow} from "../interfaces/IWaveEscrow.sol";
import {Errors} from "../libraries/Errors.sol";

/// @title WaveEscrow
/// @notice Phase 1 vault that holds ETH during a Wave's active period.
/// Supports deposit, finalization, claims, and emergency withdrawal.
/// @dev Uses OpenZeppelin Ownable2Step for secure ownership management.
contract WaveEscrow is Ownable2Step, IWaveEscrow {
    /// @notice Counter for total Waves created (1-indexed).
    uint256 public waveCount;

    /// @dev Internal storage for Wave data.
    mapping(uint256 => Wave) private _waves;

    /// @dev Separate claimed tracking — not embedded in the Wave struct
    ///      because Solidity mappings cannot be returned from view functions.
    mapping(uint256 => mapping(address => bool)) private _claimed;

    uint256 private constant MIN_WAVE_DURATION = 1 days;
    uint256 private constant MAX_WAVE_DURATION = 365 days;

    /// @dev Reverts if the caller is not the contract owner.
    modifier onlyContractOwner() {
        if (msg.sender != owner()) revert Errors.Unauthorized(msg.sender);
        _;
    }

    /// @dev Reverts if the wave does not exist.
    modifier waveExists(uint256 waveId) {
        if (waveId == 0 || waveId > waveCount) revert Errors.InvalidInput("wave does not exist");
        _;
    }

    /// @notice Initializes the contract with the deployer as the initial owner.
    constructor() Ownable2Step() {
        // Ownable2Step constructor sets owner to msg.sender
    }

    // ════════════════════════════════════════════════════════════
    // Owner-Only: Wave Lifecycle
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveEscrow
    function createWave(uint256 deadline) external onlyContractOwner returns (uint256) {
        uint256 duration = deadline - block.timestamp;
        if (duration < MIN_WAVE_DURATION) revert Errors.InvalidInput("duration too short");
        if (duration > MAX_WAVE_DURATION) revert Errors.InvalidInput("duration too long");

        waveCount++;
        uint256 waveId = waveCount;

        _waves[waveId] = Wave({
            id: waveId,
            totalPool: 0,
            deadline: deadline,
            finalized: false
        });

        emit WaveCreated(waveId, deadline, msg.sender);
        return waveId;
    }

    /// @inheritdoc IWaveEscrow
    function finalizeWave(uint256 waveId) external onlyContractOwner waveExists(waveId) {
        Wave storage wave = _waves[waveId];
        if (wave.finalized) revert Errors.WaveAlreadyFinalized(waveId);
        if (block.timestamp < wave.deadline) revert Errors.WaveDeadlineNotReached(waveId);

        wave.finalized = true;
    }

    /// @inheritdoc IWaveEscrow
    function emergencyWithdraw(uint256 waveId, address to) external onlyContractOwner waveExists(waveId) {
        if (to == address(0)) revert Errors.ZeroAddress("to");

        Wave storage wave = _waves[waveId];
        uint256 balance = wave.totalPool;
        if (balance == 0) revert Errors.ZeroValue("pool balance");

        wave.totalPool = 0;

        (bool sent,) = payable(to).call{value: balance}("");
        if (!sent) revert Errors.TransferFailed(to, balance);

        emit EmergencyWithdrawn(msg.sender, waveId, balance);
    }

    // ════════════════════════════════════════════════════════════
    // Public: Deposits and Claims
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveEscrow
    function deposit(uint256 waveId) external payable waveExists(waveId) {
        if (msg.value == 0) revert Errors.ZeroValue("msg.value");

        Wave storage wave = _waves[waveId];
        if (block.timestamp >= wave.deadline) revert Errors.WaveDeadlinePassed(waveId);
        if (wave.finalized) revert Errors.WaveAlreadyFinalized(waveId);

        wave.totalPool += msg.value;

        emit EscrowDeposited(msg.sender, waveId, msg.value);
    }

    /// @inheritdoc IWaveEscrow
    function claimPayout(uint256 waveId, address contributor) external waveExists(waveId) {
        Wave storage wave = _waves[waveId];
        if (!wave.finalized) revert Errors.WaveNotFinalized(waveId);
        if (_claimed[waveId][contributor]) revert Errors.AlreadyClaimed(waveId, contributor);

        _claimed[waveId][contributor] = true;

        emit WaveClaimed(contributor, waveId, wave.totalPool);
    }

    // ════════════════════════════════════════════════════════════
    // View Functions
    // ════════════════════════════════════════════════════════════

    /// @inheritdoc IWaveEscrow
    function getWavePool(uint256 waveId) external view returns (uint256) {
        return _waves[waveId].totalPool;
    }

    /// @inheritdoc IWaveEscrow
    function hasClaimed(uint256 waveId, address contributor) external view returns (bool) {
        return _claimed[waveId][contributor];
    }

    /// @inheritdoc IWaveEscrow
    function isWaveFinalized(uint256 waveId) external view returns (bool) {
        return _waves[waveId].finalized;
    }

    /// @notice Receive ETH directly with no specific Wave assignment.
    receive() external payable {
        emit EscrowDeposited(msg.sender, 0, msg.value);
    }
}
