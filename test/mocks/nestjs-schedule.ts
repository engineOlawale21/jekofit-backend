import { DynamicModule } from '@nestjs/common';

export class ScheduleModule {
  static forRoot(): DynamicModule { return { module: ScheduleModule, global: true }; }
}

export const Cron = (_expression: string): MethodDecorator => () => undefined;
export const CronExpression = { EVERY_DAY_AT_MIDNIGHT: '0 0 * * *' };
