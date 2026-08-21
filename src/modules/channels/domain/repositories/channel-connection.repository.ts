import { ChannelConnection } from '../entities/channel-connection.entity';

export interface ChannelConnectionRepository {
  findById(id: string): Promise<ChannelConnection | null>;
  findActiveBySocialAccountId(socialAccountId: string): Promise<ChannelConnection[]>;
  save(connection: ChannelConnection): Promise<void>;
}

export const CHANNEL_CONNECTION_REPOSITORY = Symbol('CHANNEL_CONNECTION_REPOSITORY');
