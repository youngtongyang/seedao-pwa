/** English voting-rule copy for proposals (merged into messages.ts). */

export const proposalsRulesCopyEn = {
  hourUnit: "{h} hours",
  fallbackTitle: "Voting rules",
  fallbackHint: "Detailed meta-rules for this type are not available here. See SeeDAO governance docs.",
  sectionTitles: {
    nature: "Nature",
    eligibility: "Who may submit",
    timing: "Publicity & voting window",
    voteTiming: "Voting window",
    voters: "Who may vote",
    quorum: "Participation requirement",
    tally: "Tally & effect",
    fallback: "Rules",
  },
  nodeAssembly: {
    nature: [
      "These rules apply to Node Assembly proposals.",
      "For governance and major matters at the seasonal node assembly (excluding meta-rule amendments).",
    ],
    eligibility: [
      "Season nodes and Town Hall members may submit.",
      "Background, body, and remarks must be completed before submission.",
    ],
    timing: [
      "After publish, a publicity period applies by default ({pubHours}, {pubDays}).",
      "Voting starts after publicity ends ({voteHours}, {voteDays}).",
      "Members may read the full text and comment during publicity.",
    ],
    voters: ["Voters are season nodes.", "One vote per node."],
    quorum: [
      "Participating nodes must exceed half of the season node total (> 50%).",
      "If quorum is not met, the proposal cannot take effect.",
    ],
    tally: [
      "The option with the most votes wins.",
      "Passage requires more than half of participating nodes (> 1/2).",
      "A tie for first place invalidates the vote; resubmit if needed.",
      "After passage, Town Hall executes within its mandate.",
    ],
    pubDays: "4 days",
    voteDays: "2 days",
  },
  nodeMetaRule: {
    nature: [
      "These rules apply to Node Assembly meta-rule proposals.",
      "For amending SeeDAO meta-rules and Level-II node assembly rules.",
    ],
    eligibility: [
      "Season nodes and Town Hall members may submit.",
      "Background, body, and remarks must be completed before submission.",
    ],
    timing: [
      "After publish, a publicity period applies by default ({pubHours}, {pubDays}).",
      "Voting starts after publicity ends ({voteHours}, {voteDays}).",
      "Members may read the full text and comment during publicity.",
    ],
    voters: ["Voters are season nodes.", "One vote per node."],
    quorum: [
      "Participating nodes must exceed half of the season node total (> 50%).",
      "If quorum is not met, the proposal cannot take effect.",
    ],
    tally: [
      "The option with the most votes wins.",
      "Passage requires at least two-thirds of participating nodes (≥ 2/3).",
      "A tie for first place invalidates the vote; resubmit if needed.",
      "After passage, meta-rules are updated per assembly resolution.",
    ],
    pubDays: "4 days",
    voteDays: "2 days",
  },
  townHall: {
    nature: [
      "These rules apply to Town Hall decision proposals.",
      "For internal Town Hall decisions within its mandate.",
    ],
    eligibility: [
      "Town Hall members may submit.",
      "Background, plan, and execution details are required.",
    ],
    timing: [
      "Town Hall proposals have no publicity period; voting starts immediately after publish.",
      "Voting lasts {voteHours} ({voteDays}) by default.",
    ],
    voters: [
      "Voters are Town Hall members.",
      "Non-members cannot vote.",
      "One vote per Town Hall member.",
    ],
    quorum: [
      "Participation must meet the quorum configured on the backend.",
      "The proposal cannot take effect without quorum.",
    ],
    tally: [
      "The option with the most votes wins.",
      "A tie for first place invalidates the vote.",
      "Town Hall executes after passage.",
    ],
    voteDays: "2 days",
  },
  tier: {
    scaleSmall: "For smaller community resource requests.",
    scaleMedium: "For medium-scale community projects.",
    scaleLarge: "For larger projects and significant resource decisions.",
    natureInit: "These rules apply to {tier} tier proposals (initiation).",
    natureClose: "These rules apply to {tier} tier proposals (closure).",
    natureSpecial: "These rules apply to {tier} tier special proposals.",
    mechanism: "Tier proposals are a meta-rule mechanism for shared community resources.",
    eligibilityInit: "Members meeting identity and reputation thresholds may submit.",
    eligibilityClose: "Closure proposals must reference an approved initiation.",
    eligibilityPlan: "Initiation requires background, budget, and execution plan.",
    timing: [
      "Default publicity {pubHours}, voting {voteHours}.",
      "Members may review and comment during publicity.",
    ],
    voters: [
      "Voters are active SEEDAO members meeting meta-rule requirements.",
      "See the season handbook for thresholds.",
    ],
    quorum: [
      "Participation must meet the tier quorum.",
      "The proposal cannot take effect without quorum.",
    ],
    tallyInit: [
      "The option with the most votes wins.",
      "A tie invalidates the vote.",
      "After initiation passes, budget is disbursed and execution begins.",
    ],
    tallyClose: [
      "The option with the most votes wins.",
      "A tie invalidates the vote.",
      "After closure passes, archiving and settlement follow.",
    ],
    tallySpecial: [
      "The option with the most votes wins.",
      "A tie invalidates the vote.",
      "After passage, budget is disbursed and execution begins.",
    ],
  },
} ;
