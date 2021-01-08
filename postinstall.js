const sh = require('shelljs')

// install chainlink node/adapters and prepare env files
if (sh.test('-e', 'chainlink/.node')) {
  sh.echo('Chainlink node directory already exists. (chainlink/.node)')
  sh.echo('Skipping Chainlink node installation.')
} else {
  sh.echo('Installing Chainlink node...')
  if (sh.exec('git clone https://github.com/smartcontractkit/chainlink chainlink/.node').code !== 0) {
    sh.echo('ERROR: Installing Chainlink node failed!')
    sh.exit(1)
  } else {
    sh.cd('chainlink/.node')
    if (sh.exec('git checkout tags/v0.9.4').code !== 0) {
      sh.echo('ERROR: Checking out required chainlink branch (v0.9.4) failed!')
      sh.exit(1)
    } else {
      if (sh.exec('make install').code !== 0) {
        sh.echo('ERROR: Building chainlink node failed!')
        sh.exit(1)
      } else {
        // Adapters
        sh.cd('../..')
        if (sh.test('-e', 'chainlink/.adapters')) {
          sh.echo('Chainlink adapters directory already exists. (chainlink/.adapters)')
          sh.echo('Skipping Chainlink adapters installation.')
        } else {
          sh.echo('')
          sh.echo('Installing Chainlink adapters...')
          if (sh.exec('git clone https://github.com/mktcode/octobay-chainlink-adapters chainlink/.adapters').code !== 0) {
            sh.echo('ERROR: Installing Chainlink node failed!')
            sh.exit(1)
          } else {
            sh.cd('chainlink/.adapters')
            if (sh.exec('yarn').code !== 0) {
              sh.echo('ERROR: Building chainlink node failed!')
              sh.exit(1)
            } else {
              // create env files from samples
              sh.cd('../..')
              sh.cp('./.env.sample', './.env')
              sh.cp('./chainlink/.env.sample', './chainlink/.node/.env')
            }
          }
        }
      }
    }
  }
}
