const { network } = require('hardhat');

const optionalSleep = async (time) => {
	return new Promise(async (resolve) => {
		if (network.name != 'docker') {
			await sleep(time);
			resolve();
		} else {
			resolve();
		}
	});
};

async function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

module.exports = { optionalSleep, sleep };