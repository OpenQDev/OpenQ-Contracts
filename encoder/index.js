const { ethers } = require('hardhat');

let abiCoder = new ethers.utils.AbiCoder;

const atomicEncode = (hasFundingGoal, fundingGoalTokenAddress, fundingGoalVolume, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo) => {
	const initializationSchema = ['bool', 'address', 'uint256' , 'bool' , 'bool', 'bool' , 'string', 'string' , 'string'];
	const initializationData = [hasFundingGoal, fundingGoalTokenAddress, fundingGoalVolume, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo];
	return abiCoder.encode(initializationSchema, initializationData);
};

const ongoingEncode = (payoutTokenAddress, payoutVolume, hasFundingGoal, fundingToken, fundingGoal, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo) => {
	const initializationSchema = ['address', 'uint256', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'];
	const initializationData = [payoutTokenAddress, payoutVolume, hasFundingGoal, fundingToken, fundingGoal, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo];
	return abiCoder.encode(initializationSchema, initializationData);
};

const tieredPercentageEncode = (payoutSchedule, payoutTokenAddress, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo) => {
	const initializationSchema = ['uint256[]', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'];
	const initializationData = [payoutSchedule, payoutTokenAddress, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo];
	return abiCoder.encode(initializationSchema, initializationData);
};

const tieredFixedEncode = (payoutSchedule, hasFundingGoal, fundingToken, fundingGoal, payoutTokenAddress, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo) => {
	const initializationSchema = ['uint256[]', 'address', 'bool', 'bool', 'bool', 'string', 'string', 'string'];
	const initializationData = [payoutSchedule, hasFundingGoal, fundingToken, fundingGoal, payoutTokenAddress, invoiceRequired, kycRequired, supportingDocumentsRequired, issuerExternalUserId, alternativeName, alternativeLogo];
	return abiCoder.encode(initializationSchema, initializationData);
};

const Encoder = { atomicEncode, ongoingEncode, tieredPercentageEncode, tieredFixedEncode };

module.exports = Encoder;

