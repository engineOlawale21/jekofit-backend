export const DESIGN_RENDER_QUEUE = 'design-render';
export enum DesignRenderJobName { PREPARE_PROOF = 'prepare-proof' }
export interface PrepareDesignProofPayload { renderJobId: string }
