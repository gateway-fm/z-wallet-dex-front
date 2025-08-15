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

export enum RouteType {
  Input = "input",
  Output = "output",
}

export interface BestRouteResp {
  route: Route;
  type: RouteType;
  /** @format bigInt */
  amount_quoted: string;
}

export interface Calldata {
  /** @format hex */
  data: string;
  /** @format bigInt */
  amount: string;
}

export interface CalldataReq {
  route: Route;
  route_type: RouteType;
  /** @format address */
  recipient: string;
  /** @format bigInt */
  amount: string;
  /** @format int64 */
  slippage: number;
  /** @format int64 */
  deadline: number;
}

export interface Error {
  /** @example 404 */
  code: number;
  /** @example "requested data not found" */
  message: string;
}

export interface RefPrice {
  base_token: Token;
  stable_token: Token;
}

export interface Route {
  /** Encoded Route */
  encoded: string;
}

export interface Token {
  /** @format address */
  address: string;
  symbol: string;
  name: string;
  /** @format int64 */
  decimals: number;
  /** @format float */
  volume_usd: string;
  /** @format float */
  derived_base: string;
}

export interface TokenResp {
  ref_price: RefPrice;
  data: Token;
}

export type Tokens = Token[];

export interface TokensList {
  ref_price: RefPrice;
  data: Tokens;
  /** @format int64 */
  page: number;
  /** @format int64 */
  per_page: number;
  /** @format int64 */
  total_pages: number;
  /** @format int64 */
  total_items: number;
}

export interface TokensResp {
  ref_price: RefPrice;
  data: Tokens;
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
 * @title SWAP-API
 * @version 0.0.1
 * @baseUrl /api/v1
 *
 * API Gateway microservice for the SWAP project serves as the main entry point for all HTTP API requests, routing them to the appropriate internal microservices.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  health = {
    /**
     * @description Health check
     *
     * @tags Health
     * @name HealthCheck
     * @summary Health Check
     * @request GET:/health
     * @response `200` `void` OK
     * @response `500` `Error` Internal service error
     */
    healthCheck: (params: RequestParams = {}) =>
      this.request<void, Error>({
        path: `/health`,
        method: "GET",
        ...params,
      }),
  };
  routing = {
    /**
     * @description Get Best Route for given Tokens
     *
     * @tags Routing
     * @name BestRoute
     * @summary Get Best Route
     * @request GET:/routing/route
     * @response `200` `BestRouteResp` OK
     * @response `400` `Error` Invalid Params
     * @response `404` `Error` Route Not Found
     * @response `500` `Error` Internal service error
     */
    bestRoute: (
      query: {
        tknA: string;
        tknB: string;
        amount: string;
        routeType: "input" | "output";
      },
      params: RequestParams = {},
    ) =>
      this.request<BestRouteResp, Error>({
        path: `/routing/route`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get Calldata For Given Route
     *
     * @tags Routing
     * @name GetCalldata
     * @summary Get Calldata
     * @request POST:/routing/tx
     * @response `200` `Calldata` OK
     * @response `400` `Error` Invalid Route
     * @response `500` `Error` Internal service error
     */
    getCalldata: (CalldataReq: CalldataReq, params: RequestParams = {}) =>
      this.request<Calldata, Error>({
        path: `/routing/tx`,
        method: "POST",
        body: CalldataReq,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  tokens = {
    /**
     * @description List all tokens with pagination
     *
     * @tags Tokens
     * @name ListTokens
     * @summary List Tokens
     * @request GET:/tokens
     * @response `200` `TokensList` Tokens List
     * @response `500` `Error` Internal service error
     */
    listTokens: (
      query: {
        /** @format int64 */
        page: number;
        /** @format int64 */
        per_page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<TokensList, Error>({
        path: `/tokens`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Search Token By Name Or Symbol
     *
     * @tags Tokens
     * @name SearchToken
     * @summary Search Token
     * @request GET:/tokens/search
     * @response `200` `TokensResp` Tokens
     * @response `500` `Error` Internal service error
     */
    searchToken: (
      query: {
        q: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<TokensResp, Error>({
        path: `/tokens/search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get Token by address
     *
     * @tags Tokens
     * @name GetToken
     * @summary Get Token
     * @request GET:/tokens/{address}
     * @response `200` `TokenResp` Token
     * @response `400` `Error` Invalid Address
     * @response `404` `Error` Token Not Found
     * @response `500` `Error` Internal service error
     */
    getToken: (address: string, params: RequestParams = {}) =>
      this.request<TokenResp, Error>({
        path: `/tokens/${address}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
