export enum ChannelStatus {
	Pending = 'pending',
	Checking = 'checking',
	Online = 'online',
	Offline = 'offline'
}

export interface Channel {
	id: number;
	name: string;
	url: string;
	status: ChannelStatus;
}

export type Direction = 'up' | 'down';
