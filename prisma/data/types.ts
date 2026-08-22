export interface ControlSeed {
  code: string;
  title: string;
  description: string;
}

export interface DomainSeed {
  code: string;
  title: string;
  controls: ControlSeed[];
}

export interface MaturityLevel {
  value: number;
  label: string;
}

export interface MaturityModel {
  name: string;
  // Ascending order, starting at 0. The highest value is used as the scoring
  // denominator (percentage = maturity / max * 100), so every model's floor
  // level must be 0.
  levels: MaturityLevel[];
}

export interface FrameworkSeed {
  slug: string;
  name: string;
  version: string;
  description: string;
  maturityModel: MaturityModel;
  domains: DomainSeed[];
}
