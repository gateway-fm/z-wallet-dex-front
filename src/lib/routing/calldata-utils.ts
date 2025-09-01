/**
 * Utility functions for working with calldata
 */

/**
 * Extracts recipient address from exactInput calldata
 * @param callData The hex calldata string
 * @returns The recipient address or null if not found
 */
export function extractRecipientFromCalldata(callData: string): string | null {
  try {
    // Remove 0x prefix if present
    const cleanData = callData.startsWith('0x') ? callData.slice(2) : callData

    // exactInput signature is b858183f followed by encoded parameters
    if (!cleanData.startsWith('b858183f')) {
      return null
    }

    // Skip function selector (4 bytes = 8 hex chars)
    // Skip offset to params struct (32 bytes = 64 hex chars)
    // Skip path length offset (32 bytes = 64 hex chars)
    // The recipient is at position 136-200 (64 hex chars)
    const recipientStart = 8 + 64 + 64
    const recipientEnd = recipientStart + 64

    if (cleanData.length < recipientEnd) {
      return null
    }

    const recipientHex = cleanData.slice(recipientStart, recipientEnd)

    // Remove leading zeros and add 0x prefix
    const recipient = '0x' + recipientHex.slice(24) // Remove first 24 chars (12 bytes of zeros)

    return recipient
  } catch (error) {
    console.error('Error extracting recipient from calldata:', error)
    return null
  }
}

/**
 * Replaces recipient in exactInput calldata
 * @param callData The original hex calldata string
 * @param newRecipient The new recipient address
 * @returns The updated calldata or original if replacement failed
 */
export function replaceRecipientInCalldata(callData: string, newRecipient: string): string {
  try {
    // Remove 0x prefix if present
    const cleanData = callData.startsWith('0x') ? callData.slice(2) : callData
    const cleanRecipient = newRecipient.startsWith('0x') ? newRecipient.slice(2) : newRecipient

    // Validate recipient format
    if (cleanRecipient.length !== 40) {
      console.error('Invalid recipient address length')
      return callData
    }

    // exactInput signature is b858183f
    if (!cleanData.startsWith('b858183f')) {
      console.error('Not an exactInput calldata')
      return callData
    }

    // Calculate recipient position in calldata
    const recipientStart = 8 + 64 + 64 // function selector + offset + path offset
    const recipientEnd = recipientStart + 64

    if (cleanData.length < recipientEnd) {
      console.error('Calldata too short')
      return callData
    }

    // Pad recipient to 32 bytes (64 hex chars) with leading zeros
    const paddedRecipient = cleanRecipient.toLowerCase().padStart(64, '0')

    // Replace recipient in calldata
    const newCallData = cleanData.slice(0, recipientStart) + paddedRecipient + cleanData.slice(recipientEnd)

    return '0x' + newCallData
  } catch (error) {
    console.error('Error replacing recipient in calldata:', error)
    return callData
  }
}
