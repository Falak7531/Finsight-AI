import {
  getCurrentUserService,
  signInService,
  signUpService,
  updateProfileService,
} from '../services/auth.service.js'

import { AUTH_COOKIE_MAX_AGE, getAuthCookieOptions } from '../config/authCookie.js'

export const signUpController = async (req, res, next) => {
  try {
    const { userName, userEmail, userPassword } = req.body || {}
    const { user, token } = await signUpService(
      userName,
      userEmail,
      userPassword
    )
    res.cookie('token', token, { ...getAuthCookieOptions(), maxAge: AUTH_COOKIE_MAX_AGE })
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
    res.cookie('token', token, { ...getAuthCookieOptions(), maxAge: AUTH_COOKIE_MAX_AGE })
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
  res.clearCookie('token', getAuthCookieOptions())
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
