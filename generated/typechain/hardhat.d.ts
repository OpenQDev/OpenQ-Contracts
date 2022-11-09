/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "OwnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OwnableUpgradeable__factory>;
    getContractFactory(
      name: "IERC1822ProxiableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1822ProxiableUpgradeable__factory>;
    getContractFactory(
      name: "IBeaconUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBeaconUpgradeable__factory>;
    getContractFactory(
      name: "ERC1967UpgradeUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967UpgradeUpgradeable__factory>;
    getContractFactory(
      name: "Initializable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Initializable__factory>;
    getContractFactory(
      name: "UUPSUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UUPSUpgradeable__factory>;
    getContractFactory(
      name: "ReentrancyGuardUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ReentrancyGuardUpgradeable__factory>;
    getContractFactory(
      name: "IERC20PermitUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20PermitUpgradeable__factory>;
    getContractFactory(
      name: "IERC20Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Upgradeable__factory>;
    getContractFactory(
      name: "IERC721ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "IERC721Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Upgradeable__factory>;
    getContractFactory(
      name: "ERC721HolderUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721HolderUpgradeable__factory>;
    getContractFactory(
      name: "ContextUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ContextUpgradeable__factory>;
    getContractFactory(
      name: "IERC165Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165Upgradeable__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "IERC1822Proxiable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1822Proxiable__factory>;
    getContractFactory(
      name: "BeaconProxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BeaconProxy__factory>;
    getContractFactory(
      name: "IBeacon",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBeacon__factory>;
    getContractFactory(
      name: "UpgradeableBeacon",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UpgradeableBeacon__factory>;
    getContractFactory(
      name: "ERC1967Proxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967Proxy__factory>;
    getContractFactory(
      name: "ERC1967Upgrade",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967Upgrade__factory>;
    getContractFactory(
      name: "Proxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Proxy__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "ERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721__factory>;
    getContractFactory(
      name: "ERC721URIStorage",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721URIStorage__factory>;
    getContractFactory(
      name: "IERC721Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Metadata__factory>;
    getContractFactory(
      name: "IERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721__factory>;
    getContractFactory(
      name: "IERC721Receiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Receiver__factory>;
    getContractFactory(
      name: "ERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165__factory>;
    getContractFactory(
      name: "IERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165__factory>;
    getContractFactory(
      name: "BountyV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BountyV1__factory>;
    getContractFactory(
      name: "BountyBeacon",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BountyBeacon__factory>;
    getContractFactory(
      name: "BountyFactory",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BountyFactory__factory>;
    getContractFactory(
      name: "ClaimManagerOwnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ClaimManagerOwnable__factory>;
    getContractFactory(
      name: "ClaimManagerStorageV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ClaimManagerStorageV1__factory>;
    getContractFactory(
      name: "ClaimManagerStorageV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ClaimManagerStorageV2__factory>;
    getContractFactory(
      name: "ClaimManagerV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ClaimManagerV2__factory>;
    getContractFactory(
      name: "DepositManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DepositManager__factory>;
    getContractFactory(
      name: "DepositManagerOwnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DepositManagerOwnable__factory>;
    getContractFactory(
      name: "DepositManagerStorageV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DepositManagerStorageV1__factory>;
    getContractFactory(
      name: "OnlyOpenQ",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OnlyOpenQ__factory>;
    getContractFactory(
      name: "OpenQV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OpenQV2__factory>;
    getContractFactory(
      name: "IOpenQ",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IOpenQ__factory>;
    getContractFactory(
      name: "IOpenQV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IOpenQV2__factory>;
    getContractFactory(
      name: "OpenQProxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OpenQProxy__factory>;
    getContractFactory(
      name: "Oraclize",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Oraclize__factory>;
    getContractFactory(
      name: "BountyStorageV0",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BountyStorageV0__factory>;
    getContractFactory(
      name: "BountyStorageV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BountyStorageV1__factory>;
    getContractFactory(
      name: "OpenQStorageV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OpenQStorageV1__factory>;
    getContractFactory(
      name: "OpenQStorageV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OpenQStorageV2__factory>;
    getContractFactory(
      name: "MockDai",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockDai__factory>;
    getContractFactory(
      name: "MockLink",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockLink__factory>;
    getContractFactory(
      name: "MockNft",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockNft__factory>;
    getContractFactory(
      name: "OpenQTokenWhitelist",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OpenQTokenWhitelist__factory>;
    getContractFactory(
      name: "TestToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestToken__factory>;
    getContractFactory(
      name: "TokenWhitelist",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TokenWhitelist__factory>;
    getContractFactory(
      name: "TokenFeeToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TokenFeeToken__factory>;

    getContractAt(
      name: "OwnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OwnableUpgradeable>;
    getContractAt(
      name: "IERC1822ProxiableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1822ProxiableUpgradeable>;
    getContractAt(
      name: "IBeaconUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBeaconUpgradeable>;
    getContractAt(
      name: "ERC1967UpgradeUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967UpgradeUpgradeable>;
    getContractAt(
      name: "Initializable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Initializable>;
    getContractAt(
      name: "UUPSUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UUPSUpgradeable>;
    getContractAt(
      name: "ReentrancyGuardUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ReentrancyGuardUpgradeable>;
    getContractAt(
      name: "IERC20PermitUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20PermitUpgradeable>;
    getContractAt(
      name: "IERC20Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Upgradeable>;
    getContractAt(
      name: "IERC721ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721ReceiverUpgradeable>;
    getContractAt(
      name: "IERC721Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Upgradeable>;
    getContractAt(
      name: "ERC721HolderUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721HolderUpgradeable>;
    getContractAt(
      name: "ContextUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ContextUpgradeable>;
    getContractAt(
      name: "IERC165Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165Upgradeable>;
    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "IERC1822Proxiable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1822Proxiable>;
    getContractAt(
      name: "BeaconProxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BeaconProxy>;
    getContractAt(
      name: "IBeacon",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBeacon>;
    getContractAt(
      name: "UpgradeableBeacon",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UpgradeableBeacon>;
    getContractAt(
      name: "ERC1967Proxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967Proxy>;
    getContractAt(
      name: "ERC1967Upgrade",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967Upgrade>;
    getContractAt(
      name: "Proxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Proxy>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "ERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721>;
    getContractAt(
      name: "ERC721URIStorage",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721URIStorage>;
    getContractAt(
      name: "IERC721Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Metadata>;
    getContractAt(
      name: "IERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721>;
    getContractAt(
      name: "IERC721Receiver",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Receiver>;
    getContractAt(
      name: "ERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165>;
    getContractAt(
      name: "IERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165>;
    getContractAt(
      name: "BountyV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BountyV1>;
    getContractAt(
      name: "BountyBeacon",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BountyBeacon>;
    getContractAt(
      name: "BountyFactory",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BountyFactory>;
    getContractAt(
      name: "ClaimManagerOwnable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ClaimManagerOwnable>;
    getContractAt(
      name: "ClaimManagerStorageV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ClaimManagerStorageV1>;
    getContractAt(
      name: "ClaimManagerStorageV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ClaimManagerStorageV2>;
    getContractAt(
      name: "ClaimManagerV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ClaimManagerV2>;
    getContractAt(
      name: "DepositManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DepositManager>;
    getContractAt(
      name: "DepositManagerOwnable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DepositManagerOwnable>;
    getContractAt(
      name: "DepositManagerStorageV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DepositManagerStorageV1>;
    getContractAt(
      name: "OnlyOpenQ",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OnlyOpenQ>;
    getContractAt(
      name: "OpenQV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OpenQV2>;
    getContractAt(
      name: "IOpenQ",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IOpenQ>;
    getContractAt(
      name: "IOpenQV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IOpenQV2>;
    getContractAt(
      name: "OpenQProxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OpenQProxy>;
    getContractAt(
      name: "Oraclize",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Oraclize>;
    getContractAt(
      name: "BountyStorageV0",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BountyStorageV0>;
    getContractAt(
      name: "BountyStorageV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BountyStorageV1>;
    getContractAt(
      name: "OpenQStorageV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OpenQStorageV1>;
    getContractAt(
      name: "OpenQStorageV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OpenQStorageV2>;
    getContractAt(
      name: "MockDai",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockDai>;
    getContractAt(
      name: "MockLink",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockLink>;
    getContractAt(
      name: "MockNft",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockNft>;
    getContractAt(
      name: "OpenQTokenWhitelist",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OpenQTokenWhitelist>;
    getContractAt(
      name: "TestToken",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TestToken>;
    getContractAt(
      name: "TokenWhitelist",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TokenWhitelist>;
    getContractAt(
      name: "TokenFeeToken",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TokenFeeToken>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
