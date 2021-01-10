const readline = require('readline')
const sh = require('shelljs')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('GitHub Client ID? ', clientId => {
  rl.question('GitHub Client Secret? ', secret => {
    rl.question('GitHub Personal Access Token? ', personalAccessToken => {
      sh.sed('-i', /^GITHUB_CLIENT_ID=.*$/, 'GITHUB_CLIENT_ID=' + clientId, '.env')
      sh.sed('-i', /^GITHUB_CLIENT_SECRET=.*$/, 'GITHUB_CLIENT_SECRET=' + secret, '.env')
      sh.sed('-i', /^GITHUB_PERSONAL_ACCESS_TOKEN=.*$/, 'GITHUB_PERSONAL_ACCESS_TOKEN=' + personalAccessToken, '.env')
      sh.sed('-i', /^GITHUB_PERSONAL_ACCESS_TOKEN=.*$/, 'GITHUB_PERSONAL_ACCESS_TOKEN=' + personalAccessToken, 'chainlink/.adapters/.env')
      rl.close()
    })
  })
})
