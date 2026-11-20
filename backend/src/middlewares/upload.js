import crypto from 'crypto'
import fs from 'fs'
import multer from 'multer'
import path from 'path'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB (shared with frontend)

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.csv', '.xlsx'])
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // some browsers send this for .csv/.xlsx; signature check enforces real type
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin'
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`)
  },
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error('Unsupported file type. Only PDF, CSV, and XLSX files are allowed.')
    err.status = 400
    return cb(err)
  }

  if (file.mimetype && !ALLOWED_MIMES.has(file.mimetype)) {
    const err = new Error(`Unsupported MIME type (${file.mimetype}). Only PDF, CSV, and XLSX are allowed.`)
    err.status = 400
    return cb(err)
  }

  return cb(null, true)
}

/**
 * Validates file signature (magic bytes) after upload so spoofed extensions are rejected.
 */
export function validateFileSignature(filePath, ext) {
  const stat = fs.statSync(filePath)
  if (!stat.size || stat.size === 0) {
    throw Object.assign(new Error('Uploaded file is empty.'), { status: 400 })
  }

  const fd = fs.openSync(filePath, 'r')
  try {
    const header = Buffer.alloc(Math.min(512, stat.size))
    fs.readSync(fd, header, 0, header.length, 0)

    if (ext === 'PDF') {
      if (header.subarray(0, 4).toString('ascii') !== '%PDF') {
        throw Object.assign(new Error('Invalid PDF file signature.'), { status: 400 })
      }
    } else if (ext === 'XLSX') {
      // XLSX is a ZIP archive starting with PK\x03\x04
      if (!(header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04)) {
        throw Object.assign(new Error('Invalid XLSX file signature.'), { status: 400 })
      }
    } else if (ext === 'CSV') {
      // Reject binary files disguised as CSV (contains NUL byte)
      if (header.includes(0x00)) {
        throw Object.assign(new Error('Invalid CSV file: binary content detected.'), { status: 400 })
      }
    }
  } finally {
    fs.closeSync(fd)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
})
