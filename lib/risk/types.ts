/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export const RISK_MODEL_VERSION = 'risk-engine-v1.0.0';

export interface EvaluatedRiskFactor {
  factorType: string;
  weight: number;
  description: string;
  evidenceReferences: string[];
}

export interface RiskEvaluationResult {
  entityId: string;
  score: number;
  factors: EvaluatedRiskFactor[];
}

export const RISK_WEIGHTS = {
  MULTI_HOP_TRANSACTION: 25,
  RAPID_ONWARD_TRANSFER: 20,
  HIGH_TRANSACTION_VELOCITY: 15,
  MULTIPLE_INCOMING_SOURCES: 10,
  RAPID_SIM_SWITCHING: 10,
  SHARED_IMEI: 8,
  RECURRING_UPI_BENEFICIARY: 7,
  SHARED_IP: 3,
  SHARED_MAC: 2
};
