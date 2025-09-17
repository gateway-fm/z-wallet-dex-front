import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import {
  Field,
  forceExactInput,
  replaceSwapState,
  selectCurrency,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './actions'
import { queryParametersToSwapState } from './hooks'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId?: string | null
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId?: string | null
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  // tracks if currencies have been swapped to handle reverse logic
  readonly currenciesSwapped: boolean
}

export const initialState: SwapState = queryParametersToSwapState(parsedQueryString())

export default createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId ?? null,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId ?? null,
          },
          independentField: field,
          typedValue,
          recipient,
          currenciesSwapped: false,
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId },
        }
      }
    })
    .addCase(switchCurrencies, (state, { payload: { currentInputValue } }) => {
      return {
        ...state,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        typedValue: state.typedValue || currentInputValue || '1',
      }
    })
    .addCase(forceExactInput, (state) => {
      return {
        ...state,
        independentField: Field.INPUT,
        typedValue: '',
        currenciesSwapped: false,
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
