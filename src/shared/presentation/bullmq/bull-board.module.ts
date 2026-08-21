import { createBullBoard } from '@bull-board/api';
import { FastifyAdapter as BullBoardFastifyAdapter } from '@bull-board/fastify';
import fastifyBasicAuth from '@fastify/basic-auth';
import { Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyInstance } from 'fastify';

export const BULL_BOARD_BASE_PATH = '/admin/queues';

@Module({})
export class BullBoardModule implements NestModule {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
  ) {}

  configure(): void {
    const serverAdapter = new BullBoardFastifyAdapter();
    serverAdapter.setBasePath(BULL_BOARD_BASE_PATH);
    createBullBoard({ queues: [], serverAdapter });

    const username = this.configService.getOrThrow<string>('BULL_BOARD_USERNAME');
    const password = this.configService.getOrThrow<string>('BULL_BOARD_PASSWORD');
    const fastify = this.adapterHost.httpAdapter.getInstance<FastifyInstance>();

    fastify.register(
      async (scope) => {
        await scope.register(fastifyBasicAuth, {
          validate: (user, pass, _req, _reply, done) => {
            done(user === username && pass === password ? undefined : new Error('Unauthorized'));
          },
          authenticate: true,
        });
        scope.addHook('onRequest', scope.basicAuth);
        await scope.register(serverAdapter.registerPlugin());
      },
      { prefix: BULL_BOARD_BASE_PATH },
    );
  }
}
