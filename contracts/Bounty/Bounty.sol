// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Third Party
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

abstract contract Bounty is ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    enum BountyStatus {
        OPEN,
        CLOSED
    }

    // OpenQ Proxy Contract
    address public openQ;

    mapping(address => bool) public isAFunder;

    // Bounty Metadata
    string public bountyId;
    uint256 public bountyCreatedTime;
    uint256 public bountyClosedTime;
    address public issuer;
    string public organization;
    address public closer;
    BountyStatus public status;

    // Deposit Data - A Deconstructed Deposit Struct
    mapping(bytes32 => address) public funder;
    mapping(bytes32 => address) public tokenAddress;
    mapping(bytes32 => uint256) public volume;
    mapping(bytes32 => uint256) public depositTime;
    mapping(bytes32 => bool) public refunded;
    mapping(bytes32 => bool) public claimed;
    mapping(bytes32 => address) public payoutAddress;
    mapping(bytes32 => uint256) public tokenId;
    mapping(bytes32 => uint256) public expiration;
    mapping(bytes32 => bool) public isNFT;

    // Deposit Count and IDs
    bytes32[] public deposits;

    function initialize(
        string memory _bountyId,
        address _issuer,
        string memory _organization,
        address _openQ
    ) public initializer {
        require(bytes(_bountyId).length != 0, 'NO_EMPTY_BOUNTY_ID');
        require(bytes(_organization).length != 0, 'NO_EMPTY_ORGANIZATION');
        bountyId = _bountyId;
        issuer = _issuer;
        organization = _organization;
        openQ = _openQ;
        bountyCreatedTime = block.timestamp;
        __ReentrancyGuard_init();
    }

    function _receiveERC20(
        address _tokenAddress,
        address _funder,
        uint256 _volume
    ) internal returns (uint256) {
        uint256 balanceBefore = getERC20Balance(_tokenAddress);
        IERC20 token = IERC20(_tokenAddress);
        token.safeTransferFrom(_funder, address(this), _volume);
        uint256 balanceAfter = getERC20Balance(_tokenAddress);
        require(balanceAfter >= balanceBefore, 'TOKEN_TRANSFER_IN_OVERFLOW');

        // NOTE: The reason we take the balanceBefore and balanceAfter rather than the raw deposited amount
        // is because certain ERC20's like USDT take fees on transfers. Therefore the volume received after transferFrom
        // can be lower than the raw volume sent by the sender
        return balanceAfter.sub(balanceBefore);
    }

    function _transferERC20(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _volume
    ) internal {
        IERC20 token = IERC20(_tokenAddress);
        token.safeTransfer(_payoutAddress, _volume);
    }

    function _transferProtocolToken(address _payoutAddress, uint256 _volume)
        internal
    {
        payable(_payoutAddress).transfer(_volume);
    }

    function _receiveNft(
        address _tokenAddress,
        address _sender,
        uint256 _tokenId
    ) internal {
        IERC721 nft = IERC721(_tokenAddress);
        nft.safeTransferFrom(_sender, address(this), _tokenId);
    }

    function _transferNft(
        address _tokenAddress,
        address _payoutAddress,
        uint256 _tokenId
    ) internal {
        IERC721 nft = IERC721(_tokenAddress);
        nft.safeTransferFrom(address(this), _payoutAddress, _tokenId);
    }

    // Modifiers
    modifier onlyOpenQ() {
        require(msg.sender == openQ, 'Method is only callable by OpenQ');
        _;
    }

    // View Methods
    function getERC20Balance(address _tokenAddress)
        public
        view
        returns (uint256 balance)
    {
        IERC20 tokenAddress = IERC20(_tokenAddress);
        return tokenAddress.balanceOf(address(this));
    }

    function getDeposits() public view returns (bytes32[] memory) {
        return deposits;
    }

    // Revert any attempts to send unknown calldata
    fallback() external {
        revert();
    }

    receive() external payable {
        // React to receiving protocol token
    }
}
