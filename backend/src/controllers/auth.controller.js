import {
  getCurrentUserService,
  signInService,
  signUpService,
  updateProfileService,
} from '../services/auth.service.js'

const isProd = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const signUpController = async (req, res, next) => {
  try {
    const { userName, userEmail, userPassword } = req.body || {}
    const { user, token } = await signUpService(
      userName,
      userEmail,
      userPassword
    )
    res.cookie('token', token, COOKIE_OPTIONS)
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
    })
  } catch (err) {
    return next(err)
  }
}

export const signInController = async (req, res, next) => {
  try {
    const { userEmail, userPassword } = req.body || {}
    const { user, token } = await signInService(userEmail, userPassword)
    res.cookie('token', token, COOKIE_OPTIONS)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
    })
  } catch (err) {
    return next(err)
  }
}

export const logoutController = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  })
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}

export const meController = async (req, res, next) => {
  try {
    const user = await getCurrentUserService(req.user.userId)
    return res.status(200).json({
      success: true,
      user,
    })
  } catch (err) {
    return next(err)
  }
}

export const updateProfileController = async (req, res, next) => {
  try {
    const { name } = req.body || {}
    const user = await updateProfileService(req.user.userId, { name })
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    })
  } catch (err) {
    return next(err)
  }
}
