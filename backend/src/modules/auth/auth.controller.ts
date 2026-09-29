import { type Request, type Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class AuthController {
  register = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.register(req.body, client);
    sendCreated(res, result, 'User registered successfully');
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.login(req.body, client);
    sendSuccess(res, result, 'Login successful');
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.refreshToken(req.body.refreshToken, client);
    sendSuccess(res, result, 'Tokens refreshed successfully');
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken, client);
    }
    sendSuccess(res, { success: true }, 'Logged out successfully');
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.verifyEmail(req.body.token, client);
    sendSuccess(res, result, 'Email verified successfully');
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.resendVerification(req.body.email, client);
    sendSuccess(res, result, result.message);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.forgotPassword(req.body.email, client);
    sendSuccess(res, result, result.message);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.resetPassword(req.body, client);
    sendSuccess(res, result, 'Password reset successfully');
  };
}

export const authController = new AuthController();
