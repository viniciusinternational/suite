import * as amqp from 'amqplib';

// Global connection cache (singleton pattern)
const globalForRabbitMQ = globalThis as unknown as {
  connection: amqp.Connection | undefined;
  confirmChannel: amqp.ConfirmChannel | undefined;
  connectionPromise: Promise<amqp.Connection> | undefined;
  channelPromise: Promise<amqp.ConfirmChannel> | undefined;
};

// Configuration constants
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const PUBLISH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second

// Get RabbitMQ connection URL from environment
function getRabbitMQUrl(): string {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error('RABBITMQ_URL environment variable is not set');
  }
  return url;
}

// Get queue name from environment
function getQueueName(): string {
  const queueName = process.env.RABBITMQ_QUEUE_NAME;
  if (!queueName) {
    throw new Error('RABBITMQ_QUEUE_NAME environment variable is not set');
  }
  return queueName;
}

// Check if connection is still open
// Note: This is a best-effort check. Actual operations will handle closed connections.
function isConnectionOpen(connection: amqp.Connection): boolean {
  if (!connection) return false;
  try {
    // Check if the underlying socket connection exists and is not destroyed
    const socket = (connection as any).connection;
    if (!socket) return false;
    // Check if socket is destroyed or in a bad state
    return !socket.destroyed && socket.readable !== false;
  } catch {
    return false;
  }
}

// Check if channel is still open
// Note: This is a best-effort check. Actual operations will handle closed channels.
// We rely on the actual publish operation to fail if channel is closed.
function isChannelOpen(channel: amqp.ConfirmChannel): boolean {
  if (!channel) return false;
  try {
    // A channel is open if it exists and its connection is open
    // Don't be too strict - let the actual operation handle errors
    return channel.connection !== null && channel.connection !== undefined;
  } catch {
    return false;
  }
}

// Clean up connection and channel references
function cleanup(): void {
  globalForRabbitMQ.connection = undefined;
  globalForRabbitMQ.confirmChannel = undefined;
  globalForRabbitMQ.connectionPromise = undefined;
  globalForRabbitMQ.channelPromise = undefined;
}

// Get or create RabbitMQ connection with retry logic
async function getConnection(): Promise<amqp.Connection> {
  // Return existing connection if it's still open
  if (globalForRabbitMQ.connection && isConnectionOpen(globalForRabbitMQ.connection)) {
    return globalForRabbitMQ.connection;
  }

  // If there's already a connection attempt in progress, wait for it
  if (globalForRabbitMQ.connectionPromise) {
    try {
      return await globalForRabbitMQ.connectionPromise;
    } catch (error) {
      // If the promise failed, clear it and retry
      globalForRabbitMQ.connectionPromise = undefined;
    }
  }

  // Clean up stale references
  cleanup();

  const url = getRabbitMQUrl();
  
  // Create connection with timeout
  const connectionPromise = Promise.race([
    amqp.connect(url),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`RabbitMQ connection timeout after ${CONNECTION_TIMEOUT}ms`));
      }, CONNECTION_TIMEOUT);
    }),
  ]) as unknown as Promise<amqp.Connection>;

  globalForRabbitMQ.connectionPromise = connectionPromise;

  try {
    const connection = await connectionPromise;

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      cleanup();
    });

    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed');
      cleanup();
    });

    globalForRabbitMQ.connection = connection;
    globalForRabbitMQ.connectionPromise = undefined;
    return connection;
  } catch (error) {
    globalForRabbitMQ.connectionPromise = undefined;
    throw error;
  }
}

// Get or create RabbitMQ confirm channel (for publisher confirms)
async function getConfirmChannel(): Promise<amqp.ConfirmChannel> {
  // Return existing channel if it's still open
  if (globalForRabbitMQ.confirmChannel && isChannelOpen(globalForRabbitMQ.confirmChannel)) {
    return globalForRabbitMQ.confirmChannel;
  }

  // If there's already a channel creation in progress, wait for it
  if (globalForRabbitMQ.channelPromise) {
    try {
      return await globalForRabbitMQ.channelPromise;
    } catch (error) {
      // If the promise failed, clear it and retry
      globalForRabbitMQ.channelPromise = undefined;
    }
  }

  // Clean up stale channel reference
  globalForRabbitMQ.confirmChannel = undefined;

  const channelPromise = (async () => {
    const connection = await getConnection();
    const channel = await (connection as any).createConfirmChannel();

    // Handle channel errors
    channel.on('error', (err: any) => {
      console.error('[RabbitMQ] Channel error:', err.message);
      globalForRabbitMQ.confirmChannel = undefined;
      globalForRabbitMQ.channelPromise = undefined;
    });

    channel.on('close', () => {
      console.warn('[RabbitMQ] Channel closed');
      globalForRabbitMQ.confirmChannel = undefined;
      globalForRabbitMQ.channelPromise = undefined;
    });

    return channel;
  })();

  globalForRabbitMQ.channelPromise = channelPromise;

  try {
    const channel = await channelPromise;
    globalForRabbitMQ.confirmChannel = channel;
    globalForRabbitMQ.channelPromise = undefined;
    return channel;
  } catch (error) {
    globalForRabbitMQ.channelPromise = undefined;
    throw error;
  }
}

// Ensure queue exists with retry logic
async function ensureQueue(channel: amqp.ConfirmChannel, queueName: string): Promise<void> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      await channel.assertQueue(queueName, {
        durable: true, // Queue survives broker restart
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`[RabbitMQ] Queue assertion failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  
  throw new Error(`Failed to assert queue after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
}

/**
 * Publish a message to RabbitMQ queue with publisher confirms (synchronous)
 * Includes retry logic with automatic channel recreation on failure
 * @param payload - The data to send (will be JSON stringified)
 * @returns Promise that resolves when message is confirmed published by broker
 * @throws Error if connection, channel creation, or publish fails after retries
 */
export async function publishToQueue<T>(payload: T): Promise<void> {
  const queueName = getQueueName();
  
  // Convert payload to buffer once
  let message: Buffer;
  try {
    message = Buffer.from(JSON.stringify(payload));
  } catch (serializationError) {
    throw new Error(`Failed to serialize payload: ${serializationError instanceof Error ? serializationError.message : String(serializationError)}`);
  }

  let lastError: Error | undefined;
  
  // Retry logic: attempt publish with channel recreation on failure
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    let channel: amqp.ConfirmChannel | undefined;
    let connection: amqp.Connection | undefined;
    
    try {
      // Get fresh connection and channel for each attempt
      connection = await getConnection();
      
      // Force new channel creation if previous attempt failed
      if (attempt > 1) {
        // Clear channel reference to force recreation
        if (globalForRabbitMQ.confirmChannel) {
          try {
            if (isChannelOpen(globalForRabbitMQ.confirmChannel)) {
              await globalForRabbitMQ.confirmChannel.close();
            }
          } catch {
            // Ignore close errors
          }
        }
        globalForRabbitMQ.confirmChannel = undefined;
        globalForRabbitMQ.channelPromise = undefined;
      }
      
      channel = await getConfirmChannel();

      // Ensure queue exists
      await ensureQueue(channel, queueName);

      // Publish with confirmation (synchronous - waits for broker confirmation)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`RabbitMQ publish confirmation timeout after ${PUBLISH_TIMEOUT}ms`));
        }, PUBLISH_TIMEOUT);

        try {
          const sent = channel!.sendToQueue(
            queueName,
            message,
            {
              persistent: true, // Message survives broker restart
            },
            (err) => {
              clearTimeout(timeout);
              
              if (err) {
                reject(new Error(`RabbitMQ publish failed: ${err.message}`));
              } else {
                resolve();
              }
            }
          );

          if (!sent) {
            // If sendToQueue returns false, the channel buffer is full
            // Wait for drain event - the confirmation callback will still be called
            channel!.once('drain', () => {
              // Channel is ready, but confirmation will come via callback
            });
          }
        } catch (sendError) {
          clearTimeout(timeout);
          reject(new Error(`Failed to send message to RabbitMQ: ${sendError instanceof Error ? sendError.message : String(sendError)}`));
        }
      });

      // Success - return immediately
      return;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message;
      
      // Log error for debugging
      if (attempt === 1) {
        console.error(`[RabbitMQ] Publish error (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`, errorMessage);
      } else {
        console.warn(`[RabbitMQ] Publish retry ${attempt}/${MAX_RETRY_ATTEMPTS}:`, errorMessage);
      }

      // Clean up on error - clear channel to force recreation
      if (channel) {
        try {
          if (isChannelOpen(channel)) {
            await channel.close();
          }
        } catch {
          // Ignore close errors during cleanup
        }
      }
      
      // Clear channel reference to force recreation on next attempt
      globalForRabbitMQ.confirmChannel = undefined;
      globalForRabbitMQ.channelPromise = undefined;

      // If this was the last attempt, don't wait
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  
  // All retries failed
  const finalError = lastError || new Error('Unknown error');
  throw new Error(`Failed to publish message to RabbitMQ after ${MAX_RETRY_ATTEMPTS} attempts: ${finalError.message}`);
}

/**
 * Close RabbitMQ connection and channel (useful for cleanup/shutdown)
 */
export async function closeConnection(): Promise<void> {
  if (globalForRabbitMQ.confirmChannel && isChannelOpen(globalForRabbitMQ.confirmChannel)) {
    try {
      await globalForRabbitMQ.confirmChannel.close();
    } catch (error) {
      console.error('[RabbitMQ] Error closing channel:', error);
    }
  }

  if (globalForRabbitMQ.connection && isConnectionOpen(globalForRabbitMQ.connection)) {
    try {
      await (globalForRabbitMQ.connection as any).close();
    } catch (error) {
      console.error('[RabbitMQ] Error closing connection:', error);
    }
  }

  cleanup();
}

/**
 * Health check for RabbitMQ connection
 * @returns true if connection and channel are open, false otherwise
 */
export async function isHealthy(): Promise<boolean> {
  try {
    const connection = await getConnection();
    const channel = await getConfirmChannel();
    return isConnectionOpen(connection) && isChannelOpen(channel);
  } catch (error) {
    return false;
  }
}
