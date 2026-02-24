export interface ThemeContrastRequirement {
  foregroundToken: string;
  backgroundToken: string;
  minimumContrast: number;
  label: string;
}

export interface ThemeTokenValidationIssue {
  type:
    | "invalid_token_name"
    | "unknown_token"
    | "empty_value"
    | "invalid_color_value"
    | "unresolved_color_reference"
    | "low_contrast"
    | "unresolvable_contrast_pair";
  severity: "error" | "warning";
  message: string;
  token?: string;
  foregroundToken?: string;
  backgroundToken?: string;
  contrast?: number;
  minimumContrast?: number;
}

export interface ThemeTokenValidationResult {
  valid: boolean;
  issues: ThemeTokenValidationIssue[];
  errors: ThemeTokenValidationIssue[];
  warnings: ThemeTokenValidationIssue[];
  contrastChecksPerformed: number;
}

export interface ThemeTokenValidationOptions {
  context?: string;
  allowedTokenKeys?: Iterable<string>;
  enforceAllowedTokenKeys?: boolean;
  contrastRequirements?: readonly ThemeContrastRequirement[];
  baselineTokens?: Record<string, string>;
  changedTokenKeys?: Iterable<string>;
  unresolvedColorReferenceSeverity?: ThemeTokenValidationIssue["severity"];
  unresolvableContrastPairSeverity?: ThemeTokenValidationIssue["severity"];
}
