import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SaveDesignDto } from '../dto/save-design.dto';
import { DesignService } from '../services/design.service';
@Controller('designs') @UseGuards(JwtAuthGuard)
export class DesignController {
  constructor(private readonly designs: DesignService) {}
  @Get() list(@CurrentUser() user: Auth) { return this.designs.list(user.id); }
  @Get(':id') get(@CurrentUser() user: Auth, @Param('id') id: string) { return this.designs.get(user.id, id); }
  @Get(':id/render-status') renderStatus(@CurrentUser() user: Auth, @Param('id') id: string) { return this.designs.renderStatus(user.id, id); }
  @Post() @Throttle({ default: { limit: 20, ttl: 60 } }) create(@CurrentUser() user: Auth, @Body() dto: SaveDesignDto) { return this.designs.save(user.id, dto); }
  @Post(':id/duplicate') @Throttle({ default: { limit: 20, ttl: 60 } }) duplicate(@CurrentUser() user: Auth, @Param('id') id: string) { return this.designs.duplicate(user.id, id); }
  @Patch(':id') update(@CurrentUser() user: Auth, @Param('id') id: string, @Body() dto: SaveDesignDto) { return this.designs.save(user.id, dto, id); }
  @Delete(':id') remove(@CurrentUser() user: Auth, @Param('id') id: string) { return this.designs.remove(user.id, id); }
}
