import { Module } from '@nestjs/common';
import { CLOCK } from './application/ports/clock.port';
import { SystemClock } from './infrastructure/adapters/system-clock';

@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class ClockModule {}
