const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class StorageService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../../uploads');
        this.ensureUploadDir();
    }

    async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Generate a secure filename
     */
    generateFilename(originalName) {
        const ext = path.extname(originalName);
        const hash = crypto.randomBytes(16).toString('hex');
        return `${hash}${ext}`;
    }

    /**
     * Validate file type
     */
    isValidFileType(mimeType) {
        const allowedTypes = [
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Text
            'text/plain',
            'text/csv',
            // Archives
            'application/zip',
            'application/x-rar-compressed'
        ];
        return allowedTypes.includes(mimeType);
    }

    /**
     * Validate file size (max 10MB)
     */
    isValidFileSize(size) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return size <= maxSize;
    }

    /**
     * Get file path
     */
    getFilePath(filename) {
        return path.join(this.uploadDir, filename);
    }

    /**
     * Delete file
     */
    async deleteFile(filename) {
        try {
            const filePath = this.getFilePath(filename);
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Delete file error:', error);
            return false;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filename) {
        try {
            const filePath = this.getFilePath(filename);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new StorageService();
