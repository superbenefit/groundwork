# Briefing runs

Preview: https://m0-spike-groundwork.superbenefit.workers.dev

| Persona | Result | Time | Composed by | Compose attempts | Needs | Options | Set aside |
|---|---|---|---|---|---|---|---|
| riverside-mockup | done | 14.9 s | model | 1 | transparent-resource-governance, slow-deliberation, consent-governance, non-monetary-exchange | bonfire-networks, group-income, hypha, moss | holons, ixo, spiritdao-community-app, mutual-credit-clearing |
| riverside | done | 13.5 s | model | 1 | transparent-resource-governance, consent-governance, slow-deliberation | group-income, holons, hypha, moss | ixo, spiritdao-community-app, quadratic-funding, retroactive-public-goods-funding |
| repair-network | done | 13.0 s | model | 1 | decentralized-calendar, nested-coordination, protocol-federation, conflict-free-editing | activitypods, affine, anytype, bluesky, cryptpad, mobilizon | flotilla, holons, mastodon, activitypub |
| solo-researcher | done | 15.3 s | model | 1 | local-first-storage, offline-mesh | affine, anytype, appflowy, bittorrent-mainline-dht, briar, kwaainet | bitchat |
| housing-coop | done | 14.9 s | model | 1 | consent-governance, transparent-resource-governance | group-income, holons, hypha, moss | ixo, spiritdao-community-app, quadratic-funding, retroactive-public-goods-funding |
| grants-dao | done | 15.9 s | model | 1 | transparent-resource-governance, consent-governance | group-income, holons, hypha, moss, quadratic-funding, retroactive-public-goods-funding |  |
| mutual-aid | done | 14.9 s | model | 1 | relational-matching, private-need-expression, emotion-aware-design, e2e-encryption, consent-audience | bitchat, briar, cryptpad, internxt, itsnoon, jami | bonfire-networks, matrix, nostr, activitypub |
| worker-coop | done | 16.5 s | model | 1 | transparent-resource-governance, consent-governance, version-controlled-memory | fluree, group-income, holons, hypha, ixo, moss | quadratic-funding, retroactive-public-goods-funding, mutual-credit-clearing, mutual-credit-on-blockchain |
| festival | done | 13.8 s | model | 1 | offline-mesh, local-network-routing | bitchat, briar | bittorrent-mainline-dht, tinyssb, lokinet, meshcore |
| seed-library | done | 15.7 s | model | 1 | slow-deliberation, self-hostable, cross-instance-federation, conflict-free-editing, consent-governance | affine, anytype, hypha, moss, nextcloud, twake-workplace | holons, holochain, shelter-protocol, beckn-protocol |
| startup-team | done | 15.5 s | model | 1 | interoperable-formats, data-portability, knowledge-commons, version-controlled-memory, provenance-tracking | buzz, fluree, geo-genesis, json-ld, logseq, owl | ngit, zapstore |

## riverside-mockup

**Tools for member voting and open spending**

> Your group wants members to vote on purchases and see where money goes, with no crypto wallet, no cost, and data you can take out. You lean toward everyone having a say, rules that change, and people using judgement over software enforcing rules. One option meets the voting and spending need; three others cover parts of your needs with gaps still unknown.
> The comparison lists four options. Checks for several needs are unknown for most of them, and all four were reviewed between March and July 2026.

- Need: Members vote on purchases and see where money goes (transparent-resource-governance, p=0.868)
- Need: Members get time to think before a decision (slow-deliberation, p=0.83)
- Need: Consent-based governance (consent-governance, p=0.447)
- Need: Non-monetary exchange (non-monetary-exchange, p=0.329)
- Leaning speedSay=4: Because you lean toward everyone having a say, favour a tool where every member can vote and see the result, not one where a few decide.
- Leaning stableAdapt=4: Because you lean toward rules that change, favour a tool where the group can edit its own decision rules without a developer.
- Leaning autoJudge=4: Because you lean toward people using judgement, favour a tool that records votes and leaves enforcement to the group.
- How to choose — Voting and spending visibility: Group Income is the only option checked as meeting the need for members to vote on purchases and see where money goes. The other three are unknown on this need. If this need is fixed for your group, the unknown checks on the other options matter less.
- How to choose — Crypto and cost: Hypha is unknown on both no crypto and free. It is described as tied to blockchain ecosystems and a token, and its takeover risk is moderate. Bonfire Networks, Group Income and Moss are checked as no crypto and free.
- How to choose — Taking data out: Moss is the only option checked as allowing data export. Bonfire Networks, Group Income and Hypha are unknown on export. Your group needs export, so check this before relying on any of them.
- How to choose — Consent and non-monetary exchange: Hypha and Moss are checked as meeting consent-based governance. Bonfire Networks and Group Income are checked as meeting non-monetary exchange. No option is checked as meeting the need for members to get time to think before a decision.
- Safeguard — Because you lean toward everyone having a say: A few active members make decisions while the rest find out afterwards. → Set a minimum notice period and a quorum for purchase votes, and post every result where all members can see it.
- Safeguard — Because you lean toward rules that change: Decision rules drift, and no one can say which version applied to a past vote. → Keep a dated list of rule changes and note which version each vote used.
- Safeguard — Because you lean toward people using judgement: Without software checks, spending limits and vote thresholds are missed. → Have one member review each purchase against the agreed rules before money is spent, and write down the decision.
- Question (all): Can the group change its own decision rules without a developer?
- Question (bonfire-networks, group-income, hypha): Can members export their data if the group leaves?
- Question (hypha): Does any part require tokens or a crypto wallet?
- Question (hypha): Does the free tier cover what your group needs?
- Set aside holons: Meets 1 of your 4 needs: Consent-based governance. Its data can't be exported. You need to be able to take your data out.
- Set aside ixo: Meets 1 of your 4 needs: Members vote on purchases and see where money goes. It needs tokens or a crypto wallet to use. You ruled out crypto. It costs money to use. You ruled out cost.
- Set aside spiritdao-community-app: Meets 1 of your 4 needs: Members vote on purchases and see where money goes. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside mutual-credit-clearing: Meets 2 of your 4 needs: Consent-based governance; Non-monetary exchange. It is a way of handling money, not a ready-made app. You said no one technical will set things up. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Legal: As a nonprofit or charity, your group holds shared money in its own name, and binding decisions are made by the body your governing document sets out. A software vote informs that body; it does not replace the decision rule in your constitution or bylaws. Check that your governing document allows the decision method you plan to use, and who may authorise spending.
- Legal: Check what your legal form requires for financial records, conflicts of interest, and member access to accounts. Check whether purchase votes must be minuted and kept.
- Kinds: bonfire-networks=Federated community toolkit; group-income=Group coordination platform; hypha=Governance and treasury platform; moss=Peer-to-peer groupware

## riverside

**Software for member voting and shared spending**

> Your group wants members to vote on tool purchases and see where the money goes. You lean toward everyone having a say, rules that change, and people using judgement rather than software enforcing rules. Your hard requirements are no crypto, free, and no server to run.
> One of the four options is checked as meeting the spending-and-voting need. Three are checked as logging who agreed and why. None is checked as giving time to think before a vote closes. Several checks are unknown for most options.

- Need: Members see spending and vote on tool purchases (transparent-resource-governance, p=0.915)
- Need: Decisions logged with who agreed and why (consent-governance, p=0.815)
- Need: Time to think before a vote closes (slow-deliberation, p=0.808)
- Leaning speedSay=4: Because your group wants everyone to have a say, a tool that lets all members vote and see the result matters more than one built for fast decisions by a few.
- Leaning stableAdapt=4: Because your group wants rules that change, a tool whose decision rules members can adjust without a developer fits better than one with fixed rules.
- Leaning autoJudge=2: Because your group leans toward people using judgement, a tool that leaves room for discussion and case-by-case calls fits better than one that enforces rules automatically.
- How to choose — Spending and voting in one place: Group Income is the only option checked as letting members see spending and vote on tool purchases. For the other three, that check is unknown. If seeing the money and voting on it must happen in the same tool, the unknown checks matter a lot.
- How to choose — A record of who agreed and why: Holons, Hypha and Moss are checked as logging who agreed and why. For Group Income that check is unknown. Your group decides by discussion until everyone agrees, so a written record of the reasoning may matter as much as the vote count.
- How to choose — Time to think before a vote closes: No option is checked as giving time to think before a vote closes. This need is unmet across the comparison. Ask each option's makers how a vote period is set, or plan to hold discussion outside the tool.
- How to choose — Setup without technical help: No one technical will set things up. Moss and Hypha are early releases; Group Income and Holons are in use. Whether the free tier covers your group is unknown for Hypha, and the no-server and no-crypto checks are unknown for Holons and Hypha. Ask before relying on any of them.
- Safeguard — Because your group wants everyone to have a say: A few active members make the calls and quieter members stop taking part. → Set a fixed voting window and a quorum, and post a plain summary of each decision where all members can see it.
- Safeguard — Because your group wants rules that change: Rules drift with each decision, and no one can say what the current rule is. → Keep one written page of decision rules with a date on each change, and agree who may edit it.
- Question (all): Can the group change its own decision rules without a developer?
- Question (holons, hypha): Does any part require tokens or a crypto wallet?
- Question (holons): Can your group use it without running a server?
- Question (hypha): Does the free tier cover what your group needs?
- Set aside ixo: Meets 1 of your 3 needs: Members see spending and vote on tool purchases. It needs tokens or a crypto wallet to use. You ruled out crypto. It costs money to use. You ruled out cost.
- Set aside spiritdao-community-app: Meets 1 of your 3 needs: Members see spending and vote on tool purchases. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside quadratic-funding: Meets 2 of your 3 needs: Members see spending and vote on tool purchases; Decisions logged with who agreed and why. It is a way of handling money, not a ready-made app. You said no one technical will set things up. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside retroactive-public-goods-funding: Meets 2 of your 3 needs: Members see spending and vote on tool purchases; Decisions logged with who agreed and why. It is a way of handling money, not a ready-made app. You said no one technical will set things up. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Legal: Your group is informal and not a legal organization. That means the group itself cannot open a bank account or hold money in its own name, and a vote has no legal force beyond what members agree to honour. Money is usually held by a named person or passed to a host organization, and that person carries the responsibility.
- Legal: Check who holds the money, what happens if that person leaves, and how spending is approved. Check whether your group needs a formal structure, such as a community group or co-operative, before it holds shared funds or makes binding decisions.
- Kinds: group-income=Encrypted group coordination app; holons=Payment splitter with chat bot; hypha=Governance and treasury platform; moss=Peer-to-peer groupware toolkit

## repair-network

**Software for sharing volunteer schedules across repair cafés**

> Your group wants several repair cafés to share volunteer schedules without one café owning the data. Your leanings point to rules that change easily and to people using judgement rather than software enforcing rules. One option, Mobilizon, is checked as meeting the shared-schedule need. The rest leave that need unknown.
> Several options are checked for protocol federation and for conflict-free editing. Phone support and data export are known for some options only. Whether local cafés keep their say within regional sharing is unknown for every option.

- Need: Share volunteer schedules across cafés without one owner (decentralized-calendar, p=0.808)
- Need: Local cafés keep their say within regional sharing (nested-coordination, p=0.469)
- Need: Protocol federation (protocol-federation, p=0.402)
- Need: Conflict-free editing (conflict-free-editing, p=0.386)
- Leaning speedSay=3: A balanced position on speed means the tool should let a few people act quickly while still giving everyone a route to a say.
- Leaning stableAdapt=4: You lean toward rules that change, so the tool should let your group revise how decisions are made without a developer.
- Leaning autoJudge=2: You lean toward people using judgement, so the tool should support decisions rather than enforce them.
- How to choose — Shared schedules versus local say: Mobilizon is checked as meeting the shared-schedule need, and it federates through ActivityPub. Whether local cafés keep their say within regional sharing is unknown for it. ActivityPods, AFFiNE, Anytype, BlueSky and CryptPad leave the shared-schedule need unknown. Weigh how much of the sharing you need covered by the tool itself.
- How to choose — Federation and conflict-free editing: ActivityPods, BlueSky and Mobilizon are checked for protocol federation. AFFiNE, Anytype and CryptPad are checked for conflict-free editing. No option is checked for both. Decide which of these two matters more for schedules edited by several cafés.
- How to choose — Phone and export: AFFiNE, Anytype, BlueSky, CryptPad and Mobilizon are checked for phone use. ActivityPods leaves phone use unknown. Anytype, BlueSky and CryptPad are checked for data export. ActivityPods is checked for export too. AFFiNE and Mobilizon leave export unknown. Your hard requirements make these two checks decisive.
- How to choose — Who sets it up: ActivityPods is a developer framework, and the person setting up your group can follow a guide rather than build software. Mobilizon runs on independently operated instances that federate. AFFiNE, Anytype, BlueSky and CryptPad are ready-made apps. Match the setup effort to the person you have.
- Safeguard — Because you lean toward rules that change: The group gets stuck with decision rules it cannot revise without a developer. → Write down how rules are changed and test one change during the trial.
- Safeguard — Because you lean toward people using judgement: The tool's settings quietly become the decision rules. → Agree which decisions stay with people and keep those out of the tool's settings.
- Question (all): Can the group change its own decision rules without a developer?
- Question (affine, mobilizon): Can members export their data if the group leaves?
- Question (activitypods): Does it work on members' phones?
- Set aside flotilla: Meets 1 of your 4 needs: Protocol federation. Its data can't be exported. You need to be able to take your data out.
- Set aside holons: Meets 1 of your 4 needs: Local cafés keep their say within regional sharing. Its data can't be exported. You need to be able to take your data out.
- Set aside mastodon: Meets 1 of your 4 needs: Protocol federation. Its data can't be exported. You need to be able to take your data out.
- Set aside activitypub: Meets 1 of your 4 needs: Protocol federation. It is a standard developers build on, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Legal: As a nonprofit or charity, your group can hold shared money and make binding decisions through its own governing document. Check who is authorised to commit the group and how that authority is recorded.
- Legal: Check what your legal form requires for holding funds jointly across cafés and for decisions that bind the network.
- Kinds: activitypods=Developer framework for personal data pods; affine=All-in-one workspace app; anytype=Encrypted local-first workspace app; bluesky=Decentralized social app; cryptpad=Encrypted collaborative office suite; mobilizon=Federated event and group platform

## solo-researcher

**Notes that sync between laptop and phone offline**

> You want research notes that stay on your laptop and phone, sync later, work on poor internet and export your data. You decide alone, and a developer sets it up. Your group is informal, not a legal organization.
> Five of the six options meet the sync need. Three meet the no-internet need. Whether notes work with no internet at all is unknown for three options, and data export is unknown for three.

- Need: Notes stay on my laptop and phone and sync later (local-first-storage, p=0.948)
- Need: Notes work with no internet at all (offline-mesh, p=0.682)
- Leaning speedSay=1: Because one person decides, you can choose a tool without a group vote, so weigh setup effort and your own workload over shared controls.
- Leaning stableAdapt=3: Because rules can change at a moderate pace, a tool whose structure you can adjust as your research changes suits you better than one with fixed structure.
- Leaning autoJudge=3: Because people use judgement at a moderate level, a tool that leaves decisions to you rather than enforcing them fits your work.
- How to choose — Notes versus infrastructure: AFFiNE, Anytype and Appflowy are note and workspace tools built for writing and organizing. BitTorrent Mainline DHT and KwaaiNet are networks, not note apps, so you would need a separate app on top. Briar is a messaging app, and its sync between laptop and phone is unknown. Match the kind of tool to the work you do.
- How to choose — Offline use: Anytype, Appflowy and AFFiNE are local-first or self-hosted, but whether they work with no internet at all is unknown for each. Briar, BitTorrent Mainline DHT and KwaaiNet state that they work with no internet at all. Check offline behaviour yourself before you rely on it.
- How to choose — Export: Anytype and Appflowy state that data export works. Export is unknown for AFFiNE, Briar, BitTorrent Mainline DHT and KwaaiNet. Your requirement is that data must be exportable, so confirm this for any option you consider.
- How to choose — Maturity and takeover risk: BitTorrent Mainline DHT is established with minimal takeover risk. Anytype, Appflowy and Briar are in use with low takeover risk. AFFiNE is in use with moderate takeover risk. KwaaiNet is an early release. Reviews for most options are over six months old, so check for changes since.
- Safeguard — Because one person decides, decisions rest on you alone.: A single person can miss a problem or leave no one able to take over. → Write down how the tool is set up and keep a copy of your notes outside it.
- Question (affine, bittorrent-mainline-dht, briar, kwaainet): Can members export their data if the group leaves?
- Set aside bitchat: Meets 1 of your 2 needs: Notes work with no internet at all. Its data can't be exported. You need to be able to take your data out.
- Legal: Your group is informal and not a legal organization. That means no separate body holds money or makes binding decisions on the group's behalf. Any shared money sits with an individual, and any decision binds only the people who agree to it.
- Legal: Check who owns the account and the data, and keep your own export. If the group later forms a legal organization, check how accounts and data would move to it.
- Kinds: affine=All-in-one workspace; anytype=Encrypted local-first notes app; appflowy=Self-hosted workspace app; bittorrent-mainline-dht=Peer discovery network; briar=Offline messaging app; kwaainet=Distributed AI network

## housing-coop

**Software for house rule changes between meetings**

> Maple Housing Co-op wants members to propose and approve house rule changes between meetings. Your group leans strongly toward everyone having a say, with rules that stay put and people using judgement rather than software enforcing rules. Three of the four options meet the proposal-and-approval need; one meets only the approval need. Several checks are still unknown, including whether some options need tokens or a crypto wallet.

- Need: Members propose rule changes and approve them between meetings (consent-governance, p=0.686)
- Need: Members see and approve changes to shared house rules (transparent-resource-governance, p=0.464)
- Leaning speedSay=5: Because your group wants everyone to have a say, the tool needs to let all members propose and vote, not just a small committee.
- Leaning stableAdapt=2: Because your group wants rules that stay put, the tool should make changes deliberate and visible rather than quick and informal.
- Leaning autoJudge=2: Because your group prefers people using judgement, the tool should support decisions without enforcing outcomes automatically.
- How to choose — Proposal and approval coverage: Group Income, Holons and Moss all report that members can propose rule changes and approve them between meetings. Hypha reports only that members see and approve changes to shared house rules. Group Income is the only option that reports meeting the approval need as well. Check each option against both of your needs before deciding.
- How to choose — Crypto and token exposure: Group Income and Moss report no crypto. Holons and Hypha list crypto as unknown. Hypha is described as a DAO platform tied to blockchain ecosystems and a token. Your group ruled out crypto, so confirm this point for Holons and Hypha before going further.
- How to choose — Maturity and takeover risk: Group Income and Holons are in use; Hypha and Moss are early releases. Group Income and Moss carry low takeover risk, Holons carries low risk with small-team dependency, and Hypha carries moderate risk. Weigh how much early-release status matters for a group with no technical setup help.
- How to choose — Setup without technical help: No one in your group is technical. Moss is a toolkit assembled from a library of tools, which may need more setup effort. Group Income is described as a richer collaboration suite. Ask each option's maintainers what setup involves for a group your size.
- Safeguard — Because your group wants everyone to have a say: A few active members make decisions between meetings and others find out afterwards. → Set a fixed notice period and a quorum for any between-meeting vote, and publish every proposal to all members.
- Safeguard — Because your group wants rules that stay put: Rules drift through small informal changes that are never written down. → Keep one dated list of house rules and record each approved change against it.
- Safeguard — Because your group prefers people using judgement: Software settings quietly decide what counts as passed or blocked. → Agree in writing how a vote is decided, and have a person confirm the result before it takes effect.
- Question (holons, hypha): Does any part require tokens or a crypto wallet?
- Set aside ixo: Meets 1 of your 2 needs: Members see and approve changes to shared house rules. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside spiritdao-community-app: Meets 1 of your 2 needs: Members see and approve changes to shared house rules. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside quadratic-funding: Meets 2 of your 2 needs: Members propose rule changes and approve them between meetings; Members see and approve changes to shared house rules. It is a way of handling money, not a ready-made app. You said no one technical will set things up. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside retroactive-public-goods-funding: Meets 2 of your 2 needs: Members propose rule changes and approve them between meetings; Members see and approve changes to shared house rules. It is a way of handling money, not a ready-made app. You said no one technical will set things up. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Legal: As a co-op, your group is owned and democratically controlled by its members, who share surplus by use and hold part of its capital in common. Holding shared money and making binding decisions are matters for your co-op's rules and your legal advice, not for the software alone. Check what your governing documents say about between-meeting decisions and who may commit shared funds.
- Legal: Check whether a vote held between meetings counts as binding under your rules, and what notice members must get. Check who is authorised to hold and move shared money, and what records your co-op must keep.
- Kinds: group-income=Encrypted group coordination app; holons=Peer appreciation payment system; hypha=Decentralized governance and treasury platform; moss=Peer-to-peer groupware toolkit

## grants-dao

**Software for grants allocation and on-chain payouts**

> Your group wants a transparent way to allocate a grants budget and track payouts on-chain. Your leanings point toward wide participation, rules that can change, and people using judgement rather than software enforcing rules. Three of the six options are known to let members see how grants money is held and spent; five are known to log, name, and revisit votes.
> What remains unknown is whether the other options cover money visibility, and whether any option lets your group change its own decision rules without a developer. Your Wyoming DAO LLC in progress may shape what records and signers you need.

- Need: Members see how grants money is held and spent (transparent-resource-governance, p=0.911)
- Need: Votes are logged, named, and can be revisited (consent-governance, p=0.826)
- Other (legal → company): A Wyoming DAO LLC in progress may shape what records and signers your group needs. Confirm the software supports that structure.
- Leaning speedSay=4: Because your group leans toward everyone having a say, choose a tool whose voting is open to all members rather than one that concentrates decisions in a few.
- Leaning stableAdapt=4: Because your group leans toward rules that change, choose a tool whose decision rules members can amend without a developer.
- Leaning autoJudge=5: Because your group leans toward people using judgement, choose a tool that presents decisions for review rather than one that acts on them automatically.
- How to choose — Money visibility: Group Income, Quadratic Funding, and Retroactive Public Goods Funding are known to let members see how grants money is held and spent. For Holons, Hypha, and Moss this is unknown. If visibility of the budget is a firm need, the unknown options need checking before you rely on them.
- How to choose — Voting and revisiting decisions: Holons, Hypha, Moss, Quadratic Funding, and Retroactive Public Goods Funding are known to log, name, and revisit votes. For Group Income this is unknown. Your group leans toward everyone having a say, so check how each tool records who voted and how a past vote is reopened.
- How to choose — Mechanism or platform: Quadratic Funding and Retroactive Public Goods Funding are allocation mechanisms, not full platforms; they set how matching or retrospective funds are divided. Group Income, Holons, Hypha, and Moss are platforms that carry coordination, payments, or governance. A mechanism may need a platform around it, but no combination is known to work for your group.
- How to choose — Maturity and takeover risk: Group Income, Holons, Quadratic Funding, and Retroactive Public Goods Funding are in use. Hypha and Moss are early release. Hypha carries moderate takeover risk; the others carry low risk. Weigh how much early-release status and takeover risk matter for a budget held across several countries.
- Safeguard — Because your group leans toward everyone having a say: A few active members make most decisions while the wider membership stays silent. → Set a quorum and a minimum voting window before each round, and publish turnout with every result.
- Safeguard — Because your group leans toward rules that change: Decision rules drift informally, and no one can say which version applied to a given round. → Keep a dated list of rule changes and the vote that approved each one, and link it from every decision.
- Safeguard — Because your group leans toward people using judgement: Without automatic checks, payouts go out with errors or without a second look. → Require a named reviewer to approve each payout before it is sent, and keep the approval with the payout entry.
- Question (all): Can the group change its own decision rules without a developer?
- Question (quadratic-funding, retroactive-public-goods-funding): Can people review a decision before it takes effect, or does it act automatically?
- Legal: A Wyoming DAO LLC in progress is a legal form that can hold shared money and make binding decisions through its members and signers. Until the registration completes, confirm who is authorised to move funds and whose signature the software must collect. After it completes, check that the software's signer and record-keeping setup matches what the LLC's operating agreement requires.
- Legal: Check whether the software can show a clear trail from each decision to each payout, since the LLC may need that trail for its own records. Confirm with a legal adviser what the LLC must keep and who must sign, before you commit to a tool.
- Kinds: group-income=Encrypted group coordination platform; holons=Peer-appreciation payment splitter; hypha=DAO governance and treasury platform; moss=Peer-to-peer groupware toolkit; quadratic-funding=Matching-fund allocation mechanism; retroactive-public-goods-funding=Retrospective impact funding mechanism

## mutual-aid

**Software for private help requests and neighbour matching**

> Your group wants neighbours to ask for help privately and be matched with people who can offer it. You lean toward rules that change, software that enforces rules, and a balanced pace of decision-making. None of the six options meets your matching, privacy or safety needs on the evidence reviewed. All six are free and work on phones, but the matching and consent questions remain unknown for most.
> What is still unknown: whether any option can match requests to helpers through trusted people, keep requests from public exposure, and feel safe rather than performative.

- Need: Neighbours match requests to helpers through people they trust (relational-matching, p=0.913)
- Need: People ask for help without public exposure (private-need-expression, p=0.851)
- Need: Asking and offering feel safe, not performative (emotion-aware-design, p=0.513)
- Need: End-to-end encrypted (e2e-encryption, p=0.456)
- Need: Consent-based audiences (consent-audience, p=0.441)
- Leaning speedSay=3: A balanced pace means the tool should let a few people act quickly on routine requests while keeping bigger calls open to everyone.
- Leaning stableAdapt=5: Rules that change means the tool must let your group rewrite its own decision rules without a developer.
- Leaning autoJudge=1: Software that enforces rules means the tool should apply your group's rules automatically rather than leaving each case to individual judgement.
- How to choose — Matching versus messaging: Bitchat, Briar and Jami are messaging and calling tools. They carry conversations but do not match a request to a helper. CryptPad and Internxt hold documents and files. Itsnoon is a framework for building community networks, not a ready-made matching tool. None of the six is described as matching requests to helpers.
- How to choose — Privacy of a request: Bitchat, Briar, CryptPad, Internxt and Jami are end-to-end encrypted. Itsnoon's encryption is unknown. Encryption protects a message in transit. It does not by itself keep a request from public exposure, and that check is unknown for every option.
- How to choose — Consent-based audiences: Itsnoon is the only option reviewed as meeting consent-based audiences. For the other five this is unknown. If your group needs each request shown only to chosen people, only Itsnoon has evidence on that point, and its free tier and phone support are unknown.
- How to choose — Takeover risk and maturity: Bitchat, Briar, CryptPad and Jami are low takeover risk. Internxt and Itsnoon are high takeover risk and were reviewed over six months ago. Low takeover risk means the tool is less likely to be controlled or changed by a single owner. All six are in use.
- Safeguard — Because your group leans toward rules that change, the typical failure is rules that get stuck because only a developer can edit them.: Rules that get stuck because only a developer can edit them. → Write the decision rules in a document the group can edit, and agree who may change them and how.
- Safeguard — Because your group leans toward software that enforces rules, the typical failure is the tool applying a rule the group did not intend.: The tool applying a rule the group did not intend. → Test each rule on a real case before relying on it, and keep a person able to override the tool.
- Question (all): Can the group change its own decision rules without a developer?
- Question (itsnoon): Does the free tier cover what your group needs?
- Question (itsnoon): Does it work on members' phones?
- Set aside bonfire-networks: Meets 1 of your 5 needs: Consent-based audiences. It has no phone app yet. You need one.
- Set aside matrix: Meets 2 of your 5 needs: End-to-end encrypted; Consent-based audiences. It is a standard developers build on, not a ready-made app. You said no one technical will set things up.
- Set aside nostr: Meets 2 of your 5 needs: End-to-end encrypted; Consent-based audiences. It is a protocol developers build on, not a ready-made app. You said no one technical will set things up.
- Set aside activitypub: Meets 1 of your 5 needs: Consent-based audiences. It is a standard developers build on, not a ready-made app. You said no one technical will set things up.
- Legal: Northside Mutual Aid is informal and not a legal organization. That means the group itself cannot hold a bank account or sign contracts in its own name. Any shared money is usually held by a named person or a host organization, and that person carries the legal duty for it. Binding decisions are agreements among members, not contracts the group can enforce as an organization.
- Legal: Check who holds shared money, what records they keep, and what happens if they step back. Check whether a host organization is needed before money changes hands. Check that any decision the group treats as binding is written down and agreed by the members who will carry it out.
- Kinds: bitchat=Offline mesh messaging app; briar=Peer-to-peer messaging app; cryptpad=Encrypted document workspace; internxt=Encrypted cloud storage; itsnoon=Community network framework; jami=Peer-to-peer calling app

## worker-coop

**Software for auditable profit-sharing decisions**

> Loom Studio wants profit-sharing decisions recorded and auditable by every worker-owner, with no server to run. The group leans toward everyone having a say (4 of 5) and is balanced on rules that stay put versus rules that change, and on software enforcing rules versus people using judgement. Two of the six options meet the need to see and audit shared assets and their governance; three meet the need to record consent decisions with names and revisions; one meets the need to keep full history of knowledge base changes. Whether each option works without a server is still unknown for some.

- Need: Members see and audit shared assets and their governance (transparent-resource-governance, p=0.813)
- Need: Members record consent decisions with names and revisions (consent-governance, p=0.704)
- Need: Members keep full history of knowledge base changes (version-controlled-memory, p=0.569)
- Other (decision → roles): Your group runs sociocracy circles plus a general meeting. Look for software that records circle decisions and general meeting outcomes separately, with named consent and revision history.
- Leaning speedSay=4: Because your group leans toward everyone having a say, look for software that records named consent from each circle and the general meeting, not just a final tally.
- Leaning stableAdapt=3: Your group is balanced on rules that stay put versus rules that change, so check how easily decision rules can be revised without losing the earlier record.
- Leaning autoJudge=3: Your group is balanced on software enforcing rules versus people using judgement, so check whether the software blocks a decision or only flags it when a rule is not met.
- How to choose — Audit of shared assets: Group Income and IXO are the two options checked as meeting the need to see and audit shared assets and their governance. For the other four, this check is unknown. Ask each vendor for a walkthrough of how a worker-owner would view the profit-sharing record and its history.
- How to choose — Consent with names and revisions: Holons, Hypha and Moss are checked as meeting the need to record consent decisions with names and revisions. Fluree, Group Income and IXO are unknown on this point. Ask to see a sample circle decision and a general meeting decision stored side by side.
- How to choose — History of knowledge base changes: Only Fluree is checked as meeting the need to keep full history of knowledge base changes. The other five are unknown. If your group keeps its policies in a knowledge base, ask each vendor how past versions are kept and who can view them.
- How to choose — No server to run: Fluree, Group Income, Hypha, IXO and Moss are checked as meeting the no-server requirement. Holons is unknown. Fluree is described as primarily a client-server database product, so confirm what setup it needs before relying on this check.
- Safeguard — Because your group leans toward everyone having a say,: A few active members make the profit-sharing decisions and the rest only see them afterwards. → Set a quorum for each circle and the general meeting, and keep a named consent list that every worker-owner can open.
- Safeguard — Because your group is balanced on rules that stay put versus rules that change,: Decision rules drift without a clear record of when and why they changed. → Keep a dated list of rule changes with the consent that approved each one, and review it at a fixed interval.
- Safeguard — Because your group is balanced on software enforcing rules versus people using judgement,: The software blocks a decision the group has judged fair, or lets through one that breaks a rule. → Agree in advance which rules the software may block and which it may only flag, and write that list down.
- Question (holons): Can your group use it without running a server?
- Set aside quadratic-funding: Meets 2 of your 3 needs: Members see and audit shared assets and their governance; Members record consent decisions with names and revisions. It is a way of handling money, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Set aside retroactive-public-goods-funding: Meets 2 of your 3 needs: Members see and audit shared assets and their governance; Members record consent decisions with names and revisions. It is a way of handling money, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Set aside mutual-credit-clearing: Meets 1 of your 3 needs: Members record consent decisions with names and revisions. It is a way of handling money, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Set aside mutual-credit-on-blockchain: Meets 1 of your 3 needs: Members record consent decisions with names and revisions. It is a way of handling money, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Legal: As a co-op, your group holds shared money and makes binding decisions through its own rules, not through a software vendor. Profit-sharing decisions that bind the co-op should follow your governing document and be approved by the body your rules name, such as the general meeting. Software can hold the record, but the record is evidence of a decision, not the decision itself.
- Legal: Check who can open the profit-sharing record, how long it is kept, and whether it can be exported if you change tools. Check how the software handles named consent and revisions, since an auditor may ask for both.
- Kinds: fluree=Semantic graph database; group-income=Encrypted group coordination app; holons=Payment splitter dashboard; hypha=Governance and treasury platform; ixo=Impact coordination platform; moss=Peer-to-peer groupware

## festival

**Messaging tools for festival shifts without internet**

> Your group needs volunteers to swap shift messages at a festival site with no internet. The tools must work on poor internet and on phones. Two options meet the need to swap shift messages without internet. Neither option is confirmed to carry messages across the site's own network. Your group leans toward quick decisions by a few and rules that stay put, and is balanced on software enforcing rules. A volunteer can run a Raspberry Pi, but someone must maintain it and your group needs a backup if that person is unavailable.

- Need: Volunteers swap shift messages with no internet (offline-mesh, p=0.892)
- Need: Messages travel across the site's own network (local-network-routing, p=0.719)
- Other (setup → guided): A Raspberry Pi can host a local network, but one volunteer must run and maintain it. Your group needs a backup if that person is unavailable.
- Leaning speedSay=2: Because a few people decide quickly, a tool that lets one or two coordinators send shift updates without a group vote fits how your group works.
- Leaning stableAdapt=2: Because your rules stay put, a tool with fixed, simple message handling suits you better than one that needs frequent reconfiguration.
- Leaning autoJudge=3: Because people use judgement alongside software, a tool that carries messages and leaves shift decisions to volunteers fits your group.
- How to choose — How messages reach across the site: Bitchat forwards messages device to device over Bluetooth, with each phone acting as a relay and up to seven hops. Briar syncs directly between devices over Bluetooth, Wi-Fi or memory cards when the internet is down. Neither option is confirmed to carry messages across the site's own network, so test this on your site before committing.
- How to choose — Setup and upkeep: Both options are apps your volunteers install on their phones. Your group has one volunteer who can run a Raspberry Pi, and a Pi can host a local network. That volunteer must run and maintain it, and your group needs a backup if that person is unavailable.
- How to choose — Maturity and takeover risk: Both options are in use and both carry low takeover risk. Bitchat is a public-domain app whose only notable vector is single-funder dependency. Briar is GPL code governed by a voluntary board, with no company owning it. Both were reviewed, Bitchat on 2026-09-14 and Briar on 2026-10-29.
- How to choose — Encryption and privacy: Bitchat uses Noise Protocol encryption with forward secrecy. Briar syncs over the Tor network when the internet is up, to hide who is talking. Consider how much privacy your shift messages need.
- Safeguard — Because a few people decide quickly, shift changes may not reach everyone.: Volunteers miss a swap because only the coordinators saw the message. → Name one person to confirm each swap reaches both volunteers, whichever tool you use.
- Safeguard — Because your rules stay put, a fixed setup can break when the site changes.: A relay or device goes down and the usual path for messages stops working. → Write a short fallback plan for messages and keep a printed copy at the site.
- Set aside bittorrent-mainline-dht: Meets 1 of your 2 needs: Volunteers swap shift messages with no internet. It is a infrastructure, not a ready-made app. You said no one technical will set things up.
- Set aside tinyssb: Meets 1 of your 2 needs: Volunteers swap shift messages with no internet. It is a protocol developers build on, not a ready-made app. You said no one technical will set things up.
- Set aside lokinet: Meets 1 of your 2 needs: Messages travel across the site's own network. It is a infrastructure, not a ready-made app. You said no one technical will set things up. It has no phone app yet. You need one.
- Set aside meshcore: Meets 1 of your 2 needs: Volunteers swap shift messages with no internet. It is a infrastructure, not a ready-made app. You said no one technical will set things up.
- Legal: As a nonprofit or charity, your group holds shared money in the organization's name and makes binding decisions through its board. The board decides today, so check your governing documents for what the board can approve alone and what needs a member vote. Check who may sign for spending and how shift-related costs are recorded.
- Legal: For a tool hosted on a volunteer's Raspberry Pi, check who owns the device and the data on it, and what happens when that volunteer leaves. Confirm your insurance and data rules cover volunteer messages held on personal phones.
- Kinds: bitchat=Peer-to-peer Bluetooth messenger; briar=Offline-capable secure messenger

## seed-library

**Shared seed catalogues for member-run groups**

> Your group wants a shared seed catalogue that any member group can host a copy of. Members are in four countries, mostly rural, and you lean toward everyone having a say and rules that can change. You also lean toward people using judgement over software enforcing rules.
> Of the six options compared, three are checked as able to run a copy per member group. None is checked as able to share one catalogue across separate copies. Several checks are unknown for every option, including whether members can take time to think before deciding.

- Need: Members take time to think before deciding (slow-deliberation, p=0.835)
- Need: Member groups run their own copy (self-hostable, p=0.735)
- Need: Separate copies share one catalogue (cross-instance-federation, p=0.64)
- Need: Several people edit seed entries at once (conflict-free-editing, p=0.549)
- Need: Decisions are written down and can be changed (consent-governance, p=0.514)
- Other (reach → global): Rural members in four countries may have slow or intermittent connections. Check how the software works offline and on low bandwidth. Your group's setup guide must suit non-technical hosts.
- Leaning speedSay=4: Because your group leans toward everyone having a say, a tool that only supports quick votes by a few will not fit how you decide.
- Leaning stableAdapt=4: Because your group leans toward rules that change, a tool with fixed decision rules will need workarounds.
- Leaning autoJudge=2: Because your group leans toward people using judgement, a tool that enforces rules in software will sit awkwardly with your practice.
- How to choose — Hosting a copy per group: Anytype, Nextcloud and Twake Workplace are checked as able to run a copy per member group. For AFFiNE, Hypha and Moss this is unknown. Check what hosting one copy involves for a non-technical host before you rely on it.
- How to choose — One catalogue across copies: No option is checked as able to share one catalogue across separate copies. This is the need your question centres on, and it is unknown for every option. Ask each vendor or community how separate copies would stay in step, if at all.
- How to choose — Editing seed entries together: AFFiNE, Anytype, Nextcloud and Twake Workplace are checked as supporting several people editing entries at once. For Hypha and Moss this is unknown. Test this with a real seed list rather than a demo.
- How to choose — Rules and decisions: Hypha and Moss are checked as writing decisions down in a way that can be changed. For the other four this is unknown. Your group leans toward rules that change, so ask how a decision rule is edited and who can edit it.
- Safeguard — Because your group leans toward everyone having a say: A few active members make decisions while the rest find out later. → Set a written comment period before any decision closes, and post every decision where all members can see it.
- Safeguard — Because your group leans toward rules that change: Decision rules drift without anyone agreeing to the change. → Keep one dated page of decision rules and review it at fixed intervals.
- Question (all): Can the group change its own decision rules without a developer?
- Question (affine, hypha, nextcloud, twake-workplace): Does any part require tokens or a crypto wallet?
- Question (affine, hypha, twake-workplace): Can members export their data if the group leaves?
- Set aside holons: Meets 1 of your 5 needs: Decisions are written down and can be changed. Its data can't be exported. You need to be able to take your data out.
- Set aside holochain: Meets 2 of your 5 needs: Member groups run their own copy; Decisions are written down and can be changed. It is a framework developers build on, not a ready-made app. You said the person setting it up can follow a guide, not build software. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside shelter-protocol: Meets 2 of your 5 needs: Member groups run their own copy; Decisions are written down and can be changed. It is a framework developers build on, not a ready-made app. You said the person setting it up can follow a guide, not build software. It needs tokens or a crypto wallet to use. You ruled out crypto.
- Set aside beckn-protocol: Meets 2 of your 5 needs: Member groups run their own copy; Separate copies share one catalogue. It is a standard developers build on, not a ready-made app. You said the person setting it up can follow a guide, not build software.
- Legal: Your group is not sure of its legal form. That matters for holding shared money and for making decisions that bind members in four countries. A shared catalogue and shared funds are usually held by a named organisation, not by the software. Check which legal form your group has or needs, who can sign for money, and whether decisions taken online count as binding under that form.
- Legal: Ask a local adviser in each country where members live. Check rules on data protection for member details, and on holding money across borders.
- Kinds: affine=Workspace with docs and databases; anytype=Encrypted local-first workspace app; hypha=Governance and treasury platform; moss=Peer-to-peer groupware toolkit; nextcloud=Self-hosted file and collaboration suite; twake-workplace=Open-source workplace suite

## startup-team

**Knowledge bases for a small consultancy**

> Brightline is a climate data consultancy of 2 to 10 people. The group wants an internal knowledge base that employees can take with them when they leave, and the data must be exportable. One person currently makes decisions, and the group leans toward people using judgement over software enforcing rules.
> Six options are in the comparison. One meets the full export need, five meet the need for files that open in other tools, and none meets the need for shared knowledge run by contributors rather than vendors. Whether members can export their data if the group leaves is still unknown.

- Need: Files open in other tools without lock-in (interoperable-formats, p=0.827)
- Need: Full export of people, content and links (data-portability, p=0.735)
- Need: Shared knowledge run by contributors, not vendors (knowledge-commons, p=0.688)
- Need: Full history of every change kept (version-controlled-memory, p=0.681)
- Need: See where facts came from and who confirmed them (provenance-tracking, p=0.523)
- Leaning speedSay=1: Because one person decides, a tool that lets a single owner set up and run the knowledge base will fit your group's decision style.
- Leaning stableAdapt=3: Because your group sits in the middle on rules that stay put versus rules that change, a tool that lets you adjust structure without a rebuild will suit you.
- Leaning autoJudge=4: Because your group prefers people using judgement, a tool that leaves review and confirmation to contributors rather than enforcing rules in software will fit.
- How to choose — Export and portability: Logseq is the only option that meets the full export need, and it also meets the need for files that open in other tools. The other five options leave full export of people, content and links unknown. Your hard requirement makes this the first trade-off to settle.
- How to choose — What kind of tool you are buying: Buzz, Geo Genesis and Logseq are end-user applications your staff would use directly. Fluree is a database product, and JSON-LD and OWL are standards rather than applications. A standard gives you a format to store and exchange data in, but not a place for staff to write and read knowledge.
- How to choose — History and provenance: Buzz, Fluree and Logseq keep a full history of every change. Buzz, Fluree, Geo Genesis, JSON-LD and OWL let you see where facts came from and who confirmed them. Logseq leaves provenance unknown. Weigh which of these two needs matters more for a knowledge base that leaves with employees.
- How to choose — Maturity and takeover risk: JSON-LD and OWL are established standards with minimal takeover risk. Fluree and Logseq are in use, with moderate and low takeover risk respectively. Buzz and Geo Genesis are early releases, and Buzz carries high takeover risk. Early tools may change shape under you.
- Safeguard — Because one person decides, a tool that lets a single owner set up and run the knowledge base will fit your group's decision style.: Knowledge and structure end up in one person's hands, and the group loses access when that person leaves. → Name a second person who can administer the tool, and keep an export schedule that runs without the owner.
- Safeguard — Because your group prefers people using judgement, a tool that leaves review and confirmation to contributors rather than enforcing rules in software will fit.: Without enforced rules, entries drift and no one confirms what is current. → Agree a short written practice for who confirms an entry and when, and review it at a set interval.
- Question (buzz, fluree, geo-genesis, json-ld, owl): Can members export their data if the group leaves?
- Set aside ngit: Meets 1 of your 5 needs: Full history of every change kept. Its data can't be exported. You need to be able to take your data out.
- Set aside zapstore: Meets 1 of your 5 needs: See where facts came from and who confirmed them. Its data can't be exported. You need to be able to take your data out.
- Legal: Brightline is a company, so the knowledge base is an asset the company holds, not the employees. Employees can take a copy of content on leaving only if the company agrees to it, so set out in an internal policy what a departing employee may export and what stays with the company. The same policy should say who owns contributions made during work.
- Legal: Check your employment terms and any confidentiality clauses before promising departing staff a full copy. Check also that the export format you rely on can be read without the tool, since a company must be able to keep its records after a tool is dropped.
- Kinds: buzz=Self-hosted chat workspace; fluree=Semantic graph database; geo-genesis=On-chain knowledge graph app; json-ld=Linked data format; logseq=Local-first notes app; owl=Ontology language standard