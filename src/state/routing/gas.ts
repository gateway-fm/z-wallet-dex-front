import type { JsonRpcProvider } from '@ethersproject/providers'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Currency } from '@uniswap/sdk-core'
import ERC20_ABI from 'abis/erc20.json'
import { Erc20 } from 'abis/types'
import { getContract } from 'utils'

import { ApproveInfo } from './types'

export async function getApproveInfo(
  account: string | undefined,
  currency: Currency,
  amount: string,
  provider: JsonRpcProvider
): Promise<ApproveInfo> {
  // native currencies do not need token approvals
  if (currency.isNative) return { needsApprove: false }

  // If any of these arguments aren't provided, then we cannot generate approval cost info
  if (!account) return { needsApprove: false }

  const tokenContract = getContract(currency.address, ERC20_ABI, provider) as Erc20

  try {
    const allowance = await tokenContract.callStatic.allowance(account, PERMIT2_ADDRESS)
    if (!allowance.lt(amount)) return { needsApprove: false }
  } catch (_) {
    // If contract lookup fails (eg if Infura goes down), then don't show approval info
    return { needsApprove: false }
  }

  // NOTE: No gas fees in this DEX solution
  return { needsApprove: true, approveGasEstimateUSD: 0 }
}
