// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRewardSplitter} from "../interfaces/IRewardSplitter.sol";

contract MockWave {
    IRewardSplitter public rewardSplitter;

    constructor(address _rewardSplitter) {
        rewardSplitter = IRewardSplitter(_rewardSplitter);
    }

    function distributePayout(address contributor) external payable {
        rewardSplitter.splitPayout{value: msg.value}(contributor);
    }

    receive() external payable {}
}
