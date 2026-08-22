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

export interface FrameworkSeed {
  slug: string;
  name: string;
  version: string;
  description: string;
  domains: DomainSeed[];
}
