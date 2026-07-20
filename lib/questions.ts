// Ported verbatim from proto/recall-radar.html — do not regenerate or rewrite
// this content. 30 original, non-copyrighted MCQs across 6 concepts (5 each),
// grounded in Sessions 4-6 of a Management & Innovation Systems MBA course.

export interface Concept {
  id: string;
  label: string;
}

export interface Question {
  concept: string;
  q: string;
  options: [string, string, string, string];
  correct: number; // index into options, in the ORIGINAL (unshuffled) order
}

export const CONCEPTS: Concept[] = [
  { id: "structure", label: "Structure Fundamentals" },
  { id: "stagegate", label: "Stage-Gate & NPD" },
  { id: "leanstartup", label: "Lean Startup & MVP" },
  { id: "systems", label: "Systems Thinking & Leverage" },
  { id: "complexity", label: "Complexity & Causal Loops" },
  { id: "design", label: "Design Thinking & Scaling" },
];

export const QUESTIONS: Question[] = [
  // --- Structure Fundamentals ---
  { concept: "structure", q: "What are the two main components of Hard Structures in the course's Structure framework?", options: ["Process Routes and Authority/Incentive systems", "Culture and Logic of Justification", "Empathy and Ideation", "Stocks and Flows"], correct: 0 },
  { concept: "structure", q: "In the System Architect framework, how are Soft Structures best described?", options: ["Codified rules embedded in official policy", "The intangible Value Frames that determine how hard structures are interpreted", "Formal reporting lines and budgets", "A company's stage-gate process"], correct: 1 },
  { concept: "structure", q: "Which lever determines who has the \"Right to Decide\" within an organization?", options: ["Value Frames", "Process Routes", "Authority and Incentives", "Logic of Justification"], correct: 2 },
  { concept: "structure", q: "What does a \"Wise\" organization's Logic of Justification expand beyond ROI to include?", options: ["Shareholder primacy only", "\"The Right Reason\" — solving a human need or restoring an ecosystem", "Stricter cost-cutting targets", "Faster stage-gate reviews"], correct: 1 },
  { concept: "structure", q: "In the Navigator vs. Architect framing, what is a Junior Manager's primary role with respect to Soft Structures?", options: ["Redesigning the organization's incentive systems", "Acting as a \"cultural sensor\" who navigates the gap between stated and actual values", "Setting the company's overall Logic of Justification", "Approving stage-gate budgets"], correct: 1 },

  // --- Stage-Gate & NPD ---
  { concept: "stagegate", q: "Per Shepherd & Ahmed, roughly what share of a product's total cost is typically committed during the design phase, even though design itself consumes a much smaller share of the budget?", options: ["20%", "50%", "80%", "95%"], correct: 2 },
  { concept: "stagegate", q: "In the PACE framework's dysfunctional archetypes, which quadrant describes an engineering-dominated, over-controlled process where \"just one more feature\" causes late products?", options: ["Rock Game", "Big Brother", "Ricochet", "Fine Wine"], correct: 3 },
  { concept: "stagegate", q: "After Colgate-Palmolive adopted a structured NPD framework, what happened to the share of prototype-stage products later killed?", options: ["It rose from 20% to 50%", "It dropped from 50% to 20%", "It stayed roughly the same", "It dropped to zero"], correct: 1 },
  { concept: "stagegate", q: "What is the primary role of a \"Review Board\" (or Product Approval Committee) in the generic NPD framework?", options: ["Writing technical specifications for engineers", "Initiating, cancelling, and re-prioritizing projects, and allocating development resources", "Conducting customer interviews", "Managing daily task lists for realisation teams"], correct: 1 },
  { concept: "stagegate", q: "Which statement about time-to-market matches the data cited in the NPD reading?", options: ["Being over budget hurts profit far more than being late", "A product six months late but on budget can miss about a third of potential lifetime profit, while one that's on time but 50% over budget only cuts profits by about 4%", "Lead time has no measurable effect on profitability", "Cost and schedule are always weighted equally in NPD outcomes"], correct: 1 },

  // --- Lean Startup & MVP ---
  { concept: "leanstartup", q: "How is an MVP (Minimum Viable Product) defined in the Lean Startup reading?", options: ["The flagship, most valuable feature set", "The smallest set of activities needed to disprove a hypothesis", "A fully-featured beta release", "The lowest price point a company can test"], correct: 1 },
  { concept: "leanstartup", q: "Which of these is an example of a properly falsifiable hypothesis?", options: ["\"Our product will spread through word-of-mouth\"", "\"Our viral coefficient over the next 12 months will exceed 0.5\"", "\"Customers will like our product\"", "\"Our team is talented enough to succeed\""], correct: 1 },
  { concept: "leanstartup", q: "In Eric Ries's framework, what does \"pivot\" mean?", options: ["Shutting the company down entirely", "Changing strategy while retaining the original vision", "Doubling the marketing budget", "Switching permanently to a Stage-Gate process"], correct: 1 },
  { concept: "leanstartup", q: "Which cognitive bias — illustrated by Dropbox's founder estimating 8 weeks for a task that actually took 18 months — is defined as underestimating duration, cost, or risk even given past experience?", options: ["Confirmation bias", "Sunk cost fallacy", "Planning fallacy", "Optimism bias"], correct: 2 },
  { concept: "leanstartup", q: "According to the reading, in which situation is the Lean Startup approach LEAST useful?", options: ["When demand uncertainty is high and iteration is cheap", "When mistakes are irreversible or catastrophic, such as an unmanned interplanetary mission", "When a founder wants to avoid wasting resources", "When a business model has never been tested before"], correct: 1 },

  // --- Systems Thinking & Leverage ---
  { concept: "systems", q: "In systems thinking terminology, what is a \"stock\"?", options: ["A flow of information between departments", "An accumulation that can be measured at a point in time, such as inventory or cash", "A type of feedback loop", "A fixed organizational policy"], correct: 1 },
  { concept: "systems", q: "What distinguishes a Reinforcing (R) loop from a Balancing (B) loop?", options: ["R loops amplify change in the same direction; B loops seek to close the gap toward a goal", "R loops are always negative; B loops are always positive", "R loops only occur in nature; B loops only occur in business", "There is no meaningful difference"], correct: 0 },
  { concept: "systems", q: "According to the Iceberg Model, which level offers the deepest, but hardest-to-change, lever for systemic change?", options: ["Events", "Patterns/Trends", "Systemic Structures", "Mental Models"], correct: 3 },
  { concept: "systems", q: "In the \"Tragedy of the Commons\" system archetype, what causes the shared resource to degrade?", options: ["A single bad actor deliberately sabotaging the system", "Individually rational use of a shared, finite resource by many actors", "A sudden regulatory change", "A complete absence of any feedback loops"], correct: 1 },
  { concept: "systems", q: "Per Donella Meadows' hierarchy of leverage points, which of the following is generally the WEAKEST place to intervene — despite being the one most managers default to?", options: ["The system's goals", "Constants, parameters, and numbers (e.g., subsidies, taxes)", "The mindset/paradigm the system arises from", "The structure of information flows"], correct: 1 },

  // --- Complexity & Causal Loops ---
  { concept: "complexity", q: "What is \"emergence\" in the context of complex systems?", options: ["A centrally planned outcome designed by a system's leader", "Macro-level patterns that arise purely from local interactions of micro-level agents, with no central controller", "A synonym for randomness", "The moment a system fails completely"], correct: 1 },
  { concept: "complexity", q: "In the \"boids\" flocking model, what are the three simple local rules that produce coordinated flock movement?", options: ["Speed, altitude, and direction", "Separation, alignment, and cohesion", "Leadership, followership, and communication", "Attack, retreat, and regroup"], correct: 1 },
  { concept: "complexity", q: "What does Schelling's segregation model demonstrate?", options: ["Extreme individual prejudice is required to produce any segregation", "Mild individual-level preferences for similar neighbors can still produce starkly segregated overall patterns", "Segregation only occurs when centrally planned", "Complex systems cannot be modeled with simple agent rules"], correct: 1 },
  { concept: "complexity", q: "In Causal Loop Diagram construction, how do you determine whether a closed loop is Reinforcing or Balancing?", options: ["Count the number of variables in the loop", "Count the \"o\" (opposite-direction) links; an even number (including zero) means Reinforcing, an odd number means Balancing", "Check whether the loop includes a delay", "Reinforcing loops always have exactly two variables"], correct: 1 },
  { concept: "complexity", q: "What kind of statistical distribution do many complex-system phenomena (city sizes, wealth, earthquake magnitude) tend to follow?", options: ["A normal (bell curve) distribution", "A power law, with many small events and a few extreme ones", "A perfectly uniform distribution", "No identifiable pattern at all"], correct: 1 },

  // --- Design Thinking & Scaling ---
  { concept: "design", q: "What are the five modes of the Stanford d.school design thinking process?", options: ["Research, Design, Build, Ship, Measure", "Empathize, Define, Ideate, Prototype, Test", "Inspiration, Ideation, Implementation, Iteration, Impact", "Observe, Plan, Execute, Review, Scale"], correct: 1 },
  { concept: "design", q: "What three elements combine to form a strong Point-of-View (POV) statement in the Define mode?", options: ["Budget, Timeline, and Team", "User, Need, and Insight", "Problem, Solution, and Metric", "Vision, Mission, and Strategy"], correct: 1 },
  { concept: "design", q: "In the IDEO/Kaiser Permanente nursing shift-change case, what redesign reduced the time to a nurse's first patient interaction?", options: ["Hiring more nursing staff", "Passing shift-change information in front of the patient instead of at the nurses' station, supported by simple software", "Eliminating shift changes entirely", "Outsourcing shift handoffs to a call center"], correct: 1 },
  { concept: "design", q: "Why did the MSI Zambia \"Diva Centres\" project, despite strong pilot results, struggle to scale?", options: ["The concept wasn't tested with real users", "It focused narrowly on user experience without grounding the design in the wider health-delivery ecosystem", "It cost too much to prototype", "Community members refused to participate"], correct: 1 },
  { concept: "design", q: "According to \"The Next Chapter in Design for Social Innovation,\" what is one of the recommended shifts for tackling complex social challenges?", options: ["Rely exclusively on empathy interviews and skip prototyping", "Move from consulting communities to genuine co-creation and shared ownership", "Avoid all measurement or evaluation to preserve creative freedom", "Focus solely on aesthetics and visual polish"], correct: 1 },
];

export function conceptLabel(id: string): string {
  return CONCEPTS.find((c) => c.id === id)?.label ?? id;
}
