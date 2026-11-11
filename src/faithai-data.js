export const OPTIONS = [
  {
    id: 1,
    label: "TIME OR CARE",
    step: "Choose one hour of time or one kind of care you can offer or request this week.",
    people: "Caregivers, elders, families, neighbors, and organizers.",
    detail: "FAITHAI can shape a private offer or request. A person reviews any introduction before it happens.",
    choices: [
      { id: 1, label: "OFFER ONE HOUR", action: "Write a private one-line offer naming the hour, the task, and the area you can reach." },
      { id: 2, label: "ASK FOR CARE", action: "Name the care task, the useful time window, and what can stay private." },
      { id: 3, label: "CHECK ON SOMEONE", action: "Choose one trusted person and prepare a no-pressure check-in message." },
    ],
  },
  {
    id: 2,
    label: "A SKILL OR KNOWLEDGE",
    step: "Name one thing you can teach or one thing you want to learn.",
    people: "Learners, workers, elders, creators, and local experts.",
    detail: "Knowledge can be practical, cultural, technical, creative, or lived. Your voice does not have to sound corporate to count.",
    choices: [
      { id: 1, label: "TEACH SOMETHING", action: "Name one skill, one learner outcome, and a 20-minute first lesson you could offer." },
      { id: 2, label: "LEARN SOMETHING", action: "Name one skill and the smallest real task you want to complete with it." },
      { id: 3, label: "PRESERVE KNOWLEDGE", action: "Record one story, method, or lesson in plain language before it is lost." },
    ],
  },
  {
    id: 3,
    label: "TOOLS OR CREDITS",
    step: "Name the tool, AI credit, device, or access gap holding your work back.",
    people: "Builders with strong ideas and fewer resources.",
    detail: "Power Credits can route donated AI tokens, software, devices, or support after human review. Credits are access, not speculative money.",
    choices: [
      { id: 1, label: "AI TOKENS", action: "Name the AI task, the provider if known, and the smallest token amount that would unblock it." },
      { id: 2, label: "DEVICE OR DATA", action: "Name the device, connection, or data limit blocking the next concrete task." },
      { id: 3, label: "SOFTWARE OR TOOL", action: "Name the tool and the result you need; check for a free or local option before requesting credits." },
    ],
  },
  {
    id: 4,
    label: "A PROJECT OR IDEA",
    step: "Describe the result you want in one sentence.",
    people: "Founders, artists, organizers, students, and small teams.",
    detail: "FAITHAI can turn the sentence into one useful next action without publishing your idea or claiming ownership of it.",
    choices: [
      { id: 1, label: "MAKE A PLAN", action: "Write the result, the person it helps, and the smallest version you can finish in seven days." },
      { id: 2, label: "FIND A HELPER", action: "Name one missing role and the bounded task you would invite a trusted person to discuss." },
      { id: 3, label: "FIND RESOURCES", action: "List the one resource that changes the project from blocked to testable." },
    ],
  },
  {
    id: 5,
    label: "I NEED SUPPORT",
    step: "Choose the support you need most right now.",
    people: "People facing an urgent barrier, especially those with the least access.",
    detail: "Need comes before popularity. A human confirms sensitive matches, funding, and introductions.",
    choices: [
      { id: 1, label: "SAFETY OR CARE", action: "Choose one trusted person or reviewed service to contact; share only what is needed for the next safe step." },
      { id: 2, label: "FOOD OR HOUSING", action: "Name the immediate need, general area, and useful deadline without posting a public profile." },
      { id: 3, label: "WORK OR LEARNING", action: "Name one role or skill and the smallest opportunity that would move you forward." },
      { id: 4, label: "RECOVERY", action: "Choose one stabilizing task for today and one trusted person who can witness the plan." },
      { id: 5, label: "FUNDS", action: "Name the purpose, minimum amount, deadline, and who must review any money movement." },
    ],
  },
  {
    id: 0,
    label: "GUIDE ME",
    step: "Start with the direction that feels closest today.",
    people: "Anyone who is unsure where to begin.",
    detail: "You can change direction at any time. Nothing is posted, sent, or shared just because you explored a path.",
    choices: [
      { id: 1, label: "I WANT TO GIVE", action: "Choose whether you can offer time, knowledge, a tool, or a trusted introduction." },
      { id: 2, label: "I WANT TO BUILD", action: "Name the result you want and choose the smallest seven-day version." },
      { id: 3, label: "I WANT TO LEARN", action: "Name one skill and one real task that would prove you learned it." },
      { id: 4, label: "I NEED SUPPORT", action: "Choose the most immediate barrier: safety, care, food, housing, work, learning, recovery, or funds." },
    ],
  },
];

export const SIGNAL_CATALOG = [
  { id: "care-window", kind: "deadline", path: 1, score: 92, priority: "TIME-SENSITIVE", title: "Review the time window on your care step.", importance: "Care offers and requests lose usefulness when the time window is unclear.", action: "Confirm the day, time, and boundary before a human reviews any match." },
  { id: "care-privacy", kind: "privacy", path: 1, score: 78, priority: "PRIVACY", title: "Set the privacy boundary for this care exchange.", importance: "Care can involve sensitive family, location, or health context.", action: "Mark what may be shared, with whom, and only after your approval." },
  { id: "skill-access", kind: "access", path: 2, score: 72, priority: "ACCESS", title: "Turn the saved skill into a free first exchange.", importance: "A small exchange can test usefulness without requiring a paid course.", action: "Define one 20-minute lesson or one concrete learning task." },
  { id: "knowledge-credit", kind: "credit", path: 2, score: 68, priority: "RECIPROCITY", title: "Protect credit for the knowledge being shared.", importance: "Community and lived knowledge should not become unattributed extraction.", action: "Name the teacher, source, and allowed reuse before sharing." },
  { id: "power-credit", kind: "access", path: 3, score: 88, priority: "ACCESS", title: "Prepare the minimum Power Credit request.", importance: "A specific, bounded request is easier for a human reviewer to match to donated access.", action: "Name the task, provider or tool, minimum amount, and deadline." },
  { id: "free-tool", kind: "offline", path: 3, score: 70, priority: "LOW-BANDWIDTH", title: "Check for a free or local tool first.", importance: "A reusable local option may solve the access gap without ongoing cost or connectivity.", action: "Compare one free or offline option before requesting credits." },
  { id: "project-rights", kind: "ownership", path: 4, score: 82, priority: "OWNERSHIP", title: "Write the ownership boundary before inviting help.", importance: "Clear authorship and scope reduce extraction when a project gains attention.", action: "Record who owns the idea, what help is requested, and what is not being transferred." },
  { id: "project-test", kind: "progress", path: 4, score: 74, priority: "NEXT STEP", title: "Shrink the project to a seven-day proof.", importance: "A small proof creates evidence without requiring a large team or budget.", action: "Choose one person, one result, and one visible test." },
  { id: "support-first", kind: "support", path: 5, score: 100, priority: "SUPPORT FIRST", title: "Review the most immediate support step first.", importance: "Support and safety needs rank ahead of popularity, promotion, and general updates.", action: "Choose one trusted human or reviewed service and share only what the next step requires." },
  { id: "support-deadline", kind: "deadline", path: 5, score: 90, priority: "DEADLINE", title: "Add a useful deadline to the support request.", importance: "A clear deadline helps a human distinguish an immediate barrier from a general wish.", action: "Record the date or time window without exposing a public profile." },
  { id: "guided-choice", kind: "progress", path: 0, score: 64, priority: "GUIDANCE", title: "Turn the guided choice into one named action.", importance: "A direction becomes useful when it ends in a small action you control.", action: "Choose give, build, learn, or support, then save only the next step." },
  { id: "guided-privacy", kind: "privacy", path: 0, score: 58, priority: "PRIVACY", title: "Check what this device has saved.", importance: "You should be able to see and remove local context without joining a directory.", action: "Open history to review or clear the local activity ledger." },
];

export function getOption(id) {
  return OPTIONS.find((option) => option.id === Number(id)) || null;
}

export function getChoice(option, id) {
  return option?.choices.find((choice) => choice.id === Number(id)) || null;
}
