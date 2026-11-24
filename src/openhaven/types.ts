/** OpenHaven static API records (openhaven.net/api), locale fields stripped. Fields are loose: the data is human-curated. */

export type Affordance = {
  id: string;
  name: string;
  description: string;
  whatItEnables?: string;
  whyItMatters?: string;
  domainIds: string[];
  primaryDomainId: string;
};

export type Tool = {
  id: string;
  name: string;
  domainIds: string[];
  entityType: string;
  description: string;
  devStatus: string;
  devStatusCode: number;
  owner?: string;
  governingBody?: string;
  license?: string;
  stack?: string;
  funding?: string;
  governanceModel?: string;
  captureRisk: number;
  captureRiskReasoning?: string;
  references?: unknown;
  lastInvestigated: string;
  communityLink?: string;
  affordanceIds: string[];
  searchKeywords?: string[];
  entityAttributes: Record<string, string | undefined>;
};

export type OrgType = {
  id: string;
  name: string;
  shortDescription: string;
  primaryDefinition?: string;
  comparisonHref?: string;
  legalPersonhood: string;
  scale: string;
  decisionMaking: string;
  membershipModel: string;
  capitalModel: string;
  purposeOrientation: string;
};

export type Mechanism = {
  id: string;
  name: string;
  systemType: string;
  scale: string;
  coordination: string;
  desc?: string;
  panelDesc?: string;
  trackRecord?: string;
  governanceRequirements?: string;
  resourceRequirements?: string;
};

export type Domain = { id: string; name: string; description?: string };

export type SnapshotFiles = {
  protocols: Tool[];
  affordances: Affordance[];
  domains: Domain[];
  "entity-types": unknown[];
  "organization-types": OrgType[];
  "monetary-architecture": Mechanism[];
  "tool-relationships"?: unknown;
};

export const SNAPSHOT_FILES = [
  "protocols",
  "affordances",
  "domains",
  "entity-types",
  "organization-types",
  "monetary-architecture",
  "tool-relationships",
] as const;
export type SnapshotName = (typeof SNAPSHOT_FILES)[number];
