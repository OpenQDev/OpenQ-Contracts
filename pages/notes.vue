<template>
  <div class="container d-flex flex-column justify-content-center py-5">
    <h1 class="text-white text-center">Notes</h1>
    <ul class="text-white">
      <li>
        Web App
        <ul>
          <li>Vue/Nuxt</li>
          <li>UI/UX</li>
          <li>Logo design</li>
          <li>web3 integration/event listening</li>
          <li>endpoint for external Chainlink adapter</li>
          <li>deployment/hosting</li>
          <li>GitHub bot (commenting deposits)</li>
        </ul>
      </li>
      <li>
        Smart Contract
        <ul>
          <li>register GitHub users (by checking repo named after address)</li>
          <li>deposit on open issues (no registration needed)</li>
          <li>deposit on pull requests (no registration needed)</li>
          <li>withdraw (as deposit owner)</li>
          <li>withdraw (pull request author)</li>
          <li>move deposit to other issue or pull request (deposit owner)</li>
          <li>move all issue deposit to a pull request (issue owner, individual deposit ownership stays intact)</li>
          <li>list issue deposits</li>
          <li>list pull request deposits</li>
          <li>keep track of users deposit/withdraw ratio (reliance indicator)</li>
          <li>
            Chainlink
            <ul>
              <li>check existance of repositories</li>
              <li>check author and status of pull requests</li>
              <li>check issue status</li>
              <li>auto refill with uniswap</li>
            </ul>
          </li>
        </ul>
      </li>
      <li>
        Chainlink
        <ul>
          <li>exernal adapter</li>
          <li>integration with node operator</li>
          <li>automatic actions on pull request merge?</li>
        </ul>
      </li>
      <li>Error handling</li>
      <li>Testing</li>
      <li>Auditing</li>
      <li>
        Extras
        <ul>
          <li>Token (Usecase: Project promotion)</li>
          <li>Investigate DEV Protocol, integrations/cooperations possible?</li>
          <li>Automated withdrawal on pull request merge (chainlink?)</li>
          <li>Support any ERC20 token</li>
        </ul>
      </li>
    </ul>
    <h1 class="text-white text-center mt-5">Mocks</h1>
    <div class="w-50 mx-auto">
      <div class="card rounded-lg shadow-sm border-0 mt-1 mb-5">
        <div class="card-body">
          <label class="w-100 text-center">You need to be connected to your MetaMask wallet.</label>
          <div class="d-flex mt-4">
            <a href="#" class="btn btn-lg btn-warning flex-fill ml-1">MetaMask</a>
          </div>
        </div>
      </div>
      <div class="card rounded-lg shadow-sm border-0">
        <div class="card-body">
          <label class="w-100 text-center">What do you want to do?</label>
          <div class="d-flex mt-4">
            <a href="#" class="btn btn-lg btn-success flex-fill mr-1">Deposit</a>
            <a href="#" class="btn btn-lg btn-success flex-fill ml-1">Withdraw</a>
          </div>
        </div>
      </div>
    </div>
    <div class="row mt-5">
      <div class="col">
        <div class="card rounded-lg shadow-sm border-0">
          <div class="card-body">
            <label class="w-100 text-center">Paste the URL of a pull request or issue and enter the amount of ETH you want to deposit:</label>
            <input type="text" class="form-control form-control-lg" placeholder="https://..." />
            <input type="number" class="form-control form-control-lg mt-3" value="0.5" />
            <div class="text-center mt-4">
              <a href="#" class="btn btn-lg btn-success">Confirm</a>
            </div>
          </div>
        </div>
        <div class="card rounded-lg shadow-sm border-0 mt-5">
          <div class="card-body">
            <label class="w-100 text-center">Thank you for your deposit! We'll write a comment on the GitHub issue/pull request.</label>
            <div class="text-center my-4">
              <span class="rounded-circle bg-success text-white p-3">
                <font-awesome-icon :icon="['fas', 'check']" />
              </span>
            </div>
            <label class="w-100 text-center">See all your deposits <a href="#">here</a>. You can withdraw them at anytime, as long as they are not payed out to a contributor.</label>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card rounded-lg shadow-sm border-0">
          <div class="card-body">
            <label class="w-100 text-center">What do you want to withdraw:</label>
            <div class="d-flex mt-4">
              <a href="#" class="btn btn-lg btn-success flex-fill mr-1">Own Deposit</a>
              <a href="#" class="btn btn-lg btn-success flex-fill ml-1">Rewards</a>
            </div>
          </div>
        </div>
        <div class="card rounded-lg shadow-sm border-0 mt-5">
          <div class="card-body">
            To confirm your identity you need to have a repository on GitHub that is named after your Ethereum address.
            Something like:
            <div class="my-2">
              <code class="text-truncate">https://github.com/mktcode/0x27711f9c0723...</code>
            </div>
            <b>Make sure you created this repository and that you are connected to the right GitHub and Ethereum account.</b>
            Then click the button below.
            <a href="#" class="btn btn-lg btn-success d-block mt-3">Register</a>
            <div class="alert alert-info mt-3 border-0">
              You can create multiple repositories on GitHub for different Ethereum addresses.
              If you make a deposit from one address and you loose access to it, simply create a repository with a new address as its name and you can receive funds there.
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card rounded-lg shadow-sm border-0 mt-5">
      <div class="card-body">
        <label>Your Deposits</label>
        <div>
          <a href="#" class="btn btn-secondary disabled">Issues</a>
          <a href="#" class="btn btn-secondary">Pull Requests</a>
        </div>
        <table class="table">
          <tr>
            <th class="border-0">Repo</th>
            <th class="border-0">Issue</th>
            <th class="border-0">Deposit</th>
            <th class="border-0"></th>
          </tr>
          <tr>
            <td>mktcode/testrepo</td>
            <td><a href="#">4</a></td>
            <td class="text-right">0.5 ETH</td>
            <td class="text-right">
              <a href="#" class="btn btn-success">withdraw</a>
              <a href="#" class="btn btn-success">move</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div class="card rounded-lg shadow-sm border-0 mt-5">
      <div class="card-body">
        <label>Awarded to you:</label>
        <table class="table">
          <tr>
            <th class="border-0">Repo</th>
            <th class="border-0">PR</th>
            <th class="border-0">Deposit</th>
            <th class="border-0"></th>
          </tr>
          <tr>
            <td>mktcode/testrepo</td>
            <td><a href="#">4</a></td>
            <td class="text-right">0.5 ETH</td>
            <td class="text-right">
              <a href="#" class="btn btn-success">withdraw</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <h1 class="text-white mt-5">Issues</h1>
    <div class="card rounded-lg shadow-sm border-0">
      <div class="card-body d-flex justify-content-between">
        <h4 class="my-auto d-flex flex-column">
          <a href="#">Header style broken</a>
          <small class="text-muted"><small>https://github.com/mktcode/myproject/issues/3</small></small>
        </h4>
        <h3 class="m-0">0.1 ETH</h3>
      </div>
    </div>
    <div class="card rounded-lg shadow-sm border-0 mt-3">
      <div class="card-body d-flex justify-content-between">
        <h4 class="my-auto d-flex flex-column">
          <a href="#">Header style broken</a>
          <small class="text-muted"><small>https://github.com/mktcode/myproject/issues/3</small></small>
        </h4>
        <h3 class="m-0">0.1 ETH</h3>
      </div>
    </div>
    <div class="card rounded-lg shadow-sm border-0 mt-3">
      <div class="card-body d-flex justify-content-between">
        <h4 class="my-auto d-flex flex-column">
          <a href="#">Header style broken</a>
          <small class="text-muted"><small>https://github.com/mktcode/myproject/issues/3</small></small>
        </h4>
        <h3 class="m-0">0.1 ETH</h3>
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {}
</script>

<style lang="sass"></style>
