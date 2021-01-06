// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Octopin is ERC20, Ownable {
    mapping(string => uint256) public issuePins;

    address octobay;
    uint256 private registrationFee;
    uint256 private claimFee;

    constructor(address _octobay) public ERC20('OctoPin', 'OPIN') {
        octobay = _octobay;
    }

    function pinIssue(string memory _issueId, uint256 _amount) public {
        require(_amount > 0, 'Amount must be greater zero.');
        _burn(msg.sender, _amount);
        issuePins[_issueId] += _amount;
    }

    modifier onlyOctobay {
        require(msg.sender == octobay);
        _;
    }

    function updateOctobay(address _octobay) external onlyOwner {
        octobay = _octobay;
    }

    function mintOnPullRequestClaim(address _receiver, uint256 _amount)
        external
        onlyOctobay
    {
        _mint(_receiver, _amount);
    }

    // TODO
    // function mintOnIssueClaim() onlyOctobay {}
}
