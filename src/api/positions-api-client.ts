/* eslint-disable import/no-unused-modules */

import axios, { AxiosInstance, AxiosResponse } from 'axios'

import { POSITIONS_API_CONFIG } from '../config/positions-api'
import {
  PositionsApiCollectsResponse,
  PositionsApiDecreaseLiquidityResponse,
  PositionsApiIncreaseLiquidityResponse,
  PositionsApiPositionsResponse,
  PositionsApiTransfersResponse,
} from './positions-api-types'
import {
  GetByFiltersCollectsParams,
  GetByFiltersDecreaseLiquiditysParams,
  GetByFiltersIncreaseLiquiditysParams,
  GetByFiltersPositionsParams,
  GetByFiltersTransfersParams,
} from './PositionsApi'

export class PositionsApiClient {
  private axiosInstance: AxiosInstance

  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      baseURL: baseURL || POSITIONS_API_CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get positions by filters
   */
  async getPositions(params: GetByFiltersPositionsParams = {}): Promise<PositionsApiPositionsResponse> {
    const response: AxiosResponse<PositionsApiPositionsResponse> = await this.axiosInstance.get(
      '/events/GetByFiltersPositions',
      { params }
    )
    return response.data
  }

  /**
   * Get positions by owner address
   */
  async getPositionsByOwner(owner: string, limit = 100): Promise<PositionsApiPositionsResponse> {
    return this.getPositions({
      owner,
      limit,
      tokenIdSortDesc: true,
    })
  }

  /**
   * Get position by token ID
   */
  async getPositionByTokenId(tokenId: string): Promise<PositionsApiPositionsResponse> {
    return this.getPositions({
      tokenId,
      limit: 1,
    })
  }

  /**
   * Get collect events by filters
   */
  async getCollects(params: GetByFiltersCollectsParams = {}): Promise<PositionsApiCollectsResponse> {
    const response: AxiosResponse<PositionsApiCollectsResponse> = await this.axiosInstance.get(
      '/events/GetByFiltersCollects',
      { params }
    )
    return response.data
  }

  /**
   * Get collect events by token ID
   */
  async getCollectsByTokenId(tokenId: string, limit = 100): Promise<PositionsApiCollectsResponse> {
    return this.getCollects({
      tokenId,
      limit,
      tokenIdSortDesc: true,
    })
  }

  /**
   * Get transfer events by filters
   */
  async getTransfers(params: GetByFiltersTransfersParams = {}): Promise<PositionsApiTransfersResponse> {
    const response: AxiosResponse<PositionsApiTransfersResponse> = await this.axiosInstance.get(
      '/events/GetByFiltersTransfers',
      { params }
    )
    return response.data
  }

  /**
   * Get transfer events by token ID
   */
  async getTransfersByTokenId(tokenId: string, limit = 100): Promise<PositionsApiTransfersResponse> {
    return this.getTransfers({
      tokenId,
      limit,
      tokenIdSortDesc: true,
    })
  }

  /**
   * Get increase liquidity events by filters
   */
  async getIncreaseLiquidity(
    params: GetByFiltersIncreaseLiquiditysParams = {}
  ): Promise<PositionsApiIncreaseLiquidityResponse> {
    const response: AxiosResponse<PositionsApiIncreaseLiquidityResponse> = await this.axiosInstance.get(
      '/events/GetByFiltersIncreaseLiquiditys',
      { params }
    )
    return response.data
  }

  /**
   * Get decrease liquidity events by filters
   */
  async getDecreaseLiquidity(
    params: GetByFiltersDecreaseLiquiditysParams = {}
  ): Promise<PositionsApiDecreaseLiquidityResponse> {
    const response: AxiosResponse<PositionsApiDecreaseLiquidityResponse> = await this.axiosInstance.get(
      '/events/GetByFiltersDecreaseLiquiditys',
      { params }
    )
    return response.data
  }
}

// Default instance
export const positionsApiClient = new PositionsApiClient()
