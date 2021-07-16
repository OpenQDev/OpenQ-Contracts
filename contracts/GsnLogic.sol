// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract GsnLogic {
    // ------------ GSN ------------ //

    address octobayPaymaster;

    function setPaymaster(address _octobayPaymaster) external onlyOwner {
        octobayPaymaster = _octobayPaymaster;
    }

    function _msgSender()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (address payable)
    {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (bytes memory ret)
    {
        return BaseRelayRecipient._msgData();
    }

    string public override versionRecipient = '2.0.0'; // GSN version

    function deductGasFee(string calldata _githubUserId, uint256 _amount)
        external
    {
        // only paymaster, cause paymaster pays for gas fee on behalf of user
        require(msg.sender == octobayPaymaster);
        depositStorage.deductGasFee(_githubUserId, _amount);
    }
}
