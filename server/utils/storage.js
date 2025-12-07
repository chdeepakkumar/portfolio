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
      try {
        const blob = await head(path, { token: BLOB_STORE_TOKEN })
        // For JSON files, we'll need to fetch the content
        // Vercel Blob doesn't have a direct read API, so we'll use list and then fetch
        // Actually, we need to use a different approach - store content in blob metadata or use a different method
        // Let me check the Vercel Blob API...
        // Actually, we can use the blob URL to fetch content
        const response = await fetch(blob.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`)
        }
        return await response.text()
      } catch (error) {
        if (error.statusCode === 404) {
          throw new Error('ENOENT')
        }
        throw error
      }
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
   * @returns {Promise<void>}
   */
  async writeFile(path, content) {
    if (this.isVercel) {
      // Use Vercel Blob
      const contentBuffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
      await put(path, contentBuffer, {
        token: BLOB_STORE_TOKEN,
        access: 'public', // Make files publicly accessible
        addRandomSuffix: false // Keep original filename
      })
    } else {
      // Use file system
      const fullPath = join(this.localDataDir, path)
      const dir = dirname(fullPath)
      this.ensureDir(dir)
      await fsWriteFile(fullPath, content, 'utf8')
    }
  }

  /**
   * Check if file exists
   * @param {string} path - File path
   * @returns {Promise<boolean>}
   */
  async exists(path) {
    if (this.isVercel) {
      try {
        await head(path, { token: BLOB_STORE_TOKEN })
        return true
      } catch (error) {
        if (error.statusCode === 404) {
          return false
        }
        throw error
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
      const blob = await head(path, { token: BLOB_STORE_TOKEN })
      const response = await fetch(blob.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
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
        addRandomSuffix: false
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

