const { ethers } = require('hardhat');

const Constants = {
	VERSION_1: 1,
	ATOMIC_CONTRACT: 0,
	ONGOING_CONTRACT: 1,
	TIERED_PERCENTAGE_CONTRACT: 2,
	TIERED_FIXED_CONTRACT: 3,
	mockLinkAddress: ethers.constants.AddressZero,
	mockOpenQId: 'mockOpenQId',
	mockId: 'mockId',
	bountyId: 'bountyId',
	organization: 'mockOrganization',
	funderUuid: 'mock-funder-uuid',
	mockClaimantAsset: 'https://github.com/OpenQDev/OpenQ-Frontend/pull/398',
	thirtyDays: 2765000
};

module.exports = Constants;