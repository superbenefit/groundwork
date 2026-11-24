## Picks

| Model | Errors | Core needs found | Precision | p50 latency | max latency | Cost per 1,000 runs |
|---|---|---|---|---|---|---|
| gemma-4-26b-a4b-it | 0 | 95% | 92% | 1.5 s | 21.2 s | $0.120 |
| qwen3.8-27b | 0 | 90% | 88% | 1.8 s | 7.6 s | $0.620 |
| clef | 0 | 95% | 94% | 0.6 s | 1.0 s | $1.124 |
| clef-flash | 0 | 95% | 100% | 0.3 s | 0.9 s | $0.178 |
| clairic | 0 | 90% | 84% | 2.3 s | 16.3 s | $3.417 |

| Persona | gemma-4-26b-a4b-it | qwen3.8-27b | clef | clef-flash | clairic |
|---|---|---|---|---|---|
| riverside | transparent-resource-governance, consent-governance, self-hostable, local-first-storage (off: self-hostable, local-first-storage) | consent-governance, transparent-resource-governance, slow-deliberation, non-gamified-tracking (off: non-gamified-tracking) | transparent-resource-governance, consent-governance, slow-deliberation | transparent-resource-governance, consent-governance | transparent-resource-governance, consent-audience, consent-governance, provenance-tracking, dissent-pathways (off: consent-audience, provenance-tracking) |
| repair-network | decentralized-calendar, data-portability, protocol-federation, cross-instance-federation | decentralized-calendar, data-portability, cross-instance-federation, local-first-storage | data-portability, decentralized-calendar, composable-groups, nested-coordination, interoperable-formats | decentralized-calendar, data-portability, interoperable-formats, nested-coordination | decentralized-calendar, composable-groups, interoperable-formats, data-portability, knowledge-commons (off: knowledge-commons) |
| solo-researcher | local-first-storage, data-portability, offline-mesh | local-first-storage, data-portability, offline-mesh | data-portability, local-first-storage, interoperable-formats, offline-mesh, e2e-encryption | local-first-storage, data-portability, offline-mesh, interoperable-formats | local-first-storage, offline-mesh, data-portability, e2e-encryption |
| housing-coop | consent-governance, slow-deliberation, dissent-pathways, composable-groups | consent-governance, slow-deliberation, dissent-pathways, incremental-decentralization (off: incremental-decentralization) | slow-deliberation, consent-governance, dissent-pathways, incremental-decentralization, version-controlled-memory (off: incremental-decentralization) | slow-deliberation, consent-governance | slow-deliberation, dissent-pathways, consent-governance, consent-audience, offline-mesh (off: consent-audience, offline-mesh) |
| grants-dao | transparent-resource-governance, consent-governance, provenance-tracking | transparent-resource-governance, consent-governance, provenance-tracking, version-controlled-memory (off: version-controlled-memory) | transparent-resource-governance, consent-governance, slow-deliberation, provenance-tracking | transparent-resource-governance, consent-governance | transparent-resource-governance, consent-governance, dissent-pathways |
| mutual-aid | private-need-expression, relational-matching, consent-audience | private-need-expression, relational-matching, non-monetary-exchange, incremental-decentralization (off: incremental-decentralization) | private-need-expression, relational-matching, e2e-encryption, consent-audience, incremental-decentralization (off: incremental-decentralization) | private-need-expression, relational-matching, e2e-encryption | private-need-expression, privacy-preserving-ai, e2e-encryption, consent-audience, relational-matching (off: privacy-preserving-ai) |
| worker-coop | consent-governance, transparent-resource-governance, self-hostable (off: self-hostable) | consent-governance, provenance-tracking, version-controlled-memory, self-hostable (off: self-hostable) | consent-governance, transparent-resource-governance, provenance-tracking, version-controlled-memory, slow-deliberation | transparent-resource-governance, consent-governance, provenance-tracking, version-controlled-memory | transparent-resource-governance, ephemeral-archival, consent-governance, version-controlled-memory, provenance-tracking (off: ephemeral-archival) |
| festival | offline-mesh, local-first-storage, decentralized-calendar | offline-mesh, decentralized-calendar, local-first-storage, self-hostable | offline-mesh, local-first-storage, self-hostable, local-network-routing | offline-mesh, self-hostable | offline-mesh, local-first-storage, local-network-routing, privacy-preserving-ai, self-hostable (off: privacy-preserving-ai) |
| seed-library | knowledge-commons, self-hostable, data-portability, interoperable-formats | knowledge-commons, cross-instance-federation, data-portability, self-hostable | data-portability, interoperable-formats, self-hostable, knowledge-commons, provenance-tracking (off: provenance-tracking) | interoperable-formats, data-portability, self-hostable, knowledge-commons, cross-instance-federation | self-hostable, knowledge-commons, conflict-free-editing, interoperable-formats, data-portability |
| startup-team | data-portability, version-controlled-memory, knowledge-commons, interoperable-formats | data-portability, knowledge-commons, interoperable-formats, self-hostable | data-portability, interoperable-formats, knowledge-commons, version-controlled-memory, self-hostable | interoperable-formats, data-portability, knowledge-commons | data-portability, interoperable-formats, local-first-storage |

## Writing

| Model | Query hit rate | Empty queries | Query rule breaks | Note rule breaks | Chat rule breaks (off) | Chat rule breaks (low) | p50 chat latency | Cost per 1,000 chat turns |
|---|---|---|---|---|---|---|---|---|
| deepseek-v4.1-flash-1017 | 60% | 0/30 | 1/10 | 2/4 | 3/6 | 4/6 | 2.3 s | $0.497 |
| inkling-2-small | 54% | 0/30 | 0/10 | 0/4 | 4/6 | 3/6 | 2.4 s | $0.938 |
| gemma-4-26b-a4b-it | 53% | 0/30 | 0/10 | 0/4 | 5/6 | – | 2.9 s | $0.167 |
| qwen3.8-27b | 49% | 0/30 | 1/10 | 2/4 | 1/6 | 1/6 | 5.2 s | $0.844 |

### Rule breaks

- deepseek-v4.1-flash-1017 queries worker-coop: jargon
- deepseek-v4.1-flash-1017 notes grants-dao: long(26)
- deepseek-v4.1-flash-1017 notes festival: long(27)
- deepseek-v4.1-flash-1017 chat Can we use Moss without running our own server?: not-answer-first, other-tools(Holochain)
- deepseek-v4.1-flash-1017 chat Is Group Income free to use?: banned
- deepseek-v4.1-flash-1017 chat Which tool is best for us?: banned, other-tools(Holochain)
- deepseek-v4.1-flash-1017 chatLow Can we use Moss without running our own server?: other-tools(Holochain)
- deepseek-v4.1-flash-1017 chatLow Which of these work on a phone?: not-answer-first
- deepseek-v4.1-flash-1017 chatLow Is Group Income free to use?: not-answer-first
- deepseek-v4.1-flash-1017 chatLow Which tool is best for us?: banned
- inkling-2-small chat Can we use Moss without running our own server?: other-tools(Holochain)
- inkling-2-small chat Is Group Income free to use?: banned
- inkling-2-small chat What is the takeover risk for Hypha, and why?: other-tools(Cardano)
- inkling-2-small chat Which tool is best for us?: banned, other-tools(Cardano)
- inkling-2-small chatLow Can we use Moss without running our own server?: not-answer-first, other-tools(Holochain)
- inkling-2-small chatLow Is Group Income free to use?: banned
- inkling-2-small chatLow Which tool is best for us?: banned, other-tools(Holochain)
- gemma-4-26b-a4b-it chat Can we use Moss without running our own server?: other-tools(Holochain)
- gemma-4-26b-a4b-it chat Which of these work on a phone?: not-answer-first
- gemma-4-26b-a4b-it chat Is Group Income free to use?: not-answer-first
- gemma-4-26b-a4b-it chat Which tool is best for us?: banned, not-answer-first
- gemma-4-26b-a4b-it chat Does Bonfire support secret ballots?: not-answer-first
- qwen3.8-27b queries worker-coop: jargon
- qwen3.8-27b notes grants-dao: long(26)
- qwen3.8-27b notes worker-coop: long(26)
- qwen3.8-27b chat Which tool is best for us?: banned, long(123), not-answer-first, other-tools(Holochain)
- qwen3.8-27b chatLow Which tool is best for us?: banned

### Samples

#### deepseek-v4.1-flash-1017

- Note (grants-dao, legal): Your group's Wyoming DAO LLC is in progress, so choose software that fits that legal wrapper and lets your group change rules as the LLC forms.
- Note (worker-coop, decision): Your group needs software that logs circle and general meeting decisions for every worker-owner to review, with no server to run.
- Note (festival, setup): Your group has one volunteer who can run a Raspberry Pi, so self-hosted offline tools are an option; weigh that against takeover risk if that volunteer leaves.
- Note (seed-library, reach): Your group spans four countries with rural members, so pick software that works offline and syncs later.
- Queries (riverside): open source voting tool · participatory budgeting software · community group decision tool — "Your group needs a free, no-setup tool for member voting on purchases and shared spending records."
- Queries (repair-network): decentralized volunteer scheduling · shared calendar no owner · open source shift scheduling — "Your group needs shared volunteer scheduling across repair cafés with no single owner and phone access."
- Queries (solo-researcher): offline note taking sync · encrypted notes local storage · open source field notes app — "Your group needs offline research note tools with sync and data export."
- Q: Can we use Moss without running our own server?
  A: Yes, with one condition: each group and each Tool forms its own private peer-to-peer network on Holochain, so no central server is needed. Evidence: Moss is described as composable peer-to-peer groupware built on Holochain, with downloadable releases for macOS, Windows and Linux. Reviewed 2026-07-01. Unknown from the briefing: whether setup needs skills beyond installing the app, and whether voting and open spending tools exist in its library.
- Q: Which of these work on a phone?
  A: Not known from the briefing. The briefing does not say which options run on a phone. It lists desktop and platform details only: Moss has downloadable releases for macOS, Windows and Linux, and Group Income and Hypha list web frontends (Vue.js) with no phone statement. Bonfire lists a stack (Elixir, Phoenix, LiveView) with no phone statement. All four were reviewed between 2026-03-09 and 2026-07-01. Check each project's own install page for phone support before your group decides.
- Q: Is Group Income free to use?
  A: Yes. Group Income is released under AGPL-3.0, an open-source license, and is developed by the okTurtles Foundation, a US non-profit. Reviewed 2026-07-01. The briefing does not state whether hosting or any related service carries a cost.
- Q: What is the takeover risk for Hypha, and why?
  A: Moderate (3/5). The briefing says Hypha is an open DAO platform tied to blockchain ecosystems and a token, with token-based governance and regulatory exposure from the Hypha token and EOS. Reviewed 2026-07-01. Not known from the briefing: the full funding and key-org dependency details.
- Q: Which tool is best for us?
  A: No single tool is best for your group. The briefing gives no ranking. - **Bonfire Networks:** low takeover risk (2/5), reviewed 2026-03-09. Needs building a custom community; no setup skills is a problem. - **Group Income:** low takeover risk (2/5), reviewed 2026-07-01. Has polls and group governance; funding includes crypto donations. - **Hypha:** moderate takeover risk (3/5), reviewed 2026-07-01. Tied to blockchain and a token, which your group rules out. - **Moss:** low takeover risk (2/5), reviewed 2026-07-01. Beta, tied to Holochain and a key founder. Unknown from the briefing: which fits one neighbourhood, agreement-based decisions, or no-server running.
- Q: Does Bonfire support secret ballots?
  A: Not known from the briefing. The Bonfire entry lists its maturity (released beta, active development), takeover risk (low, 2/5), license (AGPL-3.0) and stack (Elixir, Phoenix, LiveView), reviewed 2026-03-09. It describes a modular federated toolkit for custom communities with fine-grained governance, but says nothing about secret or anonymous ballots. The briefing does not state whether any option supports secret ballots.

#### inkling-2-small

- Note (grants-dao, legal): Your group’s Wyoming DAO LLC is in progress, so software should stay adaptable. On-chain payouts aid transparency; flexible rules and human review fit your votes.
- Note (worker-coop, decision): Your group’s sociocracy circles plus general-meeting big calls point to hosted tools with shared audit trails for profit-sharing decisions. Trade-off: strict enforcement versus judgement-based logging.
- Note (festival, setup): Your group can consider software running on a Raspberry Pi offline for phones. Trade-off: one volunteer holds setup, so plan takeover risk and reviewed handover.
- Note (seed-library, reach): Your group spans four countries, mostly rural. Software must run on low bandwidth, host copies, export data. Trade-off: simpler travels better; richer needs support.
- Queries (riverside): decentralized member voting · free budget transparency · no server group poll — "Your group needs free, no-server tools that let neighbours vote on tool buys and see where the money goes."
- Queries (repair-network): open source volunteer scheduling · decentralized shared roster · self-hosted scheduling export — "Your group needs phone-friendly, exportable scheduling tools for repair cafés to share volunteer rosters without one owner."
- Queries (solo-researcher): offline notes sync · local first notes · markdown notes export — "Your group needs offline field notes that sync between laptop and phone, with exportable data and solo control."
- Q: Can we use Moss without running our own server?
  A: Yes, as far as the briefing shows. Moss is peer-to-peer groupware built on Holochain. Each group and each Tool forms its own private P2P network. Downloadable releases are available for macOS, Windows and Linux. Maturity is Beta, with group-onboarding beta and active development. Takeover risk is low (2/5). License is CAL-1.0. Reviewed: 2026-07-01. What is unknown: the briefing does not say whether you need any always-on node, relay, bootstrap service or setup work. Your group has no setup skills, so that gap matters. It also does not state hosting costs or offline behavior.
- Q: Which of these work on a phone?
  A: Not known from the briefing. None of the four options states phone or mobile support. Bonfire Networks lists Elixir, Phoenix, LiveView and Surface UI, reviewed 2026-03-09. Group Income lists Vue.js, Hapi.js, Chelonia, chat, polls and file sharing, reviewed 2026-07-01. Hypha lists a TypeScript and Vue.js web client, reviewed 2026-07-01. Moss lists downloadable releases for macOS, Windows and Linux and a Tauri desktop stack, reviewed 2026-07-01. What is unknown: whether any of these run in a phone browser, have iOS or Android apps, or are usable on a phone at all. You would need to check each project directly before deciding.
- Q: Is Group Income free to use?
  A: Not known from the briefing. The briefing does not state a price or whether a hosted version is free for you. It says Group Income is open source under AGPL-3.0, developed by the okTurtles Foundation, a US 501(c)(3) non-profit, funded by donations, with no token. Maturity is Released production, v2.8 in April 2026. Takeover risk is low (2/5). Reviewed: 2026-07-01. Unknown: any subscription, hosting, setup, or support costs, and whether you would need to run infrastructure yourself. Your group rules out cost and running a server, so those points are not answered here.
- Q: What is the takeover risk for Hypha, and why?
  A: Moderate (3/5). Hypha is an open DAO platform tied to blockchain ecosystems and a token. It is developed by the Hypha DAO and open-sourced, with token-based governance. The briefing also flags regulatory and jurisdictional exposure around the Hypha token and EOS, but the text is cut off there. Maturity is Beta: Beta Program launched 2023, dao.hypha.earth operational, active development, EOS home chain, Cardano and Substrate in progress. License is open source, GPL/unspecified per repos. Reviewed: 2026-07-01. For your group, the token and blockchain basis conflicts with your rule against crypto. The full regulatory detail is not known from the briefing because the entry is truncated.
- Q: Which tool is best for us?
  A: I can’t call one best. Your group rules out crypto, cost, running a server, and has no setup skills. Hypha is tied to tokens and EOS/Cardano/Substrate, so it conflicts with the crypto rule; maturity Beta; takeover risk moderate (3/5); reviewed 2026-07-01. Bonfire is a modular toolkit for building custom communities, so setup burden is unclear and likely needs skills; maturity v1.0.0-beta/v1.0.1 alpha; takeover risk low (2/5); reviewed 2026-03-09. Group Income is production v2.8, with polls and group governance, AGPL-3.0, non-profit, no token; takeover risk low (2/5); reviewed 2026-07-01. Moss is Beta with downloadable desktop releases and group tools; takeover risk low (2/5); reviewed 2026-07-01. Unknown: exact costs, hosting needs, and whether Group Income’s BTC/XMR/ZEC donations matter to your crypto rule.
- Q: Does Bonfire support secret ballots?
  A: Not known from the briefing. The briefing says Bonfire Networks is an open-source, modular, federated social networking toolkit and framework for building custom digital communities and social applications with fine-grained governance. Its maturity is listed as Released (v1.0.0-beta / v1.0.1 social alpha, active development). Takeover risk is low (2/5). It was reviewed on 2026-03-09. The briefing does not say whether Bonfire supports secret ballots, voting at all, or ballot privacy as a built-in feature or extension. It also does not say what setup your group would need. You would need to check Bonfire’s current docs or ask the project before relying on it for member voting.

#### gemma-4-26b-a4b-it

- Note (grants-dao, legal): Your group is forming a Wyoming DAO LLC. You must choose software that aligns with this legal structure and your preference for human judgment.
- Note (worker-coop, decision): Your group needs software that supports circle structures and general meetings. You must choose tools that allow for transparent profit-sharing reviews.
- Note (festival, setup): Your group can use a Raspberry Pi for offline coordination. This option requires one volunteer to manage the hardware.
- Note (seed-library, reach): Your group has members in rural areas across four countries. Choose software that works with low internet speeds and offline access.
- Queries (riverside): community voting tools · shared expense tracker · collaborative decision making — "You and your group need software to manage local tool lending and community voting without technical setup."
- Queries (repair-network): decentralized scheduling tools · peer to peer calendars · distributed volunteer management — "Your group needs decentralized software to share volunteer schedules without a single owner."
- Queries (solo-researcher): offline markdown notes · decentralized note sync · distributed field notes — "You and your group need decentralized tools for offline ethnographic note-taking with mobile and laptop synchronization."
- Q: Can we use Moss without running our own server?
  A: No. The briefing does not state if you can use Moss without running a server. You and your group must consider that Moss uses a peer-to-peer network where each group forms its own private network. Moss is in beta and has downloadable releases for macOS, Windows, and Linux. The takeover risk is low (2/5) because it is tied to a founder and the Holochain ecosystem. It was reviewed on 2026-07-01.
- Q: Which of these work on a phone?
  A: It is not known from the briefing if any of these options work on a phone. The briefing provides the following information regarding software stacks and availability: * Bonfire Networks uses Elixir and Phoenix. Reviewed 2026-03-09. * Group Income uses Vue.js and Hapi.js. Reviewed 2026-07-01. * Hypha uses TypeScript, Vue.js, C++, Rust, and Java. Reviewed 2026-07-01. * Moss offers downloadable releases for macOS, Windows, and Linux. Reviewed 2026-07-01. The briefing does not mention mobile operating systems or phone compatibility for you and your group.
- Q: Is Group Income free to use?
  A: It is not known from the briefing if Group Income is free to use. The briefing states it is a non-profit application under the AGPL-3.0 license (Reviewed 2026-07-01). It mentions the okTurtles Foundation is funded by donations (Reviewed 2026-07-01). The briefing does not state whether users must pay to use the platform.
- Q: What is the takeover risk for Hypha, and why?
  A: Yes, the takeover risk for Hypha is moderate (3/5). It is an open DAO platform tied to blockchain ecosystems and a token. Governance and legal control is a 3/5 because it is developed by the Hypha DAO and uses token-based governance. Regulatory and jurisdictional exposure is also a 3/5 due to the Hypha token and EOS. This information was reviewed on 2026-07-01. It is not known from the briefing how these factors specifically impact your group.
- Q: Which tool is best for us?
  A: It is not known from the briefing which tool is best for you and your group. You have options with different trade-offs. Bonfire Networks is a modular social networking toolkit with low takeover risk (reviewed 2026-03-09). Group Income is a coordination platform with chat, polls, and file sharing; it has low takeover risk (reviewed 2026-07-01). Hypha provides governance and treasury tools but has moderate takeover risk due to its tie to blockchain and a token (reviewed 2026-07-01). Moss allows you to assemble custom tool suites from a library; it has low takeover risk (reviewed 2026-07-01). The briefing does not state if these tools require setup skills or running a server. It also does not mention if these tools use crypto.
- Q: Does Bonfire support secret ballots?
  A: It is not known from the briefing if Bonfire Networks supports secret ballots. The briefing describes Bonfire Networks as an open-source, modular, federated social networking toolkit for building custom digital communities. It mentions fine-grained governance. It does not list specific voting features like secret ballots. The briefing was reviewed on 2026-03-09.

#### qwen3.8-27b

- Note (grants-dao, legal): Your group’s Wyoming DAO LLC status requires software that supports legal entity integration. Choose tools that align with your on-chain tracking needs and evolving governance rules.
- Note (worker-coop, decision): Your group uses sociocracy circles. Choose software that supports distinct circle levels and general meeting votes. This structure ensures profit-sharing decisions remain auditable by every worker-owner.
- Note (festival, setup): Your group needs software running on a single Raspberry Pi. This limits choices to lightweight tools that one volunteer can manage offline.
- Note (seed-library, reach): Your group spans four countries with rural members. Choose software that works on low bandwidth and allows local hosting.
- Queries (riverside): offline voting tool · simple expense tracker · no server budget app — "Your group needs a simple, free, offline tool to vote on purchases and track spending."
- Queries (repair-network): decentralized volunteer scheduling · peer to peer roster · open source shift planner — "Your group needs shared volunteer scheduling where no single entity owns the data."
- Queries (solo-researcher): offline field notes · sync research notes · exportable note app — "Your group needs offline-capable, exportable note software for solo ethnographic fieldwork."
- Q: Can we use Moss without running our own server?
  A: Yes. Moss is peer-to-peer groupware where each group forms its own private P2P network. This design removes the need for a central server. The briefing reviewed Moss on 2026-07-01. It is unknown if specific network conditions or device requirements apply to your group.
- Q: Which of these work on a phone?
  A: Not known from the briefing. The facts list desktop stacks like Elixir, Vue.js, and Tauri, but do not state if any option runs on a phone. You and your group cannot confirm mobile support from this text.
- Q: Is Group Income free to use?
  A: Yes. Group Income is open-source under the AGPL-3.0 license. This license allows free use, modification, and distribution. The platform is funded by donations, not user fees. This fact was reviewed on 2026-07-01. The briefing does not specify if any third-party services used by Group Income charge separate fees.
- Q: What is the takeover risk for Hypha, and why?
  A: Moderate (3/5). Hypha is an open DAO platform tied to blockchain ecosystems and a token. Governance and legal control score 3 because it is developed by the Hypha DAO with token-based governance. Regulatory and jurisdictional exposure scores 3 due to the Hypha token and EOS home chain. Reviewed 2026-07-01.
- Q: Which tool is best for us?
  A: The briefing does not rank options or call any tool best. Bonfire is in alpha, uses Elixir, and has low takeover risk. Group Income is in production, uses Vue.js, and has low takeover risk. Hypha is in beta, uses blockchain, and has moderate takeover risk. Moss is in beta, uses Holochain, and has low takeover risk. You and your group rule out crypto, cost, running a server, and lack setup skills. Hypha uses tokens and blockchain. Bonfire, Group Income, and Moss are open source. The briefing does not state which tools require running a server or specific setup skills. It does not state which tools are free. It does not state which tools fit a 2 to 10 person group deciding by agreement.
- Q: Does Bonfire support secret ballots?
  A: Not known from the briefing. The briefing describes Bonfire Networks as a modular, federated social networking toolkit with fine-grained governance. It lists the stack (Elixir, Phoenix, LiveView) and maturity (v1.0.0-beta). It does not state whether Bonfire supports secret ballots. The review date is 2026-03-09.
