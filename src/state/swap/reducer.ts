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
    .addCase(
      switchCurrencies,
      (state, { payload: { newOutputHasTax, previouslyEstimatedOutput, currentInputValue } }) => {
        if (newOutputHasTax && state.independentField === Field.INPUT) {
          // To prevent swaps with FOT tokens as exact-outputs, we leave it as an exact-in swap and use the previously estimated output amount as the new exact-in amount.
          return {
            ...state,
            [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
            [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
            typedValue: previouslyEstimatedOutput,
          }
        }

        // Switch currencies and preserve the user-entered value by switching independent field
        // If user was entering INPUT, after switch they will be entering OUTPUT with their previous value
        // If user was entering OUTPUT, after switch they will be entering INPUT with their previous value
        const newIndependentField = state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
        const valueToKeep = state.independentField === Field.INPUT ? currentInputValue : state.typedValue

        return {
          ...state,
          independentField: newIndependentField,
          [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
          [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
          typedValue: valueToKeep,
        }
      }
    )
    .addCase(forceExactInput, (state) => {
      return {
        ...state,
        independentField: Field.INPUT,
        typedValue: '',
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
