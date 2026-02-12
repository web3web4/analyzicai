/**
 * Shared constants across the AI analysis system
 */

/**
 * Source types for UXic AI (UI/UX analysis)
 */
export const UXIC_SOURCE_TYPES = ["upload", "screen_capture", "url"] as const;
export type UxicSourceType = (typeof UXIC_SOURCE_TYPES)[number];

/**
 * Source types for Solidic AI (smart contract analysis)
 */
export const SOLIDIC_SOURCE_TYPES = ["github", "contract_upload"] as const;
export type SolidicSourceType = (typeof SOLIDIC_SOURCE_TYPES)[number];

/**
 * All possible source types across the platform
 */
export const ALL_SOURCE_TYPES = [
  ...UXIC_SOURCE_TYPES,
  ...SOLIDIC_SOURCE_TYPES,
] as const;
export type SourceType = (typeof ALL_SOURCE_TYPES)[number];

/**
 * Token limit for code truncation in synthesis
 */
export const MAX_CODE_LENGTH_FOR_SYNTHESIS = 15000;
