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
	thirtyDays: 2765000,
	alternativeName: 'alternativeName',
	alternativeLogo: 'alternativeLogo'
};

let abiCoder = new ethers.utils.AbiCoder;

const atomicBountyInitOperation_fundingGoal = (tokenAddress) => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[true, tokenAddress, 100, false, false, false, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

const atomicBountyInitOperation_permissioned = (tokenAddress) => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[true, tokenAddress, 100, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

const atomicBountyInitOperation_noFundingGoal = () => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[false, ethers.constants.AddressZero, 0, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

module.exports = { Constants, atomicBountyInitOperation_fundingGoal, atomicBountyInitOperation_noFundingGoal, atomicBountyInitOperation_permissioned };