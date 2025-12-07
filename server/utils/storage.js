import { readFile as fsReadFile, writeFile as fsWriteFile, readdir as fsReaddir, unlink as fsUnlink, stat as fsStat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import { put, head, list, del } from '@vercel/blob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if we're on Vercel
const isVercel = process.env.VERCEL === '1'
const BLOB_STORE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

// For local development, use file system
const LOCAL_DATA_DIR = join(__dirname, '../data')

/**
 * Storage abstraction layer
 * Uses file system locally, Vercel Blob on Vercel
 */
export class Storage {
  constructor() {
    this.isVercel = isVercel && !!BLOB_STORE_TOKEN
    this.localDataDir = LOCAL_DATA_DIR
    
    // Warn if on Vercel but blob token is missing
    if (isVercel && !BLOB_STORE_TOKEN) {
      console.warn('⚠️ WARNING: Running on Vercel but BLOB_READ_WRITE_TOKEN is not set!')
      console.warn('⚠️ File operations will fail. Please create a Blob Store in Vercel Dashboard.')
      console.warn('⚠️ See VERCEL_BLOB_SETUP.md for instructions.')
    }
  }

  /**
   * Check if using blob storage
   * @returns {boolean}
   */
  isBlobStorage() {
    return this.isVercel
  }

  /**
   * Retry helper with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} initialDelay - Initial delay in ms
   * @returns {Promise<any>}
   */
  async retryWithBackoff(fn, maxRetries = 3, initialDelay = 100) {
    let lastError
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }

  /**
   * Ensure directory exists (local only)
   */
  ensureDir(dirPath) {
    if (!this.isVercel && !existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  }

  /**
   * Read a file
   * @param {string} path - File path (relative to data dir locally, or full path for blob)
   * @returns {Promise<Buffer|string>} File content
   */
  async readFile(path) {
    if (this.isVercel) {
      // Use Vercel Blob
      if (!BLOB_STORE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN not configured. Please create a Blob Store in Vercel Dashboard.')
      }
      
      // Use retry logic for eventual consistency
      return await this.retryWithBackoff(async () => {
        try {
          const blob = await head(path, { token: BLOB_STORE_TOKEN })
          // Fetch content from blob URL
          const response = await fetch(blob.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.statusText} (${response.status})`)
          }
          return await response.text()
        } catch (error) {
          // Handle 404 or not found errors - these are expected for new files
          if (error.statusCode === 404 || 
              error.status === 404 ||
              error.message?.includes('404') || 
              error.message?.includes('not found') ||
              error.message?.includes('Not Found')) {
            throw new Error('ENOENT')
          }
          // Re-throw to allow retry
          throw error
        }
      }, 3, 200).catch(error => {
        // After retries, log and wrap error
        if (error.message === 'ENOENT') {
          throw error
        }
        // Log the actual error for debugging
        console.error(`❌ Error reading blob ${path} after retries:`, {
          message: error.message,
          statusCode: error.statusCode,
          status: error.status,
          name: error.name
        })
        // Wrap in a more descriptive error
        throw new Error(`Blob storage read error: ${error.message || 'Unknown error'}. Path: ${path}`)
      })
    } else {
      // Use file system
      const fullPath = join(this.localDataDir, path)
      try {
        return await fsReadFile(fullPath, 'utf8')
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('ENOENT')
        }
        throw error
      }
    }
  }

  /**
   * Write a file
   * @param {string} path - File path
   * @param {string|Buffer} content - File content
   * @param {boolean} verify - Whether to verify the write (default: false for blob, true for file system)
   * @returns {Promise<void>}
   */
  async writeFile(path, content, verify = null) {
    if (this.isVercel) {
      // Use Vercel Blob
      if (!BLOB_STORE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN not configured. Please create a Blob Store in Vercel Dashboard.')
      }
      try {
        const contentBuffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
        await put(path, contentBuffer, {
          token: BLOB_STORE_TOKEN,
          access: 'public', // Make files publicly accessible
          addRandomSuffix: false, // Keep original filename
          allowOverwrite: true // Allow overwriting existing files
        })
        
        // For blob storage, don't verify immediately due to eventual consistency
        // Trust that the write succeeded if no error was thrown
        // If verification is explicitly requested, use retry logic
        if (verify === true) {
          await this.retryWithBackoff(async () => {
            const exists = await this.exists(path)
            if (!exists) {
              throw new Error('File not found after write (eventual consistency delay)')
            }
          }, 3, 300).catch(error => {
            // Log but don't fail - eventual consistency means it might take time
            console.warn(`⚠️ Verification warning for blob ${path}: ${error.message}. File should be available shortly.`)
          })
        }
      } catch (error) {
        console.error(`❌ Error writing blob ${path}:`, {
          message: error.message,
          statusCode: error.statusCode,
          status: error.status,
          name: error.name,
          stack: error.stack
        })
        // Wrap in a more descriptive error
        throw new Error(`Blob storage write error: ${error.message || 'Unknown error'}. Path: ${path}`)
      }
    } else {
      // Use file system
      const fullPath = join(this.localDataDir, path)
      const dir = dirname(fullPath)
      this.ensureDir(dir)
      await fsWriteFile(fullPath, content, 'utf8')
      
      // For file system, verify immediately if requested (default true)
      if (verify !== false) {
        const exists = existsSync(fullPath)
        if (!exists) {
          throw new Error('File was not created after write operation')
        }
      }
    }
  }

  /**
   * Check if file exists
   * @param {string} path - File path
   * @param {boolean} retry - Whether to retry on failure (for eventual consistency)
   * @returns {Promise<boolean>}
   */
  async exists(path, retry = false) {
    if (this.isVercel) {
      try {
        if (!BLOB_STORE_TOKEN) {
          console.warn('⚠️ BLOB_READ_WRITE_TOKEN not configured, cannot check blob existence')
          return false
        }
        
        if (retry) {
          // Use retry logic for eventual consistency
          try {
            await this.retryWithBackoff(async () => {
              await head(path, { token: BLOB_STORE_TOKEN })
            }, 3, 200)
            return true
          } catch (error) {
            if (error.statusCode === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
              return false
            }
            // Log unexpected errors but don't throw - return false instead
            console.error(`❌ Error checking blob existence ${path} after retries:`, error.message || error)
            return false
          }
        } else {
          // Single attempt
          await head(path, { token: BLOB_STORE_TOKEN })
          return true
        }
      } catch (error) {
        if (error.statusCode === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
          return false
        }
        // Log unexpected errors but don't throw - return false instead
        console.error(`❌ Error checking blob existence ${path}:`, error.message || error)
        return false
      }
    } else {
      const fullPath = join(this.localDataDir, path)
      return existsSync(fullPath)
    }
  }

  /**
   * Delete a file
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    if (this.isVercel) {
      await del(path, { token: BLOB_STORE_TOKEN })
    } else {
      const fullPath = join(this.localDataDir, path)
      await fsUnlink(fullPath)
    }
  }

  /**
   * List files in a directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array<{name: string, size?: number, modified?: Date}>>}
   */
  async listFiles(dirPath) {
    if (this.isVercel) {
      // Use Vercel Blob list with prefix
      const prefix = dirPath ? `${dirPath}/` : ''
      const { blobs } = await list({
        prefix: prefix,
        token: BLOB_STORE_TOKEN
      })
      return blobs.map(blob => {
        // Remove prefix from pathname to get just the filename
        const name = prefix ? blob.pathname.replace(prefix, '') : blob.pathname
        return {
          name: name,
          size: blob.size,
          modified: blob.uploadedAt
        }
      })
    } else {
      // Use file system
      const fullPath = join(this.localDataDir, dirPath)
      if (!existsSync(fullPath)) {
        return []
      }
      const files = await fsReaddir(fullPath)
      const fileList = []
      for (const file of files) {
        const filePath = join(fullPath, file)
        const stats = await fsStat(filePath)
        fileList.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        })
      }
      return fileList
    }
  }

  /**
   * Get file stats
   * @param {string} path - File path
   * @returns {Promise<{size: number, modified: Date}>}
   */
  async getStats(path) {
    if (this.isVercel) {
      const blob = await head(path, { token: BLOB_STORE_TOKEN })
      return {
        size: blob.size,
        modified: blob.uploadedAt
      }
    } else {
      const fullPath = join(this.localDataDir, path)
      const stats = await fsStat(fullPath)
      return {
        size: stats.size,
        modified: stats.mtime
      }
    }
  }

  /**
   * Read file as buffer (for binary files like PDFs)
   * @param {string} path - File path
   * @returns {Promise<Buffer>}
   */
  async readFileBuffer(path) {
    if (this.isVercel) {
      // Use retry logic for eventual consistency
      return await this.retryWithBackoff(async () => {
        const blob = await head(path, { token: BLOB_STORE_TOKEN })
        const response = await fetch(blob.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }, 3, 200).catch(error => {
        // Handle 404 errors
        if (error.statusCode === 404 || 
            error.status === 404 ||
            error.message?.includes('404') || 
            error.message?.includes('not found')) {
          throw new Error('ENOENT')
        }
        throw new Error(`Blob storage read buffer error: ${error.message || 'Unknown error'}. Path: ${path}`)
      })
    } else {
      const fullPath = join(this.localDataDir, path)
      return await fsReadFile(fullPath)
    }
  }

  /**
   * Write file from buffer (for binary files like PDFs)
   * @param {string} path - File path
   * @param {Buffer} buffer - File content
   * @returns {Promise<void>}
   */
  async writeFileBuffer(path, buffer) {
    if (this.isVercel) {
      await put(path, buffer, {
        token: BLOB_STORE_TOKEN,
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true // Allow overwriting existing files
      })
    } else {
      const fullPath = join(this.localDataDir, path)
      const dir = dirname(fullPath)
      this.ensureDir(dir)
      await fsWriteFile(fullPath, buffer)
    }
  }
}

// Export singleton instance
export const storage = new Storage()

