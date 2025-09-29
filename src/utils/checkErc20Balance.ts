import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import ERC20_ABI from 'abis/erc20.json'

interface Erc20BalanceResult {
  raw: BigNumber
  decimals: number
}

export async function checkErc20Balance(
  provider: JsonRpcProvider | Web3Provider,
  tokenAddress: string,
  account: string
): Promise<Erc20BalanceResult> {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider as any)
  const [balance, decimals]: [BigNumber, number] = await Promise.all([contract.balanceOf(account), contract.decimals()])
  console.debug('Check ERC20 balance', { raw: balance.toString(), decimals })
  return { raw: balance, decimals }
}
