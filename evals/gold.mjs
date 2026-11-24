// Hand-labelled capability sets per eval persona (M0 model eval).
// must: capabilities the question cannot be answered without.
// ok: capabilities that are a reasonable, relevant pick.
// Anything else counts as an off-target pick. Labels are a judgement call; review them in docs/evals/models.md.
export const GOLD = {
  riverside: {
    must: ["consent-governance", "transparent-resource-governance"],
    ok: ["slow-deliberation", "dissent-pathways", "composable-groups", "non-monetary-exchange"],
  },
  "repair-network": {
    must: ["decentralized-calendar", "data-portability"],
    ok: ["cross-instance-federation", "protocol-federation", "nested-coordination", "composable-groups", "local-first-storage", "interoperable-formats", "conflict-free-editing"],
  },
  "solo-researcher": {
    must: ["local-first-storage", "conflict-free-editing"],
    ok: ["data-portability", "interoperable-formats", "offline-mesh", "e2e-encryption", "version-controlled-memory", "self-hostable"],
  },
  "housing-coop": {
    must: ["consent-governance"],
    ok: ["slow-deliberation", "dissent-pathways", "version-controlled-memory", "composable-groups", "provenance-tracking"],
  },
  "grants-dao": {
    must: ["transparent-resource-governance"],
    ok: ["consent-governance", "provenance-tracking", "slow-deliberation", "dissent-pathways", "open-credentials", "portable-attestations", "sovereign-identity", "composable-groups"],
  },
  "mutual-aid": {
    must: ["private-need-expression", "relational-matching"],
    ok: ["consent-audience", "contextual-disclosure", "non-monetary-exchange", "community-mapping", "e2e-encryption", "trust-graph-portability"],
  },
  "worker-coop": {
    must: ["consent-governance", "transparent-resource-governance"],
    ok: ["provenance-tracking", "version-controlled-memory", "nested-coordination", "composable-groups", "dissent-pathways", "slow-deliberation"],
  },
  festival: {
    must: ["offline-mesh"],
    ok: ["decentralized-calendar", "local-first-storage", "local-network-routing", "nested-coordination", "conflict-free-editing", "self-hostable"],
  },
  "seed-library": {
    must: ["knowledge-commons"],
    ok: ["self-hostable", "cross-instance-federation", "protocol-federation", "data-portability", "interoperable-formats", "conflict-free-editing", "local-first-storage", "incremental-decentralization", "geographic-data-federation", "community-mapping"],
  },
  "startup-team": {
    must: ["data-portability", "knowledge-commons"],
    ok: ["version-controlled-memory", "interoperable-formats", "portable-attestations", "open-credentials", "self-hostable", "local-first-storage", "provenance-tracking"],
  },
};
