/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface DepositManagerStorageV2Interface extends utils.Interface {
  functions: {
    "VERSION_1()": FunctionFragment;
    "VERSION_2()": FunctionFragment;
    "openQTokenWhitelist()": FunctionFragment;
    "owner()": FunctionFragment;
    "proxiableUUID()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "upgradeTo(address)": FunctionFragment;
    "upgradeToAndCall(address,bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "VERSION_1"
      | "VERSION_2"
      | "openQTokenWhitelist"
      | "owner"
      | "proxiableUUID"
      | "renounceOwnership"
      | "transferOwnership"
      | "upgradeTo"
      | "upgradeToAndCall"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "VERSION_1", values?: undefined): string;
  encodeFunctionData(functionFragment: "VERSION_2", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "openQTokenWhitelist",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "proxiableUUID",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "upgradeTo",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "upgradeToAndCall",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(functionFragment: "VERSION_1", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "VERSION_2", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "openQTokenWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "proxiableUUID",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "upgradeTo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "upgradeToAndCall",
    data: BytesLike
  ): Result;

  events: {
    "AdminChanged(address,address)": EventFragment;
    "BeaconUpgraded(address)": EventFragment;
    "BountyClosed(string,address,string,address,uint256,uint256,bytes,uint256)": EventFragment;
    "BountyCreated(string,string,address,address,uint256,uint256,bytes,uint256)": EventFragment;
    "ClaimSuccess(uint256,uint256,bytes,uint256)": EventFragment;
    "DepositExtended(bytes32,uint256,uint256,bytes,uint256)": EventFragment;
    "DepositRefunded(bytes32,string,address,string,uint256,address,uint256,uint256,bytes,uint256)": EventFragment;
    "ExternalUserIdAssociatedWithAddress(string,address,bytes,uint256)": EventFragment;
    "FundingGoalSet(address,address,uint256,uint256,bytes,uint256)": EventFragment;
    "Initialized(uint8)": EventFragment;
    "InvoiceableSet(address,bool,bytes,uint256)": EventFragment;
    "KYCRequiredSet(address,bool,bytes,uint256)": EventFragment;
    "NFTClaimed(string,address,string,address,uint256,address,uint256,uint256,bytes,uint256)": EventFragment;
    "NFTDepositReceived(bytes32,address,string,string,address,uint256,address,uint256,uint256,uint256,bytes,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "PayoutScheduleSet(address,address,uint256[],uint256,bytes,uint256)": EventFragment;
    "PayoutSet(address,address,uint256,uint256,bytes,uint256)": EventFragment;
    "TierClaimed(address,address,bytes,uint256)": EventFragment;
    "TokenBalanceClaimed(string,address,string,address,uint256,address,uint256,uint256,bytes,uint256)": EventFragment;
    "TokenDepositReceived(bytes32,address,string,string,address,uint256,address,uint256,uint256,uint256,bytes,uint256)": EventFragment;
    "Upgraded(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BeaconUpgraded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BountyClosed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BountyCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ClaimSuccess"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositExtended"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositRefunded"): EventFragment;
  getEvent(
    nameOrSignatureOrTopic: "ExternalUserIdAssociatedWithAddress"
  ): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FundingGoalSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "InvoiceableSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "KYCRequiredSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NFTClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "NFTDepositReceived"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PayoutScheduleSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PayoutSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TierClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenBalanceClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenDepositReceived"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Upgraded"): EventFragment;
}

export interface AdminChangedEventObject {
  previousAdmin: string;
  newAdmin: string;
}
export type AdminChangedEvent = TypedEvent<
  [string, string],
  AdminChangedEventObject
>;

export type AdminChangedEventFilter = TypedEventFilter<AdminChangedEvent>;

export interface BeaconUpgradedEventObject {
  beacon: string;
}
export type BeaconUpgradedEvent = TypedEvent<
  [string],
  BeaconUpgradedEventObject
>;

export type BeaconUpgradedEventFilter = TypedEventFilter<BeaconUpgradedEvent>;

export interface BountyClosedEventObject {
  bountyId: string;
  bountyAddress: string;
  organization: string;
  closer: string;
  bountyClosedTime: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type BountyClosedEvent = TypedEvent<
  [string, string, string, string, BigNumber, BigNumber, string, BigNumber],
  BountyClosedEventObject
>;

export type BountyClosedEventFilter = TypedEventFilter<BountyClosedEvent>;

export interface BountyCreatedEventObject {
  bountyId: string;
  organization: string;
  issuerAddress: string;
  bountyAddress: string;
  bountyMintTime: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type BountyCreatedEvent = TypedEvent<
  [string, string, string, string, BigNumber, BigNumber, string, BigNumber],
  BountyCreatedEventObject
>;

export type BountyCreatedEventFilter = TypedEventFilter<BountyCreatedEvent>;

export interface ClaimSuccessEventObject {
  claimTime: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type ClaimSuccessEvent = TypedEvent<
  [BigNumber, BigNumber, string, BigNumber],
  ClaimSuccessEventObject
>;

export type ClaimSuccessEventFilter = TypedEventFilter<ClaimSuccessEvent>;

export interface DepositExtendedEventObject {
  depositId: string;
  newExpiration: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type DepositExtendedEvent = TypedEvent<
  [string, BigNumber, BigNumber, string, BigNumber],
  DepositExtendedEventObject
>;

export type DepositExtendedEventFilter = TypedEventFilter<DepositExtendedEvent>;

export interface DepositRefundedEventObject {
  depositId: string;
  bountyId: string;
  bountyAddress: string;
  organization: string;
  refundTime: BigNumber;
  tokenAddress: string;
  volume: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type DepositRefundedEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    string,
    BigNumber
  ],
  DepositRefundedEventObject
>;

export type DepositRefundedEventFilter = TypedEventFilter<DepositRefundedEvent>;

export interface ExternalUserIdAssociatedWithAddressEventObject {
  externalUserId: string;
  newAddress: string;
  data: string;
  version: BigNumber;
}
export type ExternalUserIdAssociatedWithAddressEvent = TypedEvent<
  [string, string, string, BigNumber],
  ExternalUserIdAssociatedWithAddressEventObject
>;

export type ExternalUserIdAssociatedWithAddressEventFilter =
  TypedEventFilter<ExternalUserIdAssociatedWithAddressEvent>;

export interface FundingGoalSetEventObject {
  bountyAddress: string;
  fundingGoalTokenAddress: string;
  fundingGoalVolume: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type FundingGoalSetEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, string, BigNumber],
  FundingGoalSetEventObject
>;

export type FundingGoalSetEventFilter = TypedEventFilter<FundingGoalSetEvent>;

export interface InitializedEventObject {
  version: number;
}
export type InitializedEvent = TypedEvent<[number], InitializedEventObject>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export interface InvoiceableSetEventObject {
  bountyAddress: string;
  invoiceable: boolean;
  data: string;
  version: BigNumber;
}
export type InvoiceableSetEvent = TypedEvent<
  [string, boolean, string, BigNumber],
  InvoiceableSetEventObject
>;

export type InvoiceableSetEventFilter = TypedEventFilter<InvoiceableSetEvent>;

export interface KYCRequiredSetEventObject {
  bountyAddress: string;
  kycRequired: boolean;
  data: string;
  version: BigNumber;
}
export type KYCRequiredSetEvent = TypedEvent<
  [string, boolean, string, BigNumber],
  KYCRequiredSetEventObject
>;

export type KYCRequiredSetEventFilter = TypedEventFilter<KYCRequiredSetEvent>;

export interface NFTClaimedEventObject {
  bountyId: string;
  bountyAddress: string;
  organization: string;
  closer: string;
  payoutTime: BigNumber;
  tokenAddress: string;
  tokenId: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type NFTClaimedEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    string,
    BigNumber
  ],
  NFTClaimedEventObject
>;

export type NFTClaimedEventFilter = TypedEventFilter<NFTClaimedEvent>;

export interface NFTDepositReceivedEventObject {
  depositId: string;
  bountyAddress: string;
  bountyId: string;
  organization: string;
  tokenAddress: string;
  receiveTime: BigNumber;
  sender: string;
  expiration: BigNumber;
  tokenId: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type NFTDepositReceivedEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    string,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    BigNumber
  ],
  NFTDepositReceivedEventObject
>;

export type NFTDepositReceivedEventFilter =
  TypedEventFilter<NFTDepositReceivedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface PayoutScheduleSetEventObject {
  bountyAddress: string;
  payoutTokenAddress: string;
  payoutSchedule: BigNumber[];
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type PayoutScheduleSetEvent = TypedEvent<
  [string, string, BigNumber[], BigNumber, string, BigNumber],
  PayoutScheduleSetEventObject
>;

export type PayoutScheduleSetEventFilter =
  TypedEventFilter<PayoutScheduleSetEvent>;

export interface PayoutSetEventObject {
  bountyAddress: string;
  payoutTokenAddress: string;
  payoutTokenVolume: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type PayoutSetEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, string, BigNumber],
  PayoutSetEventObject
>;

export type PayoutSetEventFilter = TypedEventFilter<PayoutSetEvent>;

export interface TierClaimedEventObject {
  bountyAddress: string;
  claimant: string;
  data: string;
  version: BigNumber;
}
export type TierClaimedEvent = TypedEvent<
  [string, string, string, BigNumber],
  TierClaimedEventObject
>;

export type TierClaimedEventFilter = TypedEventFilter<TierClaimedEvent>;

export interface TokenBalanceClaimedEventObject {
  bountyId: string;
  bountyAddress: string;
  organization: string;
  closer: string;
  payoutTime: BigNumber;
  tokenAddress: string;
  volume: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type TokenBalanceClaimedEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    string,
    BigNumber
  ],
  TokenBalanceClaimedEventObject
>;

export type TokenBalanceClaimedEventFilter =
  TypedEventFilter<TokenBalanceClaimedEvent>;

export interface TokenDepositReceivedEventObject {
  depositId: string;
  bountyAddress: string;
  bountyId: string;
  organization: string;
  tokenAddress: string;
  receiveTime: BigNumber;
  sender: string;
  expiration: BigNumber;
  volume: BigNumber;
  bountyType: BigNumber;
  data: string;
  version: BigNumber;
}
export type TokenDepositReceivedEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    string,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    BigNumber
  ],
  TokenDepositReceivedEventObject
>;

export type TokenDepositReceivedEventFilter =
  TypedEventFilter<TokenDepositReceivedEvent>;

export interface UpgradedEventObject {
  implementation: string;
}
export type UpgradedEvent = TypedEvent<[string], UpgradedEventObject>;

export type UpgradedEventFilter = TypedEventFilter<UpgradedEvent>;

export interface DepositManagerStorageV2 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: DepositManagerStorageV2Interface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    VERSION_1(overrides?: CallOverrides): Promise<[BigNumber]>;

    VERSION_2(overrides?: CallOverrides): Promise<[BigNumber]>;

    openQTokenWhitelist(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    proxiableUUID(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    upgradeTo(
      newImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    upgradeToAndCall(
      newImplementation: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  VERSION_1(overrides?: CallOverrides): Promise<BigNumber>;

  VERSION_2(overrides?: CallOverrides): Promise<BigNumber>;

  openQTokenWhitelist(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  proxiableUUID(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  upgradeTo(
    newImplementation: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  upgradeToAndCall(
    newImplementation: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    VERSION_1(overrides?: CallOverrides): Promise<BigNumber>;

    VERSION_2(overrides?: CallOverrides): Promise<BigNumber>;

    openQTokenWhitelist(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    proxiableUUID(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    upgradeTo(
      newImplementation: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    upgradeToAndCall(
      newImplementation: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "AdminChanged(address,address)"(
      previousAdmin?: null,
      newAdmin?: null
    ): AdminChangedEventFilter;
    AdminChanged(
      previousAdmin?: null,
      newAdmin?: null
    ): AdminChangedEventFilter;

    "BeaconUpgraded(address)"(
      beacon?: PromiseOrValue<string> | null
    ): BeaconUpgradedEventFilter;
    BeaconUpgraded(
      beacon?: PromiseOrValue<string> | null
    ): BeaconUpgradedEventFilter;

    "BountyClosed(string,address,string,address,uint256,uint256,bytes,uint256)"(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      bountyClosedTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): BountyClosedEventFilter;
    BountyClosed(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      bountyClosedTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): BountyClosedEventFilter;

    "BountyCreated(string,string,address,address,uint256,uint256,bytes,uint256)"(
      bountyId?: null,
      organization?: null,
      issuerAddress?: null,
      bountyAddress?: null,
      bountyMintTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): BountyCreatedEventFilter;
    BountyCreated(
      bountyId?: null,
      organization?: null,
      issuerAddress?: null,
      bountyAddress?: null,
      bountyMintTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): BountyCreatedEventFilter;

    "ClaimSuccess(uint256,uint256,bytes,uint256)"(
      claimTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): ClaimSuccessEventFilter;
    ClaimSuccess(
      claimTime?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): ClaimSuccessEventFilter;

    "DepositExtended(bytes32,uint256,uint256,bytes,uint256)"(
      depositId?: null,
      newExpiration?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): DepositExtendedEventFilter;
    DepositExtended(
      depositId?: null,
      newExpiration?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): DepositExtendedEventFilter;

    "DepositRefunded(bytes32,string,address,string,uint256,address,uint256,uint256,bytes,uint256)"(
      depositId?: null,
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      refundTime?: null,
      tokenAddress?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): DepositRefundedEventFilter;
    DepositRefunded(
      depositId?: null,
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      refundTime?: null,
      tokenAddress?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): DepositRefundedEventFilter;

    "ExternalUserIdAssociatedWithAddress(string,address,bytes,uint256)"(
      externalUserId?: null,
      newAddress?: null,
      data?: null,
      version?: null
    ): ExternalUserIdAssociatedWithAddressEventFilter;
    ExternalUserIdAssociatedWithAddress(
      externalUserId?: null,
      newAddress?: null,
      data?: null,
      version?: null
    ): ExternalUserIdAssociatedWithAddressEventFilter;

    "FundingGoalSet(address,address,uint256,uint256,bytes,uint256)"(
      bountyAddress?: null,
      fundingGoalTokenAddress?: null,
      fundingGoalVolume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): FundingGoalSetEventFilter;
    FundingGoalSet(
      bountyAddress?: null,
      fundingGoalTokenAddress?: null,
      fundingGoalVolume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): FundingGoalSetEventFilter;

    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;

    "InvoiceableSet(address,bool,bytes,uint256)"(
      bountyAddress?: null,
      invoiceable?: null,
      data?: null,
      version?: null
    ): InvoiceableSetEventFilter;
    InvoiceableSet(
      bountyAddress?: null,
      invoiceable?: null,
      data?: null,
      version?: null
    ): InvoiceableSetEventFilter;

    "KYCRequiredSet(address,bool,bytes,uint256)"(
      bountyAddress?: null,
      kycRequired?: null,
      data?: null,
      version?: null
    ): KYCRequiredSetEventFilter;
    KYCRequiredSet(
      bountyAddress?: null,
      kycRequired?: null,
      data?: null,
      version?: null
    ): KYCRequiredSetEventFilter;

    "NFTClaimed(string,address,string,address,uint256,address,uint256,uint256,bytes,uint256)"(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      payoutTime?: null,
      tokenAddress?: null,
      tokenId?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): NFTClaimedEventFilter;
    NFTClaimed(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      payoutTime?: null,
      tokenAddress?: null,
      tokenId?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): NFTClaimedEventFilter;

    "NFTDepositReceived(bytes32,address,string,string,address,uint256,address,uint256,uint256,uint256,bytes,uint256)"(
      depositId?: null,
      bountyAddress?: null,
      bountyId?: null,
      organization?: null,
      tokenAddress?: null,
      receiveTime?: null,
      sender?: null,
      expiration?: null,
      tokenId?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): NFTDepositReceivedEventFilter;
    NFTDepositReceived(
      depositId?: null,
      bountyAddress?: null,
      bountyId?: null,
      organization?: null,
      tokenAddress?: null,
      receiveTime?: null,
      sender?: null,
      expiration?: null,
      tokenId?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): NFTDepositReceivedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "PayoutScheduleSet(address,address,uint256[],uint256,bytes,uint256)"(
      bountyAddress?: null,
      payoutTokenAddress?: null,
      payoutSchedule?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): PayoutScheduleSetEventFilter;
    PayoutScheduleSet(
      bountyAddress?: null,
      payoutTokenAddress?: null,
      payoutSchedule?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): PayoutScheduleSetEventFilter;

    "PayoutSet(address,address,uint256,uint256,bytes,uint256)"(
      bountyAddress?: null,
      payoutTokenAddress?: null,
      payoutTokenVolume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): PayoutSetEventFilter;
    PayoutSet(
      bountyAddress?: null,
      payoutTokenAddress?: null,
      payoutTokenVolume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): PayoutSetEventFilter;

    "TierClaimed(address,address,bytes,uint256)"(
      bountyAddress?: null,
      claimant?: null,
      data?: null,
      version?: null
    ): TierClaimedEventFilter;
    TierClaimed(
      bountyAddress?: null,
      claimant?: null,
      data?: null,
      version?: null
    ): TierClaimedEventFilter;

    "TokenBalanceClaimed(string,address,string,address,uint256,address,uint256,uint256,bytes,uint256)"(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      payoutTime?: null,
      tokenAddress?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): TokenBalanceClaimedEventFilter;
    TokenBalanceClaimed(
      bountyId?: null,
      bountyAddress?: null,
      organization?: null,
      closer?: null,
      payoutTime?: null,
      tokenAddress?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): TokenBalanceClaimedEventFilter;

    "TokenDepositReceived(bytes32,address,string,string,address,uint256,address,uint256,uint256,uint256,bytes,uint256)"(
      depositId?: null,
      bountyAddress?: null,
      bountyId?: null,
      organization?: null,
      tokenAddress?: null,
      receiveTime?: null,
      sender?: null,
      expiration?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): TokenDepositReceivedEventFilter;
    TokenDepositReceived(
      depositId?: null,
      bountyAddress?: null,
      bountyId?: null,
      organization?: null,
      tokenAddress?: null,
      receiveTime?: null,
      sender?: null,
      expiration?: null,
      volume?: null,
      bountyType?: null,
      data?: null,
      version?: null
    ): TokenDepositReceivedEventFilter;

    "Upgraded(address)"(
      implementation?: PromiseOrValue<string> | null
    ): UpgradedEventFilter;
    Upgraded(
      implementation?: PromiseOrValue<string> | null
    ): UpgradedEventFilter;
  };

  estimateGas: {
    VERSION_1(overrides?: CallOverrides): Promise<BigNumber>;

    VERSION_2(overrides?: CallOverrides): Promise<BigNumber>;

    openQTokenWhitelist(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    proxiableUUID(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    upgradeTo(
      newImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    upgradeToAndCall(
      newImplementation: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    VERSION_1(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    VERSION_2(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    openQTokenWhitelist(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proxiableUUID(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    upgradeTo(
      newImplementation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    upgradeToAndCall(
      newImplementation: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
