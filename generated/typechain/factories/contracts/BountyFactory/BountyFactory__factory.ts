/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  BountyFactory,
  BountyFactoryInterface,
} from "../../../contracts/BountyFactory/BountyFactory";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_openQ",
        type: "address",
      },
      {
        internalType: "address",
        name: "_beacon",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    inputs: [],
    name: "getBeacon",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_id",
        type: "string",
      },
      {
        internalType: "address",
        name: "_issuer",
        type: "address",
      },
      {
        internalType: "string",
        name: "_organization",
        type: "string",
      },
      {
        internalType: "address",
        name: "_claimManager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_depositManager",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint32",
            name: "operationType",
            type: "uint32",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct OpenQDefinitions.InitOperation",
        name: "operation",
        type: "tuple",
      },
    ],
    name: "mintBounty",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "openQ",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60a060405234801561001057600080fd5b50604051610f12380380610f1283398101604081905261002f91610078565b603380546001600160a01b0319166001600160a01b0384161790556001600160a01b0316608052506100ab565b80516001600160a01b038116811461007357600080fd5b919050565b6000806040838503121561008b57600080fd5b6100948361005c565b91506100a26020840161005c565b90509250929050565b608051610e466100cc60003960008181604d01526101210152610e466000f3fe60806040523480156200001157600080fd5b5060043610620000465760003560e01c80632d6b3a6b146200004b57806347d2bea214620000895780637dc81fa214620000a0575b600080fd5b7f00000000000000000000000000000000000000000000000000000000000000005b6040516001600160a01b03909116815260200160405180910390f35b6200006d6200009a366004620002f2565b620000b2565b6033546001600160a01b03166200006d565b6033546000906001600160a01b0316336001600160a01b0316146200011d5760405162461bcd60e51b815260206004820181905260248201527f4d6574686f64206973206f6e6c792063616c6c61626c65206279204f70656e51604482015260640160405180910390fd5b60007f0000000000000000000000000000000000000000000000000000000000000000888888620001566033546001600160a01b031690565b8989896040516024016200017197969594939291906200046c565b60408051601f198184030181529181526020820180516001600160e01b0316631fa07b1b60e11b17905251620001a790620001de565b620001b4929190620004fc565b604051809103906000f080158015620001d1573d6000803e3d6000fd5b5098975050505050505050565b6108e6806200052b83390190565b634e487b7160e01b600052604160045260246000fd5b6040805190810167ffffffffffffffff81118282101715620002285762000228620001ec565b60405290565b600067ffffffffffffffff808411156200024c576200024c620001ec565b604051601f8501601f19908116603f01168101908282118183101715620002775762000277620001ec565b816040528093508581528686860111156200029157600080fd5b858560208301376000602087830101525050509392505050565b600082601f830112620002bd57600080fd5b620002ce838335602085016200022e565b9392505050565b80356001600160a01b0381168114620002ed57600080fd5b919050565b60008060008060008060c087890312156200030c57600080fd5b863567ffffffffffffffff808211156200032557600080fd5b620003338a838b01620002ab565b97506200034360208a01620002d5565b965060408901359150808211156200035a57600080fd5b620003688a838b01620002ab565b95506200037860608a01620002d5565b94506200038860808a01620002d5565b935060a08901359150808211156200039f57600080fd5b908801906040828b031215620003b457600080fd5b620003be62000202565b823563ffffffff81168114620003d357600080fd5b8152602083013582811115620003e857600080fd5b8084019350508a601f840112620003fe57600080fd5b6200040f8b8435602086016200022e565b60208201528093505050509295509295509295565b6000815180845260005b818110156200044c576020818501810151868301820152016200042e565b506000602082860101526020601f19601f83011685010191505092915050565b60e0815260006200048160e083018a62000424565b6001600160a01b0389811660208501528382036040850152620004a5828a62000424565b91508088166060850152808716608085015280861660a08501525082810360c084015263ffffffff8451168152602084015160406020830152620004ed604083018262000424565b9b9a5050505050505050505050565b6001600160a01b0383168152604060208201819052600090620005229083018462000424565b94935050505056fe60806040526040516108e63803806108e68339810160408190526100229161044e565b61002e82826000610035565b5050610578565b61003e83610100565b6040516001600160a01b038416907f1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e90600090a260008251118061007f5750805b156100fb576100f9836001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100e9919061050e565b836102a360201b6100291760201c565b505b505050565b610113816102cf60201b6100551760201c565b6101725760405162461bcd60e51b815260206004820152602560248201527f455243313936373a206e657720626561636f6e206973206e6f74206120636f6e6044820152641d1c9858dd60da1b60648201526084015b60405180910390fd5b6101e6816001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156101b3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d7919061050e565b6102cf60201b6100551760201c565b61024b5760405162461bcd60e51b815260206004820152603060248201527f455243313936373a20626561636f6e20696d706c656d656e746174696f6e206960448201526f1cc81b9bdd08184818dbdb9d1c9858dd60821b6064820152608401610169565b806102827fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d5060001b6102de60201b6100641760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b60606102c883836040518060600160405280602781526020016108bf602791396102e1565b9392505050565b6001600160a01b03163b151590565b90565b60606001600160a01b0384163b6103495760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b6064820152608401610169565b600080856001600160a01b0316856040516103649190610529565b600060405180830381855af49150503d806000811461039f576040519150601f19603f3d011682016040523d82523d6000602084013e6103a4565b606091505b5090925090506103b58282866103bf565b9695505050505050565b606083156103ce5750816102c8565b8251156103de5782518084602001fd5b8160405162461bcd60e51b81526004016101699190610545565b80516001600160a01b038116811461040f57600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561044557818101518382015260200161042d565b50506000910152565b6000806040838503121561046157600080fd5b61046a836103f8565b60208401519092506001600160401b038082111561048757600080fd5b818501915085601f83011261049b57600080fd5b8151818111156104ad576104ad610414565b604051601f8201601f19908116603f011681019083821181831017156104d5576104d5610414565b816040528281528860208487010111156104ee57600080fd5b6104ff83602083016020880161042a565b80955050505050509250929050565b60006020828403121561052057600080fd5b6102c8826103f8565b6000825161053b81846020870161042a565b9190910192915050565b602081526000825180602084015261056481604085016020870161042a565b601f01601f19169190910160400192915050565b610338806105876000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610067565b610100565b565b606061004e83836040518060600160405280602781526020016102dc60279139610124565b9392505050565b6001600160a01b03163b151590565b90565b600061009a7fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50546001600160a01b031690565b6001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100d7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100fb919061023f565b905090565b3660008037600080366000845af43d6000803e80801561011f573d6000f35b3d6000fd5b60606001600160a01b0384163b6101915760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b60648201526084015b60405180910390fd5b600080856001600160a01b0316856040516101ac919061028c565b600060405180830381855af49150503d80600081146101e7576040519150601f19603f3d011682016040523d82523d6000602084013e6101ec565b606091505b50915091506101fc828286610206565b9695505050505050565b6060831561021557508161004e565b8251156102255782518084602001fd5b8160405162461bcd60e51b815260040161018891906102a8565b60006020828403121561025157600080fd5b81516001600160a01b038116811461004e57600080fd5b60005b8381101561028357818101518382015260200161026b565b50506000910152565b6000825161029e818460208701610268565b9190910192915050565b60208152600082518060208401526102c7816040850160208701610268565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212207f69f2315e66815a88e8440bdd2a07ebcd8f5c1b3c8309555a37f55a684c987b64736f6c63430008100033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220a2d023e010cfc1c23aee89aacb336e775a4752482de15ff91890c525094c0a8664736f6c63430008100033";

type BountyFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BountyFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BountyFactory__factory extends ContractFactory {
  constructor(...args: BountyFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _openQ: PromiseOrValue<string>,
    _beacon: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BountyFactory> {
    return super.deploy(
      _openQ,
      _beacon,
      overrides || {}
    ) as Promise<BountyFactory>;
  }
  override getDeployTransaction(
    _openQ: PromiseOrValue<string>,
    _beacon: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_openQ, _beacon, overrides || {});
  }
  override attach(address: string): BountyFactory {
    return super.attach(address) as BountyFactory;
  }
  override connect(signer: Signer): BountyFactory__factory {
    return super.connect(signer) as BountyFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BountyFactoryInterface {
    return new utils.Interface(_abi) as BountyFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BountyFactory {
    return new Contract(address, _abi, signerOrProvider) as BountyFactory;
  }
}
