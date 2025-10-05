/**
 * Exponential Backoff Retry Handler
 * Retries failed requests with exponentially increasing delays
 */
class RetryHandler {
  constructor(maxRetries = 3, initialDelay = 1000) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
  }

  /**
   * Calculate delay using exponential backoff with jitter
   * @param {number} attempt - Current retry attempt (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    // Exponential backoff: initialDelay * 2^attempt
    const exponentialDelay = this.initialDelay * Math.pow(2, attempt);
    
    // Add jitter (random factor) to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    
    return exponentialDelay + jitter;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  isRetryableError(error) {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;
    
    // Retry on:
    // - 408 Request Timeout
    // - 429 Too Many Requests
    // - 500+ Server errors
    return status === 408 || status === 429 || status >= 500;
  }


  async executeWithRetry(fn, context = 'Operation') {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${context} - Attempt ${attempt + 1}/${this.maxRetries + 1}`);
        
        const result = await fn();
        
        if (attempt > 0) {
          console.log(`✅ ${context} succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          console.error(`${context} failed after ${this.maxRetries + 1} attempts`);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          console.error(`${context} failed with non-retryable error`);
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`${context} failed, retrying in ${Math.round(delay)}ms...`);
        console.log(`Error: ${error.message}`);
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryHandler;