import { DynamicModule, Inject } from '@nestjs/common';

const queueToken = (name: string) => `BullQueue_${name}`;
const queue = { add: async () => ({ id: 'test-job' }) };

/** CommonJS-friendly Bull boundary used only by Jest. Production uses @nestjs/bull. */
export class BullModule {
  static forRootAsync(): DynamicModule {
    return { module: BullModule, global: true };
  }

  static registerQueue(...options: Array<{ name: string }>): DynamicModule {
    const providers = options.map(({ name }) => ({ provide: queueToken(name), useValue: queue }));
    return { module: BullModule, providers, exports: providers };
  }
}

export const InjectQueue = (name: string): ParameterDecorator => Inject(queueToken(name));
export const Processor = (_name: string): ClassDecorator => () => undefined;
export const Process = (_name?: string): MethodDecorator => () => undefined;
export const OnQueueFailed = (): MethodDecorator => () => undefined;
export const OnQueueStalled = (): MethodDecorator => () => undefined;
