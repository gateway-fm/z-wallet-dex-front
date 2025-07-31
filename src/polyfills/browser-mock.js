/* eslint-env node */
// Mock Browser object for libraries that expect it
// This is a polyfill for content-hash and similar libraries

const Browser = {
  T() {
    // Mock implementation that returns an empty object
    return {}
  },

  // Add other potential methods that might be needed
  decode() {
    return {}
  },

  encode() {
    return {}
  },
}

// Export for webpack ProvidePlugin
module.exports = Browser
