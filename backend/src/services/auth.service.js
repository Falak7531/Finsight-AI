import bcryptjs from 'bcryptjs'
import { generateToken } from '../../utils/tokens.js'
import { prisma } from '../config/prisma.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createHttpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export const signUpService = async (userName, userEmail, userPassword) => {
  const name = String(userName || '').trim()
  const email = String(userEmail || '').trim().toLowerCase()
  const password = String(userPassword || '')

  if (name.length < 2) {
    throw createHttpError(400, 'Full name must be at least 2 characters.')
  }
  if (!EMAIL_REGEX.test(email)) {
    throw createHttpError(400, 'Please provide a valid email address.')
  }
  if (password.length < 8) {
    throw createHttpError(400, 'Password must be at least 8 characters long.')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createHttpError(409, 'An account with this email already exists.')
  }

  const hashPassword = await bcryptjs.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  const token = generateToken(user.id, user.email)
  return { user, token }
}

export const signInService = async (userEmail, userPassword) => {
  const email = String(userEmail || '').trim().toLowerCase()
  const password = String(userPassword || '')

  if (!email || !password) {
    throw createHttpError(400, 'Email and password are required.')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createHttpError(401, 'Invalid email or password.')
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password)
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid email or password.')
  }

  const token = generateToken(user.id, user.email)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  }
}

export const getCurrentUserService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  if (!user) {
    throw createHttpError(401, 'Authenticated user no longer exists.')
  }
  return user
}

export const updateProfileService = async (userId, { name }) => {
  const trimmed = String(name || '').trim()
  if (trimmed.length < 2) {
    throw createHttpError(400, 'Full name must be at least 2 characters.')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: trimmed },
    select: { id: true, name: true, email: true, createdAt: true },
  })
  return user
}
