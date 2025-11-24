import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';

// Validate required environment variables
function validateEnvVars() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_REGION',
    'AWS_S3_BUCKET_NAME',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Please set all required AWS S3 environment variables.`
    );
  }
}

// Validate environment variables at module load (server-side only)
if (typeof window === 'undefined') {
  validateEnvVars();
}

// Get S3 configuration
const getS3Config = (): AWS.S3.ClientConfiguration => {
  const config: AWS.S3.ClientConfiguration = {
    region: process.env.AWS_S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  };

  // Optional: Custom endpoint for MinIO or S3-compatible services
  if (process.env.AWS_S3_ENDPOINT) {
    config.endpoint = process.env.AWS_S3_ENDPOINT;
    // MinIO requires path-style URLs by default, allow override via env var
    config.s3ForcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE !== 'false';
    
    // Handle self-signed certificates for MinIO/local S3-compatible services
    const endpoint = process.env.AWS_S3_ENDPOINT;
    const shouldIgnoreSSL = 
      process.env.AWS_S3_REJECT_UNAUTHORIZED === 'false' ||
      endpoint.includes('localhost') ||
      endpoint.includes('127.0.0.1') ||
      endpoint.startsWith('http://') ||
      // Default to ignoring SSL for custom endpoints unless explicitly set to 'true'
      (process.env.AWS_S3_REJECT_UNAUTHORIZED !== 'true' && endpoint.startsWith('https://'));
    
    if (shouldIgnoreSSL && endpoint.startsWith('https://')) {
      config.httpOptions = {
        agent: new https.Agent({
          rejectUnauthorized: false,
        }),
      };
    }
  } else {
    // Default HTTPS agent for self-signed certificates even without custom endpoint
    config.httpOptions = {
      agent: new https.Agent({
        rejectUnauthorized: false,
      }),
    };
  }

  return config;
};

// S3 client instance
const s3Client = new AWS.S3(getS3Config());

// Bucket name
export const DOCUMENTS_BUCKET = process.env.AWS_S3_BUCKET_NAME!;

// Ensure bucket exists
let bucketInitialized = false;

export async function ensureBucketExists(): Promise<void> {
  if (bucketInitialized) return;

  try {
    // Check if bucket exists
    try {
      await s3Client.headBucket({ Bucket: DOCUMENTS_BUCKET }).promise();
      bucketInitialized = true;
      return;
    } catch (error: any) {
      // Check various error codes that indicate bucket doesn't exist
      const statusCode = error.statusCode;
      const errorCode = error.code;
      
      // 404, 403 (access denied but bucket might not exist), or NotFound error
      if (statusCode === 404 || statusCode === 403 || errorCode === 'NotFound' || errorCode === 'NoSuchBucket') {
        try {
          const createBucketParams: AWS.S3.CreateBucketRequest = {
            Bucket: DOCUMENTS_BUCKET,
          };
          
          // For MinIO and S3-compatible services, don't include LocationConstraint
          // Only add it for actual AWS S3 if region is not us-east-1
          const endpoint = process.env.AWS_S3_ENDPOINT;
          if (!endpoint) {
            const region = process.env.AWS_S3_REGION!;
            if (region && region !== 'us-east-1') {
              createBucketParams.CreateBucketConfiguration = {
                LocationConstraint: region,
              };
            }
          }
          
          await s3Client.createBucket(createBucketParams).promise();
          console.log(`Bucket ${DOCUMENTS_BUCKET} created successfully`);
        } catch (createError: any) {
          // If bucket already exists (409 Conflict or BucketAlreadyOwnedByYou), that's fine
          const createStatusCode = createError.statusCode;
          const createErrorCode = createError.code;
          
          if (
            createStatusCode === 409 ||
            createErrorCode === 'BucketAlreadyOwnedByYou' ||
            createErrorCode === 'BucketAlreadyExists'
          ) {
            console.log(`Bucket ${DOCUMENTS_BUCKET} already exists`);
          } else {
            // Log the raw response for debugging
            console.error('Raw create error:', {
              message: createError.message,
              code: createErrorCode,
              statusCode: createStatusCode,
            });
            throw createError;
          }
        }
      } else {
        // For other errors, log details and throw
        console.error('Raw head bucket error:', {
          message: error.message,
          code: errorCode,
          statusCode,
        });
        throw error;
      }
    }

    bucketInitialized = true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw new Error('Failed to initialize S3 bucket');
  }
}

// Initialize bucket on module load (for server-side only)
if (typeof window === 'undefined') {
  ensureBucketExists().catch((error) => {
    console.error('Failed to initialize S3 bucket on startup:', error);
  });
}

// Rollback function to remove a file from S3
export async function rollbackUpload(key: string): Promise<void> {
  const params = {
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
  };

  try {
    await s3Client.deleteObject(params).promise();
    console.log(`File with key ${key} has been deleted from bucket ${DOCUMENTS_BUCKET}`);
  } catch (err: any) {
    console.error(`Failed to delete file with key ${key} from bucket ${DOCUMENTS_BUCKET}: ${err.message}`);
  }
}

// Extract S3 key from full S3 URL
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Handle different S3 URL formats:
    // 1. https://bucket.s3.region.amazonaws.com/key
    // 2. https://s3.region.amazonaws.com/bucket/key
    // 3. https://endpoint/bucket/key (MinIO/custom endpoint)
    // 4. /bucket/key (path-style)
    
    const urlObj = new URL(url);
    let key: string | null = null;
    
    // Path-style URL: /bucket/key or /key
    if (urlObj.pathname.startsWith('/')) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      // If first part is bucket name, skip it
      if (parts[0] === DOCUMENTS_BUCKET && parts.length > 1) {
        key = parts.slice(1).join('/');
      } else if (parts.length > 0) {
        // Assume first part is key if bucket doesn't match
        key = parts.join('/');
      }
    } else {
      // Virtual-hosted style: bucket.s3.region.amazonaws.com
      const hostname = urlObj.hostname;
      if (hostname.startsWith(DOCUMENTS_BUCKET + '.')) {
        // Remove bucket prefix and extract path
        key = urlObj.pathname.slice(1); // Remove leading slash
      } else if (hostname.includes('s3') || hostname.includes('amazonaws')) {
        // Standard S3 URL
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts[0] === DOCUMENTS_BUCKET && pathParts.length > 1) {
          key = pathParts.slice(1).join('/');
        } else if (pathParts.length > 0) {
          key = pathParts.join('/');
        }
      } else {
        // Custom endpoint (MinIO)
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts[0] === DOCUMENTS_BUCKET && pathParts.length > 1) {
          key = pathParts.slice(1).join('/');
        } else if (pathParts.length > 0) {
          key = pathParts.join('/');
        }
      }
    }
    
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

// Upload file to S3
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  // Generate UUID without hyphens
  const uuid = uuidv4().replace(/-/g, '');
  const fileExtension = fileName.split('.').pop() || '';
  const objectName = `${uuid}/originalfile.${fileExtension}`;

  try {
    // Ensure bucket exists before uploading
    await ensureBucketExists();

    // Upload to S3 using upload() method (supports multipart uploads)
    const params = {
      Bucket: DOCUMENTS_BUCKET,
      Key: objectName,
      Body: fileBuffer,
      ContentType: contentType,
    };

    const data = await s3Client.upload(params).promise();

    return {
      url: data.Location,
      path: data.Key || objectName,
    };
  } catch (error) {
    // Rollback upload on error
    await rollbackUpload(objectName);
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
export async function deleteFromS3(objectName: string): Promise<void> {
  try {
    await s3Client.deleteObject({
      Bucket: DOCUMENTS_BUCKET,
      Key: objectName,
    }).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Get presigned URL for file access (v2 getSignedUrl is synchronous)
export function getPresignedUrl(objectName: string, expirySeconds: number = 7 * 24 * 60 * 60): string {
  try {
    return s3Client.getSignedUrl('getObject', {
      Bucket: DOCUMENTS_BUCKET,
      Key: objectName,
      Expires: expirySeconds,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

export { s3Client };
export default s3Client;

