import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import OwnershipWarning from 'components/addLiquidity/OwnershipWarning'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { isSupportedChain, ZEPHYR_CHAIN_ID } from 'constants/chains'
import usePrevious from 'hooks/usePrevious'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { ApprovalState } from 'lib/hooks/useApproval'
import { BodyWrapper } from 'pages/AppBody'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'

import { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from '../../components/Button'
import { BlueCard, OutlineCard, YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import FeeSelector from '../../components/FeeSelector'
import HoverInlineText from '../../components/HoverInlineText'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { PositionPreview } from '../../components/PositionPreview'
import RangeSelector from '../../components/RangeSelector'
import PresetsButtons from '../../components/RangeSelector/PresetsButtons'
import RateToggle from '../../components/RateToggle'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '../../constants/addresses'
import { ZERO_PERCENT } from '../../constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { calculateOneToOneSqrtPriceX96 } from '../../constants/zephyr'
import { useCurrency } from '../../hooks/Tokens'
import { useApproveCallback } from '../../hooks/useApproveCallback'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { useDerivedPositionInfo } from '../../hooks/useDerivedPositionInfo'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useStablecoinValue } from '../../hooks/useStablecoinPrice'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { useZephyrNFTOwner } from '../../hooks/useZephyrNFTOwner'
import { Bound, Field } from '../../state/mint/v3/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Dots } from '../Pool/styled'
import { Review } from './Review'
import { DynamicSection, MediumOnly, ResponsiveTwoColumns, ScrollablePage, StyledInput, Wrapper } from './styled'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

const StyledBodyWrapper = styled(BodyWrapper)<{
  $hasExistingPosition: boolean
}>`
  padding: ${({ $hasExistingPosition }) => ($hasExistingPosition ? '10px' : 0)};
  max-width: 640px;
`

export default function AddLiquidityWrapper() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <AddLiquidity />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function AddLiquidity() {
  const navigate = useNavigate()
  const {
    currencyIdA,
    currencyIdB,
    feeAmount: feeAmountFromUrl,
    tokenId,
  } = useParams<{
    currencyIdA?: string
    currencyIdB?: string
    feeAmount?: string
    tokenId?: string
  }>()
  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()

  const toggleWalletDrawer = useToggleAccountDrawer() // toggle wallet when disconnected
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  // check for existing position if tokenId in url
  const parsedTokenId = useMemo(() => (tokenId ? BigNumber.from(tokenId) : undefined), [tokenId])
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(parsedTokenId)
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  // TODO: Remove mock fee once we have a proper API
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : chainId === ZEPHYR_CHAIN_ID
      ? FeeAmount.HIGH // TODO: change to MEDIUM once we have a proper API?
      : undefined

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    pricesAtLimit,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useStablecoinValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useStablecoinValue(parsedAmounts[Field.CURRENCY_B]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = useMemo(
    () =>
      [Field.CURRENCY_A, Field.CURRENCY_B].reduce((accumulator, field) => {
        return {
          ...accumulator,
          [field]: maxAmountSpend(currencyBalances[field]),
        }
      }, {}),
    [currencyBalances]
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = useMemo(
    () =>
      [Field.CURRENCY_A, Field.CURRENCY_B].reduce((accumulator, field) => {
        return {
          ...accumulator,
          [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
        }
      }, {}),
    [maxAmounts, parsedAmounts]
  )

  const argentWalletContract = useArgentWalletContract()

  // Standard NonfungiblePositionManager approval for all networks including Zephyr
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  const finalApprovalA = approvalA
  const finalApprovalB = approvalB

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  )

  const onAdd = useCallback(async () => {
    setShowConfirm(true)
    setAttemptingTxn(true)
    setTxHash('')

    try {
      if (position && account && deadline) {
        if (!positionManager || !baseCurrency || !quoteCurrency) {
          setAttemptingTxn(false)
          return
        }

        const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

        // Check if pool exists in factory before proceeding
        if (provider && positionManager) {
          try {
            const pmContract = new Contract(
              positionManager.address,
              ['function factory() view returns (address)'],
              provider
            )
            const factoryAddress = await pmContract.factory()

            const factoryContract = new Contract(
              factoryAddress,
              [
                'function getPool(address,address,uint24) view returns (address)',
                'function owner() view returns (address)',
                'function createPool(address,address,uint24) external returns (address)',
              ],
              provider.getSigner()
            )

            const token0Address = position.pool.token0.address
            const token1Address = position.pool.token1.address
            const fee = position.pool.fee

            let poolAddress = await factoryContract.getPool(token0Address, token1Address, fee)

            if (poolAddress === '0x0000000000000000000000000000000000000000') {
              // Pool does not exist on the factory, create it
              const createPoolTx = await factoryContract.createPool(token0Address, token1Address, fee)
              await createPoolTx.wait()

              // Get the pool address after creation
              poolAddress = await factoryContract.getPool(token0Address, token1Address, fee)

              // Set initial price for the pool
              const initializePoolContract = new Contract(
                poolAddress,
                ['function initialize(uint160 sqrtPriceX96) external'],
                provider.getSigner()
              )

              const initialSqrtPriceX96 = calculateOneToOneSqrtPriceX96(position.pool.token0, position.pool.token1)
              const initializeTx = await initializePoolContract.initialize(initialSqrtPriceX96)
              await initializeTx.wait()
            }
          } catch (poolCheckError) {
            console.warn('Failed to check/create pool:', poolCheckError)
            // Continue with the original transaction even if pool check fails
          }
        }

        const { calldata, value } = hasExistingPosition
          ? NonfungiblePositionManager.addCallParameters(position, {
              slippageTolerance: allowedSlippage,
              recipient: account,
              deadline: deadline.toString(),
              useNative,
              createPool: noLiquidity,
            })
          : NonfungiblePositionManager.addCallParameters(position, {
              slippageTolerance: allowedSlippage,
              recipient: account,
              deadline: deadline.toString(),
              useNative,
              createPool: noLiquidity,
            })

        const txn = {
          to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId ?? 1],
          data: calldata,
          value,
        }

        if (!provider) {
          setAttemptingTxn(false)
          return
        }

        const response = await provider.getSigner().sendTransaction({
          ...txn,
          gasLimit: 1000000,
        })

        setAttemptingTxn(false)
        setTxHash(response.hash)
        addTransaction(response, {
          type: TransactionType.ADD_LIQUIDITY_V3_POOL,
          baseCurrencyId: currencyId(baseCurrency),
          quoteCurrencyId: currencyId(quoteCurrency),
          createPool: Boolean(noLiquidity),
          expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
          expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
          feeAmount: position.pool.fee,
        })
      }
    } catch (error) {
      setAttemptingTxn(false)
      setTxHash('')
      setShowConfirm(false)
    }
  }, [
    position,
    account,
    deadline,
    positionManager,
    baseCurrency,
    quoteCurrency,
    provider,
    hasExistingPosition,
    allowedSlippage,
    noLiquidity,
    chainId,
    addTransaction,
    parsedAmounts,
  ])

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth (Zephyr has no native currency)
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (chainId !== undefined && currencyIdNew === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (chainId !== undefined && currencyIdOther === WRAPPED_NATIVE_CURRENCY[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId]
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/add/${idA}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/add/${idB}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setAttemptingTxn(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/pools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    navigate(`/add`)
  }, [navigate, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, feeAmount, tickLower, tickUpper, pool)

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && finalApprovalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && finalApprovalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = <Trans>Adding liquidity...</Trans>

  const [searchParams, setSearchParams] = useSearchParams()

  const handleSetFullRange = useCallback(() => {
    getSetFullRange()

    const minPrice = pricesAtLimit[Bound.LOWER]
    if (minPrice) searchParams.set('minPrice', minPrice.toSignificant(5))
    const maxPrice = pricesAtLimit[Bound.UPPER]
    if (maxPrice) searchParams.set('maxPrice', maxPrice.toSignificant(5))
    setSearchParams(searchParams)
  }, [getSetFullRange, pricesAtLimit, searchParams, setSearchParams])

  // START: sync values with query string
  const oldSearchParams = usePrevious(searchParams)
  // use query string as an input to onInput handlers
  useEffect(() => {
    const minPrice = searchParams.get('minPrice')
    const oldMinPrice = oldSearchParams?.get('minPrice')
    if (
      minPrice &&
      typeof minPrice === 'string' &&
      !isNaN(minPrice as any) &&
      (!oldMinPrice || oldMinPrice !== minPrice)
    ) {
      onLeftRangeInput(minPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  useEffect(() => {
    const maxPrice = searchParams.get('maxPrice')
    const oldMaxPrice = oldSearchParams?.get('maxPrice')
    if (
      maxPrice &&
      typeof maxPrice === 'string' &&
      !isNaN(maxPrice as any) &&
      (!oldMaxPrice || oldMaxPrice !== maxPrice)
    ) {
      onRightRangeInput(maxPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // END: sync values with query string

  const buttons = useMemo(
    () =>
      addIsUnsupported ? (
        <ButtonPrimary disabled={true} $borderRadius="12px" padding="12px">
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Unsupported Asset</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
      ) : !account ? (
        <ButtonLight onClick={toggleWalletDrawer} $borderRadius="12px" padding="12px">
          <Trans>Connect wallet</Trans>
        </ButtonLight>
      ) : (
        <AutoColumn gap="md">
          {(finalApprovalA === ApprovalState.NOT_APPROVED ||
            finalApprovalA === ApprovalState.PENDING ||
            finalApprovalB === ApprovalState.NOT_APPROVED ||
            finalApprovalB === ApprovalState.PENDING) &&
            isValid && (
              <RowBetween>
                {showApprovalA && (
                  <ButtonPrimary
                    onClick={approveACallback}
                    disabled={finalApprovalA === ApprovalState.PENDING}
                    width={showApprovalB ? '48%' : '100%'}
                  >
                    {finalApprovalA === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                      </Dots>
                    ) : (
                      <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    )}
                  </ButtonPrimary>
                )}
                {showApprovalB && (
                  <ButtonPrimary
                    onClick={approveBCallback}
                    disabled={finalApprovalB === ApprovalState.PENDING}
                    width={showApprovalA ? '48%' : '100%'}
                  >
                    {finalApprovalB === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                      </Dots>
                    ) : (
                      <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    )}
                  </ButtonPrimary>
                )}
              </RowBetween>
            )}
          <ButtonError
            onClick={() => {
              setShowConfirm(true)
            }}
            disabled={
              attemptingTxn ||
              !isValid ||
              (!argentWalletContract && finalApprovalA !== ApprovalState.APPROVED && !depositADisabled) ||
              (!argentWalletContract && finalApprovalB !== ApprovalState.APPROVED && !depositBDisabled) ||
              priceLower === undefined ||
              priceUpper === undefined
            }
            error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
          >
            <Text fontWeight={535}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
          </ButtonError>
        </AutoColumn>
      ),
    [
      addIsUnsupported,
      account,
      toggleWalletDrawer,
      finalApprovalA,
      finalApprovalB,
      isValid,
      showApprovalA,
      showApprovalB,
      approveACallback,
      approveBCallback,
      currencies,
      attemptingTxn,
      argentWalletContract,
      depositADisabled,
      depositBDisabled,
      priceLower,
      priceUpper,
      parsedAmounts,
      errorMessage,
    ]
  )

  const usdcValueCurrencyA = usdcValues[Field.CURRENCY_A]
  const usdcValueCurrencyB = usdcValues[Field.CURRENCY_B]
  const currencyAFiat = useMemo(
    () => ({
      data: usdcValueCurrencyA ? parseFloat(usdcValueCurrencyA.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyA]
  )
  const currencyBFiat = useMemo(
    () => ({
      data: usdcValueCurrencyB ? parseFloat(usdcValueCurrencyB.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyB]
  )

  // Get NFT owner with proper Zephyr support
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID
  const zephyrOwner = useZephyrNFTOwner(isZephyrNetwork && parsedTokenId ? parsedTokenId : undefined)
  const standardOwner = useSingleCallResult(!isZephyrNetwork && parsedTokenId ? positionManager : null, 'ownerOf', [
    parsedTokenId,
  ]).result?.[0]

  const owner = isZephyrNetwork ? zephyrOwner : standardOwner
  const ownsNFT =
    addressesAreEquivalent(owner, account) || addressesAreEquivalent(existingPositionDetails?.operator, account)
  const showOwnershipWarning = Boolean(hasExistingPosition && account && !ownsNFT)

  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          reviewContent={() => (
            <ConfirmationModalContent
              title={<Trans>Add Liquidity</Trans>}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <ButtonPrimary
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    onAdd()
                  }}
                  disabled={attemptingTxn}
                >
                  <Text fontWeight={535} fontSize={20}>
                    <Trans>Add</Trans>
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />
        <StyledBodyWrapper $hasExistingPosition={hasExistingPosition}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            positionID={tokenId}
            autoSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={!hasExistingPosition}
          >
            {!hasExistingPosition && (
              <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                <MediumOnly>
                  <ButtonText onClick={clearAll}>
                    <ThemedText.DeprecatedBlue fontSize="12px">
                      <Trans>Clear all</Trans>
                    </ThemedText.DeprecatedBlue>
                  </ButtonText>
                </MediumOnly>
              </Row>
            )}
          </AddRemoveTabs>
          <Wrapper>
            <ResponsiveTwoColumns wide={!hasExistingPosition}>
              <AutoColumn gap="lg">
                {!hasExistingPosition && (
                  <>
                    <AutoColumn gap="md">
                      <RowBetween paddingBottom="20px">
                        <ThemedText.DeprecatedLabel>
                          <Trans>Select pair</Trans>
                        </ThemedText.DeprecatedLabel>
                      </RowBetween>
                      <RowBetween gap="md">
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onFieldAInput}
                          hideInput
                          onMax={() => {
                            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                          }}
                          onCurrencySelect={handleCurrencyASelect}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                          currency={currencies[Field.CURRENCY_A] ?? null}
                          id="add-liquidity-input-tokena"
                          showCommonBases
                        />

                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_B]}
                          hideInput
                          onUserInput={onFieldBInput}
                          onCurrencySelect={handleCurrencyBSelect}
                          onMax={() => {
                            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                          currency={currencies[Field.CURRENCY_B] ?? null}
                          id="add-liquidity-input-tokenb"
                          showCommonBases
                        />
                      </RowBetween>

                      <FeeSelector
                        disabled={!quoteCurrency || !baseCurrency}
                        feeAmount={feeAmount}
                        handleFeePoolSelect={handleFeePoolSelect}
                      />
                    </AutoColumn>{' '}
                  </>
                )}
                {hasExistingPosition && existingPosition && (
                  <PositionPreview
                    position={existingPosition}
                    title={<Trans>Selected range</Trans>}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  />
                )}
              </AutoColumn>

              {!hasExistingPosition && (
                <>
                  <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
                    <RowBetween>
                      <ThemedText.DeprecatedLabel>
                        <Trans>Set price range</Trans>
                      </ThemedText.DeprecatedLabel>

                      {Boolean(baseCurrency && quoteCurrency) && (
                        <RowFixed gap="8px">
                          <PresetsButtons onSetFullRange={handleSetFullRange} />
                          <RateToggle
                            currencyA={baseCurrency as Currency}
                            currencyB={quoteCurrency as Currency}
                            handleRateToggle={() => {
                              if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                                onLeftRangeInput(
                                  (invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? ''
                                )
                                onRightRangeInput(
                                  (invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? ''
                                )
                                onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                              }
                              navigate(
                                `/add/${currencyIdB as string}/${currencyIdA as string}${
                                  feeAmount ? '/' + feeAmount : ''
                                }`
                              )
                            }}
                          />
                        </RowFixed>
                      )}
                    </RowBetween>

                    <RangeSelector
                      priceLower={priceLower}
                      priceUpper={priceUpper}
                      getDecrementLower={getDecrementLower}
                      getIncrementLower={getIncrementLower}
                      getDecrementUpper={getDecrementUpper}
                      getIncrementUpper={getIncrementUpper}
                      onLeftRangeInput={onLeftRangeInput}
                      onRightRangeInput={onRightRangeInput}
                      currencyA={baseCurrency}
                      currencyB={quoteCurrency}
                      feeAmount={feeAmount}
                      ticksAtLimit={ticksAtLimit}
                    />

                    {outOfRange && (
                      <YellowCard padding="8px 12px" $borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                          <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                            <Trans>
                              Your position will not earn fees or be used in trades until the market price moves into
                              your range.
                            </Trans>
                          </ThemedText.DeprecatedYellow>
                        </RowBetween>
                      </YellowCard>
                    )}

                    {invalidRange && (
                      <YellowCard padding="8px 12px" $borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                          <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                            <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                          </ThemedText.DeprecatedYellow>
                        </RowBetween>
                      </YellowCard>
                    )}
                  </DynamicSection>

                  <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
                    {!noLiquidity ? (
                      <>
                        {Boolean(price && baseCurrency && quoteCurrency && !noLiquidity) && (
                          <AutoColumn gap="2px" style={{ marginTop: '0.5rem' }}>
                            <Trans>
                              <ThemedText.DeprecatedMain fontWeight={535} fontSize={12} color="text1">
                                Current price:
                              </ThemedText.DeprecatedMain>
                              <ThemedText.DeprecatedBody fontWeight={535} fontSize={20} color="text1">
                                {price && (
                                  <HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                                  />
                                )}
                              </ThemedText.DeprecatedBody>
                              {baseCurrency && (
                                <ThemedText.DeprecatedBody color="text2" fontSize={12}>
                                  {quoteCurrency?.symbol} per {baseCurrency.symbol}
                                </ThemedText.DeprecatedBody>
                              )}
                            </Trans>
                          </AutoColumn>
                        )}
                      </>
                    ) : (
                      <AutoColumn gap="md">
                        {noLiquidity && (
                          <BlueCard
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: '1rem 1rem',
                            }}
                          >
                            <ThemedText.DeprecatedBody
                              fontSize={14}
                              style={{ fontWeight: 535 }}
                              textAlign="left"
                              color={theme.accent1}
                            >
                              <Trans>
                                This pool must be initialized before you can add liquidity. To initialize, select a
                                starting price for the pool. Then, enter your liquidity price range and deposit amount.
                                Gas fees will be higher than usual due to the initialization transaction.
                              </Trans>
                            </ThemedText.DeprecatedBody>
                          </BlueCard>
                        )}
                        <OutlineCard padding="12px">
                          <StyledInput
                            className="start-price-input"
                            value={startPriceTypedValue}
                            onUserInput={onStartPriceInput}
                          />
                        </OutlineCard>
                        <RowBetween
                          style={{
                            backgroundColor: theme.surface1,
                            padding: '12px',
                            borderRadius: '12px',
                          }}
                        >
                          <ThemedText.DeprecatedMain>
                            <Trans>Starting {baseCurrency?.symbol} Price:</Trans>
                          </ThemedText.DeprecatedMain>
                          <ThemedText.DeprecatedMain>
                            {price ? (
                              <ThemedText.DeprecatedMain>
                                <RowFixed>
                                  <HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price?.invert()?.toSignificant(8) : price?.toSignificant(8)}
                                  />{' '}
                                  <span style={{ marginLeft: '4px' }}>
                                    {quoteCurrency?.symbol} per {baseCurrency?.symbol}
                                  </span>
                                </RowFixed>
                              </ThemedText.DeprecatedMain>
                            ) : (
                              '-'
                            )}
                          </ThemedText.DeprecatedMain>
                        </RowBetween>
                      </AutoColumn>
                    )}
                  </DynamicSection>
                </>
              )}
              <div>
                <DynamicSection disabled={invalidPool || invalidRange || (noLiquidity && !startPriceTypedValue)}>
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedLabel>
                      {hasExistingPosition ? <Trans>Add more liquidity</Trans> : <Trans>Deposit amounts</Trans>}
                    </ThemedText.DeprecatedLabel>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A] ?? null}
                      id="add-liquidity-input-tokena"
                      fiatValue={currencyAFiat}
                      showCommonBases
                      locked={depositADisabled}
                    />

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      fiatValue={currencyBFiat}
                      currency={currencies[Field.CURRENCY_B] ?? null}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                      locked={depositBDisabled}
                    />
                  </AutoColumn>
                </DynamicSection>
              </div>
              {buttons}
            </ResponsiveTwoColumns>
          </Wrapper>
        </StyledBodyWrapper>
        {showOwnershipWarning && <OwnershipWarning ownerAddress={owner} />}
        {addIsUnsupported && (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
