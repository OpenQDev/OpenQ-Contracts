import '@openzeppelin/contracts/proxy/Clones.sol';
import '../Bounty/Implementations/BountyV0.sol';

contract BountyFactory {
    address public immutable bountyImplementation;

    constructor() public {
        bountyImplementation = address(new BountyV0());
    }

    function mintBounty(
        string memory _id,
        address _issuer,
        string memory _organization
    ) external returns (address) {
        address clone = Clones.cloneDeterministic(
            bountyImplementation,
            bytes32(abi.encode(_id))
        );
        BountyV0(clone).initialize(_id, _issuer, _organization);
        return clone;
    }

    function predictDeterministicAddress(bytes32 salt)
        public
        returns (address predicted)
    {
        return
            Clones.predictDeterministicAddress(
                bountyImplementation,
                salt,
                address(this)
            );
    }
}
