// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './Setup.sol';

contract OpenQV1FuzzTest is Setup {
    AtomicBountyV1 atomicBounty;
    OngoingBountyV1 ongoingBounty;
    TieredPercentageBountyV1 tieredPercentageBounty;
    TieredFixedBountyV1 tieredFixedBounty;

    constructor() {}

    function assert_mintBounty_atomic(
        bool _hasFundingGoal,
        address _fundingToken,
        uint256 _fundingGoal,
        bool _invoiceRequired,
        bool _kycRequired,
        bool _supportingDocumentsRequired,
        string memory _issuerExternalUserId,
        string memory _alternativeName,
        string memory _alternativeLogo
    ) public {
        bytes memory initData = abi.encode(
            _hasFundingGoal,
            _fundingToken,
            _fundingGoal,
            _invoiceRequired,
            _kycRequired,
            _supportingDocumentsRequired,
            _issuerExternalUserId,
            _alternativeName,
            _alternativeLogo
        );

        (bool success, bytes memory result) = minter.proxy(
            address(openQ),
            abi.encodeWithSelector(
                openQ.mintBounty.selector,
                'bountyId',
                '_organization',
                OpenQDefinitions.InitOperation(0, initData)
            )
        );

        require(success);

        address bountyAddress = abi.decode(result, (address));

        atomicBounty = AtomicBountyV1(payable(bountyAddress));

        assert(bountyAddress != address(0x0));
    }

    function assert_bounty_issuer_never_changes() public {
        require(address(atomicBounty) != address(0x0));
        assert(atomicBounty.issuer() == address(minter));
    }

    function assert_cannot_transfer_oracle() public {
        if (!completed) {
            _init();
        }
        emit DebugAddress(openQ.oracle());
        assert(false);
        require(openQ.oracle() != address(0));
        assert(openQ.oracle() == address(oracle));
    }

    // function assert_test() public {
    //     // Pre-condition
    //     // Optimization: modular arithmetic
    //     // State before action
    //     // Action
    //     // Post-condition

    //     // Use try/catch if you believe that no non-happy path exists, i.e. reverts are impossible
    //     try {
    //         // Action
    //         // Post-condition
    //     } catch (bytes memory err) {
    //         assert(false);
    //     }
    // }

    // assert that something never succeeds with assert(!success) on low-level call
}
