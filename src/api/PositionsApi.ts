/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface DashboardEventType {
  /** contract address */
  contract: string;
  /** @example "/api/v1/events/GetAllApprovals" */
  endpoint: string;
  eventName: string;
}

export interface DashboardEventTypes {
  /** list of event types for service */
  listEventTypes: DashboardEventType[];
}

export interface DashboardGraphEventDelayStatsDatapoint {
  /**
   * delay in ms
   * @format int64
   */
  delay: number;
  /**
   * timestamp of the datapoint
   * @format int64
   */
  timestamp: number;
}

export interface DashboardGraphEventStatsDatapoint {
  /**
   * count of events
   * @format int64
   */
  count: number;
  /**
   * timestamp of the datapoint
   * @format int64
   */
  timestamp: number;
}

export interface DashboardGraphEventTypeStats {
  /** contract address */
  contract: string;
  /** type of events */
  eventName: string;
  /**
   * total event number
   * @format int64
   */
  totalEvents: number;
}

export interface DashboardGraphEventTypesStats {
  /** data */
  data: DashboardGraphEventTypeStats[];
}

export interface DashboardGraphEventsDelayStats {
  everyEventsDelayData: DashboardGraphSingleEventTypeDelayStats[];
}

export interface DashboardGraphEventsStats {
  everyEventsData: DashboardGraphSingleEventTypeStats[];
  totalEvents: DashboardGraphSingleEventTypeStats;
}

export interface DashboardGraphRealTimeLatency {
  /** data */
  data: DashboardGraphRealTimeLatencyPerEndpoint[];
}

export interface DashboardGraphRealTimeLatencyPerEndpoint {
  /** endpoint data */
  eventType: DashboardEventType;
  realtimeLatency: {
    /**
     * real time latency rating for the endpoint; measured in fractions: [0.0, 1.0]
     * @format float
     */
    rating?: number;
    /**
     * real time latency value for the endpoint; measured in milliseconds
     * @format float
     */
    value?: number;
  };
}

export interface DashboardGraphRequestsDatapoint {
  /**
   * Latency in milliseconds at timestamp. Float is 32 bit (single precision)
   * @format float
   * @example 112.33
   */
  latency: number;
  /**
   * RPS of failed events at timestamp. Float is 32 bit (single precision)
   * @format float
   * @example 1.023
   */
  rpsFailed: number;
  /**
   * RPS of successful events at timestamp. Float is 32 bit (single precision)
   * @format float
   * @example 1.023
   */
  rpsSuccess: number;
  /**
   * timestamp of the datapoint
   * @format int64
   * @example 1730899607
   */
  timestamp: number;
}

export interface DashboardGraphRequestsPerEndpoint {
  /** endpoint data */
  eventType: DashboardEventType;
  points: DashboardGraphRequestsDatapoint[];
}

export interface DashboardGraphRequestsStats {
  /** data */
  data: DashboardGraphRequestsPerEndpoint[];
}

export interface DashboardGraphSingleEventTypeDelayStats {
  /** contract address */
  contract: string;
  /** data */
  data: DashboardGraphEventDelayStatsDatapoint[];
  /** type of events */
  eventName: string;
}

export interface DashboardGraphSingleEventTypeStats {
  /** contract address */
  contract: string;
  /** data */
  data: DashboardGraphEventStatsDatapoint[];
  /** type of events */
  eventName: string;
}

export interface DashboardGraphStatusCodeEndpointsStats {
  /** endpoint name */
  name: string;
  /**
   * total num of requests with that status code with that endpoint
   * @format int64
   */
  requestsNumber: number;
}

export interface DashboardGraphStatusCodeStats {
  endpoints: DashboardGraphStatusCodeEndpointsStats[];
  /**
   * http status code
   * @format int32
   * @min 100
   */
  statusCode: number;
  /**
   * total num of requests with that status code
   * @format int64
   */
  totalRequests: number;
}

export interface DashboardGraphStatusCodesStats {
  /** data */
  data: DashboardGraphStatusCodeStats[];
}

export interface SummaryDashboard {
  errorRate: SummaryDashboardHeaderValueRate;
  /**
   * number of event types
   * @format int64
   */
  eventTypesNumber: number;
  /**
   * first indexed event timestamp
   * @format int64
   */
  firstTimestamp: number;
  /**
   * events indexed during the interval
   * @format int64
   */
  indexedEvents: number;
  indexingDelay: SummaryDashboardHeaderValue;
  /**
   * latest event block number
   * @format int64
   */
  latestBlock: number;
  requestCapacity: SummaryDashboardHeaderValueRate;
  /**
   * total event number
   * @format int64
   */
  totalEvents: number;
}

export interface SummaryDashboardHeaderValue {
  /**
   * provides a rating to the value; measured in fractions: [0.0, 1.0]
   * @format float
   * @example 0.23
   */
  rating: number;
  /**
   * evaluate rating and provides current status for it
   * @example "ok"
   */
  status: SummaryDashboardHeaderValueStatusEnum;
  /**
   * for delay rating: number of milliseconds
   * @format int64
   * @example 66
   */
  value: number;
}

export interface SummaryDashboardHeaderValueRate {
  /**
   * provides a rating to the value; measured in fractions: [0.0, 1.0]
   * @format float
   * @example 0.23
   */
  rating: number;
  /**
   * evaluate rating and provides current status for it
   * @example "ok"
   */
  status: SummaryDashboardHeaderValueRateStatusEnum;
  /**
   * measured in %: [0.0, 100.0]
   * @format float
   * @example 34.5
   */
  value: number;
}

export type ModelsAddress = string;

export interface ModelsApproval {
  /** address indexed */
  approved: ModelsAddress;
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** address indexed */
  owner: ModelsAddress;
  /** uint256 indexed */
  tokenId: ModelsBigInt;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsApprovalForAll {
  /** bool */
  approved: boolean;
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** address indexed */
  operator: ModelsAddress;
  /** address indexed */
  owner: ModelsAddress;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsApprovalForAlls {
  /** @format uint64 */
  total: string;
  values: ModelsApprovalForAll[];
}

export interface ModelsApprovals {
  /** @format uint64 */
  total: string;
  values: ModelsApproval[];
}

export type ModelsBigInt = string;

export interface ModelsCollect {
  /** uint256 */
  amount0: ModelsBigInt;
  /** uint256 */
  amount1: ModelsBigInt;
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** address */
  recipient: ModelsAddress;
  /** uint256 indexed */
  tokenId: ModelsBigInt;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsCollects {
  /** @format uint64 */
  total: string;
  values: ModelsCollect[];
}

export interface ModelsDecreaseLiquidity {
  /** uint256 */
  amount0: ModelsBigInt;
  /** uint256 */
  amount1: ModelsBigInt;
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /** uint128 */
  liquidity: ModelsBigInt;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** uint256 indexed */
  tokenId: ModelsBigInt;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsDecreaseLiquiditys {
  /** @format uint64 */
  total: string;
  values: ModelsDecreaseLiquidity[];
}

export interface ModelsExtendedPosition {
  /** @format int32 */
  chainId: number;
  protocolVersion: string;
  status: string;
  v3Position: ModelsPosition;
}

export interface ModelsExtendedPositions {
  /** @format uint64 */
  total: string;
  values: ModelsExtendedPosition[];
}

export type ModelsHash = string;

export interface ModelsIncreaseLiquidity {
  /** uint256 */
  amount0: ModelsBigInt;
  /** uint256 */
  amount1: ModelsBigInt;
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /** uint128 */
  liquidity: ModelsBigInt;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** uint256 indexed */
  tokenId: ModelsBigInt;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsIncreaseLiquiditys {
  /** @format uint64 */
  total: string;
  values: ModelsIncreaseLiquidity[];
}

export interface ModelsPosition {
  /** calculated amount0 */
  amount0: ModelsBigInt;
  /** calculated amount1 */
  amount1: ModelsBigInt;
  /** annual percentage rate */
  apr: ModelsBigInt;
  /** current liquidity */
  currentLiquidity: ModelsBigInt;
  /** current price */
  currentPrice: ModelsBigInt;
  /** current tick */
  currentTick: ModelsBigInt;
  /** fee tier */
  feeTier: ModelsBigInt;
  /** liquidity amount */
  liquidity: ModelsBigInt;
  /** address upgradable from further transfer events */
  owner: ModelsAddress;
  /** pool contract address */
  poolId: ModelsAddress;
  /** tick lower */
  tickLower: ModelsBigInt;
  /** enum from feeTier */
  tickSpacing: ModelsBigInt;
  /** tick upper */
  tickUpper: ModelsBigInt;
  /** token0 uncollected fees */
  token0UncollectedFees: ModelsBigInt;
  token0: ModelsToken;
  token1: ModelsToken;
  /** token1 uncollected fees */
  token1UncollectedFees: ModelsBigInt;
  /** uint256 static unique id */
  tokenId: ModelsBigInt;
  /** total liquidity in USD */
  totalLiquidityUsd: ModelsBigInt;
}

export interface ModelsPositions {
  /** @format uint64 */
  total: string;
  values: ModelsPosition[];
}

export interface ModelsToken {
  address: string;
  /** @format int32 */
  chainId: number;
  /** @format int32 */
  decimals: number;
  name: string;
  symbol: string;
}

export interface ModelsTransfer {
  /**
   * event block number
   * @format uint64
   */
  blockNumber: string;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs: number;
  /** address indexed */
  from: ModelsAddress;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt: number;
  /**
   * event log index
   * @format uint64
   */
  logIndex: string;
  /** address indexed */
  to: ModelsAddress;
  /** uint256 indexed */
  tokenId: ModelsBigInt;
  /** event transaction hash */
  txHash: ModelsHash;
}

export interface ModelsTransfers {
  /** @format uint64 */
  total: string;
  values: ModelsTransfer[];
}

export interface ProtobufAny {
  "@type"?: string;
  [key: string]: any;
}

export interface RpcStatus {
  /** @format int32 */
  code?: number;
  details?: ProtobufAny[];
  message?: string;
}

/**
 * evaluate rating and provides current status for it
 * @example "ok"
 */
export enum SummaryDashboardHeaderValueStatusEnum {
  Ok = "ok",
  Warn = "warn",
  Alert = "alert",
}

/**
 * evaluate rating and provides current status for it
 * @example "ok"
 */
export enum SummaryDashboardHeaderValueRateStatusEnum {
  Ok = "ok",
  Warn = "warn",
  Alert = "alert",
}

export interface DashboardGetEventsDelayChartDataParams {
  /**
   * Start timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: 7 days ago
   * @format int64
   */
  fromTimestamp?: number;
  /**
   * End timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: now
   * @format int64
   */
  toTimestamp?: number;
  /**
   * Frame for the metrics increment. In seconds. Day by default.
   * @format int64
   * @min 1
   * @default 86400
   */
  interval?: number;
}

export interface DashboardGetDashboardEventTypesParams {
  /**
   * Start timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: 7 days ago
   * @format int64
   */
  fromTimestamp?: number;
  /**
   * End timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: now
   * @format int64
   */
  toTimestamp?: number;
}

export interface DashboardGetEventsChartDataParams {
  /**
   * Start timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: 7 days ago
   * @format int64
   */
  fromTimestamp?: number;
  /**
   * End timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: now
   * @format int64
   */
  toTimestamp?: number;
  /**
   * Frame for the metrics increment. In seconds. Day by default.
   * @format int64
   * @min 1
   * @default 86400
   */
  interval?: number;
}

export interface DashboardGetRequestsChartDataParams {
  /**
   * Start timestamp for filtering requests data. Unix Timestamp in UTC Zone. Default: 7 days ago
   * @format int64
   */
  fromTimestamp?: number;
  /**
   * End timestamp for filtering requests data. Unix Timestamp in UTC Zone. Default: now
   * @format int64
   */
  toTimestamp?: number;
  /**
   * Frame for the metrics increment. In seconds. Day by default.
   * @format int64
   * @min 1
   * @default 86400
   */
  interval?: number;
}

export interface DashboardGetDashboardStatusCodesParams {
  /**
   * Start timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: 7 days ago
   * @format int64
   */
  fromTimestamp?: number;
  /**
   * End timestamp for filtering event data. Unix Timestamp in UTC Zone. Default: now
   * @format int64
   */
  toTimestamp?: number;
}

export interface DashboardGetDashboardSummaryParams {
  /**
   * Frame for the metrics increment. In seconds. Day by default.
   * @format int64
   * @min 1
   * @default 86400
   */
  interval?: number;
}

export interface GetByFiltersApprovalForAllsParams {
  /** address indexed filter equal to */
  owner?: string;
  /** address[] indexed filter is in the array */
  ownerFilterIn?: string[];
  /** address indexed sort in ascending order */
  ownerSortAsc?: boolean;
  /** address indexed sort in descending order */
  ownerSortDesc?: boolean;
  /** address indexed filter equal to */
  operator?: string;
  /** address[] indexed filter is in the array */
  operatorFilterIn?: string[];
  /** address indexed sort in ascending order */
  operatorSortAsc?: boolean;
  /** address indexed sort in descending order */
  operatorSortDesc?: boolean;
  /** bool filter equal to */
  approved?: boolean;
  /** bool[] filter is in the array */
  approvedFilterIn?: boolean[];
  /** bool sort in ascending order */
  approvedSortAsc?: boolean;
  /** bool sort in descending order */
  approvedSortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersApprovalsParams {
  /** address indexed filter equal to */
  owner?: string;
  /** address[] indexed filter is in the array */
  ownerFilterIn?: string[];
  /** address indexed sort in ascending order */
  ownerSortAsc?: boolean;
  /** address indexed sort in descending order */
  ownerSortDesc?: boolean;
  /** address indexed filter equal to */
  approved?: string;
  /** address[] indexed filter is in the array */
  approvedFilterIn?: string[];
  /** address indexed sort in ascending order */
  approvedSortAsc?: boolean;
  /** address indexed sort in descending order */
  approvedSortDesc?: boolean;
  /** uint256 indexed filter equal to */
  tokenId?: string;
  /** uint256[] indexed filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 indexed filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 indexed filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLe?: string;
  /** uint256 indexed sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 indexed sort in descending order */
  tokenIdSortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersCollectsParams {
  /** uint256 indexed filter equal to */
  tokenId?: string;
  /** uint256[] indexed filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 indexed filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 indexed filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLe?: string;
  /** uint256 indexed sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 indexed sort in descending order */
  tokenIdSortDesc?: boolean;
  /** address filter equal to */
  recipient?: string;
  /** address[] filter is in the array */
  recipientFilterIn?: string[];
  /** address sort in ascending order */
  recipientSortAsc?: boolean;
  /** address sort in descending order */
  recipientSortDesc?: boolean;
  /** uint256 filter equal to */
  amount0?: string;
  /** uint256[] filter is in the array */
  amount0FilterIn?: string[];
  /** uint256 filter greater than */
  amount0FilterGt?: string;
  /** uint256 filter greater or equal */
  amount0FilterGe?: string;
  /** uint256 filter lower than */
  amount0FilterLt?: string;
  /** uint256 filter lower than */
  amount0FilterLe?: string;
  /** uint256 sort in ascending order */
  amount0SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount0SortDesc?: boolean;
  /** uint256 filter equal to */
  amount1?: string;
  /** uint256[] filter is in the array */
  amount1FilterIn?: string[];
  /** uint256 filter greater than */
  amount1FilterGt?: string;
  /** uint256 filter greater or equal */
  amount1FilterGe?: string;
  /** uint256 filter lower than */
  amount1FilterLt?: string;
  /** uint256 filter lower than */
  amount1FilterLe?: string;
  /** uint256 sort in ascending order */
  amount1SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount1SortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersDecreaseLiquiditysParams {
  /** uint256 indexed filter equal to */
  tokenId?: string;
  /** uint256[] indexed filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 indexed filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 indexed filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLe?: string;
  /** uint256 indexed sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 indexed sort in descending order */
  tokenIdSortDesc?: boolean;
  /** uint128 filter equal to */
  liquidity?: string;
  /** uint128[] filter is in the array */
  liquidityFilterIn?: string[];
  /** uint128 filter greater than */
  liquidityFilterGt?: string;
  /** uint128 filter greater or equal */
  liquidityFilterGe?: string;
  /** uint128 filter lower than */
  liquidityFilterLt?: string;
  /** uint128 filter lower than */
  liquidityFilterLe?: string;
  /** uint128 sort in ascending order */
  liquiditySortAsc?: boolean;
  /** uint128 sort in descending order */
  liquiditySortDesc?: boolean;
  /** uint256 filter equal to */
  amount0?: string;
  /** uint256[] filter is in the array */
  amount0FilterIn?: string[];
  /** uint256 filter greater than */
  amount0FilterGt?: string;
  /** uint256 filter greater or equal */
  amount0FilterGe?: string;
  /** uint256 filter lower than */
  amount0FilterLt?: string;
  /** uint256 filter lower than */
  amount0FilterLe?: string;
  /** uint256 sort in ascending order */
  amount0SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount0SortDesc?: boolean;
  /** uint256 filter equal to */
  amount1?: string;
  /** uint256[] filter is in the array */
  amount1FilterIn?: string[];
  /** uint256 filter greater than */
  amount1FilterGt?: string;
  /** uint256 filter greater or equal */
  amount1FilterGe?: string;
  /** uint256 filter lower than */
  amount1FilterLt?: string;
  /** uint256 filter lower than */
  amount1FilterLe?: string;
  /** uint256 sort in ascending order */
  amount1SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount1SortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersExtendedPositionsParams {
  /** uint256 filter equal to */
  tokenId?: string;
  /** uint256[] filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 filter lower or equal */
  tokenIdFilterLe?: string;
  /** uint256 sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 sort in descending order */
  tokenIdSortDesc?: boolean;
  /** address filter equal to */
  owner?: string;
  /** address[] filter is in the array */
  ownerFilterIn?: string[];
  /** address sort in ascending order */
  ownerSortAsc?: boolean;
  /** address sort in descending order */
  ownerSortDesc?: boolean;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersIncreaseLiquiditysParams {
  /** uint256 indexed filter equal to */
  tokenId?: string;
  /** uint256[] indexed filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 indexed filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 indexed filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLe?: string;
  /** uint256 indexed sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 indexed sort in descending order */
  tokenIdSortDesc?: boolean;
  /** uint128 filter equal to */
  liquidity?: string;
  /** uint128[] filter is in the array */
  liquidityFilterIn?: string[];
  /** uint128 filter greater than */
  liquidityFilterGt?: string;
  /** uint128 filter greater or equal */
  liquidityFilterGe?: string;
  /** uint128 filter lower than */
  liquidityFilterLt?: string;
  /** uint128 filter lower than */
  liquidityFilterLe?: string;
  /** uint128 sort in ascending order */
  liquiditySortAsc?: boolean;
  /** uint128 sort in descending order */
  liquiditySortDesc?: boolean;
  /** uint256 filter equal to */
  amount0?: string;
  /** uint256[] filter is in the array */
  amount0FilterIn?: string[];
  /** uint256 filter greater than */
  amount0FilterGt?: string;
  /** uint256 filter greater or equal */
  amount0FilterGe?: string;
  /** uint256 filter lower than */
  amount0FilterLt?: string;
  /** uint256 filter lower than */
  amount0FilterLe?: string;
  /** uint256 sort in ascending order */
  amount0SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount0SortDesc?: boolean;
  /** uint256 filter equal to */
  amount1?: string;
  /** uint256[] filter is in the array */
  amount1FilterIn?: string[];
  /** uint256 filter greater than */
  amount1FilterGt?: string;
  /** uint256 filter greater or equal */
  amount1FilterGe?: string;
  /** uint256 filter lower than */
  amount1FilterLt?: string;
  /** uint256 filter lower than */
  amount1FilterLe?: string;
  /** uint256 sort in ascending order */
  amount1SortAsc?: boolean;
  /** uint256 sort in descending order */
  amount1SortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersPositionsParams {
  /** uint256 filter equal to */
  tokenId?: string;
  /** uint256[] filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 filter lower or equal */
  tokenIdFilterLe?: string;
  /** uint256 sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 sort in descending order */
  tokenIdSortDesc?: boolean;
  /** address filter equal to */
  owner?: string;
  /** address[] filter is in the array */
  ownerFilterIn?: string[];
  /** address sort in ascending order */
  ownerSortAsc?: boolean;
  /** address sort in descending order */
  ownerSortDesc?: boolean;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

export interface GetByFiltersTransfersParams {
  /** address indexed filter equal to */
  from?: string;
  /** address[] indexed filter is in the array */
  fromFilterIn?: string[];
  /** address indexed sort in ascending order */
  fromSortAsc?: boolean;
  /** address indexed sort in descending order */
  fromSortDesc?: boolean;
  /** address indexed filter equal to */
  to?: string;
  /** address[] indexed filter is in the array */
  toFilterIn?: string[];
  /** address indexed sort in ascending order */
  toSortAsc?: boolean;
  /** address indexed sort in descending order */
  toSortDesc?: boolean;
  /** uint256 indexed filter equal to */
  tokenId?: string;
  /** uint256[] indexed filter is in the array */
  tokenIdFilterIn?: string[];
  /** uint256 indexed filter greater than */
  tokenIdFilterGt?: string;
  /** uint256 indexed filter greater or equal */
  tokenIdFilterGe?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLt?: string;
  /** uint256 indexed filter lower than */
  tokenIdFilterLe?: string;
  /** uint256 indexed sort in ascending order */
  tokenIdSortAsc?: boolean;
  /** uint256 indexed sort in descending order */
  tokenIdSortDesc?: boolean;
  /** event transaction hash filter equal to */
  txHash?: string;
  /** event transaction hash[] filter is in the array */
  txHashFilterIn?: string[];
  /**
   * event log index filter equal to
   * @format uint64
   */
  logIndex?: string;
  /**
   * event block number
   * @format uint64
   */
  blockNumber?: string;
  /** event block number: filter is in the array IndexedAt: */
  blockNumberFilterIn?: string[];
  /**
   * event block number: filter greater or equal
   * @format uint64
   */
  blockNumberFilterGe?: string;
  /**
   * event block number: filter lower than
   * @format uint64
   */
  blockNumberFilterLt?: string;
  /** event block number: sort in ascending order */
  blockNumberSortAsc?: boolean;
  /**
   * event block timestamp
   * @format int64
   */
  blockTs?: number;
  /**
   * event block timestamp: filter greater or equal
   * @format int64
   */
  blockTsFilterGe?: number;
  /**
   * event block timestamp: filter lower than
   * @format int64
   */
  blockTsFilterLt?: number;
  /** event block timestamp: sort in ascending order */
  blockTsSortAsc?: boolean;
  /** event block timestamp: sort in descending order */
  blockTsSortDesc?: boolean;
  /**
   * time event was added to indexer
   * @format int64
   */
  indexedAt?: number;
  /**
   * limit for filter
   * @format int64
   * @default 50
   */
  limit?: number;
  /**
   * offset for filter
   * @format int64
   * @default 0
   */
  offset?: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/api/v1",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Swiftscan-API project
 * @version 0.0.1
 * @baseUrl /api/v1
 *
 * The HTTP API Swiftscan Microservice serves as the main entry point  for all HTTP API requests, routing them to the appropriate internal microservices.  It provides a unified, read-only API interface, generated primarily from a Swagger  specification, following a specification-first approach.  The microservice is designed to handle various read-only endpoints,  aggregate responses, and ensure consistent performance and scalability.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  dashboard = {
    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetEventsDelayChartData
     * @summary Fetch the data for delay of events
     * @request GET:/dashboard/charts/delays
     * @response `200` `DashboardGraphEventsDelayStats` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetEventsDelayChartData: (
      query: DashboardGetEventsDelayChartDataParams,
      params: RequestParams = {},
    ) =>
      this.request<DashboardGraphEventsDelayStats, RpcStatus>({
        path: `/dashboard/charts/delays`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetDashboardEventTypes
     * @summary Check the event types stats
     * @request GET:/dashboard/charts/eventType
     * @response `200` `DashboardGraphEventTypesStats` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetDashboardEventTypes: (
      query: DashboardGetDashboardEventTypesParams,
      params: RequestParams = {},
    ) =>
      this.request<DashboardGraphEventTypesStats, RpcStatus>({
        path: `/dashboard/charts/eventType`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetEventsChartData
     * @summary Fetch the dashboard charts data for events
     * @request GET:/dashboard/charts/events
     * @response `200` `DashboardGraphEventsStats` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetEventsChartData: (
      query: DashboardGetEventsChartDataParams,
      params: RequestParams = {},
    ) =>
      this.request<DashboardGraphEventsStats, RpcStatus>({
        path: `/dashboard/charts/events`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetRealTimeLatencyChartData
     * @summary Fetch the dashboard charts data for real time latency
     * @request GET:/dashboard/charts/realTimeLatency
     * @response `200` `DashboardGraphRealTimeLatency` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetRealTimeLatencyChartData: (params: RequestParams = {}) =>
      this.request<DashboardGraphRealTimeLatency, RpcStatus>({
        path: `/dashboard/charts/realTimeLatency`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetRequestsChartData
     * @summary Fetch the dashboard charts data for requests
     * @request GET:/dashboard/charts/requests
     * @response `200` `DashboardGraphRequestsStats` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetRequestsChartData: (
      query: DashboardGetRequestsChartDataParams,
      params: RequestParams = {},
    ) =>
      this.request<DashboardGraphRequestsStats, RpcStatus>({
        path: `/dashboard/charts/requests`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetDashboardStatusCodes
     * @summary Check the request status code stats
     * @request GET:/dashboard/charts/statusCodes
     * @response `200` `DashboardGraphStatusCodesStats` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetDashboardStatusCodes: (
      query: DashboardGetDashboardStatusCodesParams,
      params: RequestParams = {},
    ) =>
      this.request<DashboardGraphStatusCodesStats, RpcStatus>({
        path: `/dashboard/charts/statusCodes`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetDashboardListEventTypes
     * @summary List the event types available
     * @request GET:/dashboard/eventTypes
     * @response `200` `DashboardEventTypes` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetDashboardListEventTypes: (params: RequestParams = {}) =>
      this.request<DashboardEventTypes, RpcStatus>({
        path: `/dashboard/eventTypes`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dashboard
     * @name DashboardGetDashboardSummary
     * @summary Check the stats summary
     * @request GET:/dashboard/summary
     * @response `200` `SummaryDashboard` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    dashboardGetDashboardSummary: (
      query: DashboardGetDashboardSummaryParams,
      params: RequestParams = {},
    ) =>
      this.request<SummaryDashboard, RpcStatus>({
        path: `/dashboard/summary`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  events = {
    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersApprovalForAlls
     * @request GET:/events/GetByFiltersApprovalForAlls
     * @response `200` `ModelsApprovalForAlls` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersApprovalForAlls: (
      query: GetByFiltersApprovalForAllsParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsApprovalForAlls, RpcStatus>({
        path: `/events/GetByFiltersApprovalForAlls`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersApprovals
     * @request GET:/events/GetByFiltersApprovals
     * @response `200` `ModelsApprovals` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersApprovals: (
      query: GetByFiltersApprovalsParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsApprovals, RpcStatus>({
        path: `/events/GetByFiltersApprovals`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersCollects
     * @request GET:/events/GetByFiltersCollects
     * @response `200` `ModelsCollects` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersCollects: (
      query: GetByFiltersCollectsParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsCollects, RpcStatus>({
        path: `/events/GetByFiltersCollects`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersDecreaseLiquiditys
     * @request GET:/events/GetByFiltersDecreaseLiquiditys
     * @response `200` `ModelsDecreaseLiquiditys` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersDecreaseLiquiditys: (
      query: GetByFiltersDecreaseLiquiditysParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsDecreaseLiquiditys, RpcStatus>({
        path: `/events/GetByFiltersDecreaseLiquiditys`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersExtendedPositions
     * @request GET:/events/GetByFiltersExtendedPositions
     * @response `200` `ModelsExtendedPositions` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersExtendedPositions: (
      query: GetByFiltersExtendedPositionsParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsExtendedPositions, RpcStatus>({
        path: `/events/GetByFiltersExtendedPositions`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersIncreaseLiquiditys
     * @request GET:/events/GetByFiltersIncreaseLiquiditys
     * @response `200` `ModelsIncreaseLiquiditys` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersIncreaseLiquiditys: (
      query: GetByFiltersIncreaseLiquiditysParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsIncreaseLiquiditys, RpcStatus>({
        path: `/events/GetByFiltersIncreaseLiquiditys`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersPositions
     * @request GET:/events/GetByFiltersPositions
     * @response `200` `ModelsPositions` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersPositions: (
      query: GetByFiltersPositionsParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsPositions, RpcStatus>({
        path: `/events/GetByFiltersPositions`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Idx1
     * @name GetByFiltersTransfers
     * @request GET:/events/GetByFiltersTransfers
     * @response `200` `ModelsTransfers` A successful response.
     * @response `default` `RpcStatus` An unexpected error response.
     */
    getByFiltersTransfers: (
      query: GetByFiltersTransfersParams,
      params: RequestParams = {},
    ) =>
      this.request<ModelsTransfers, RpcStatus>({
        path: `/events/GetByFiltersTransfers`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
}
