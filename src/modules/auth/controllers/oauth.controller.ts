import { Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  constructor(private readonly configService: ConfigService) {}

  private redirectToFrontend(
    res: Response,
    provider: 'google' | 'facebook' | 'apple',
    user: { accessToken: string; refreshToken: string; isNewUser: boolean },
  ): void {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const redirectUrl = new URL('/auth/callback', frontendUrl);

    // Fragments are not sent to the server, keeping credentials out of URL logs.
    redirectUrl.hash = new URLSearchParams({
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      isNewUser: String(user.isNewUser),
      provider,
    }).toString();

    res.redirect(redirectUrl.toString());
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth page' })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    this.redirectToFrontend(res, 'google', req.user);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook OAuth page' })
  async facebookAuth() {
    // Initiates Facebook OAuth flow
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async facebookAuthCallback(@Request() req, @Res() res: Response) {
    this.redirectToFrontend(res, 'facebook', req.user);
  }

  @Public()
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Initiate Apple OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple OAuth page' })
  async appleAuth() {
    // Initiates Apple OAuth flow
  }

  @Public()
  // Apple always returns authorization results using response_mode=form_post.
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async appleAuthCallback(@Request() req, @Res() res: Response) {
    this.redirectToFrontend(res, 'apple', req.user);
  }
}
