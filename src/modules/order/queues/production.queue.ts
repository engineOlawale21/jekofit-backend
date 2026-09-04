export const PRODUCTION_QUEUE = 'production';
export enum ProductionJobName { START = 'start-production' }
export interface StartProductionPayload { productionJobId: string }
