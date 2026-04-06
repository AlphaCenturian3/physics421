// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VisualizationMeta {
  id: string
  topic: string
  title: string
  conceptTags: string[]
  difficultyLevel: 1 | 2 | 3
  commonMisconceptions: string[]
  recommendedUseCases: string[]
  caption: { what: string; why: string; notice: string }
}

// ─────────────────────────────────────────────────────────────────────────────
// Master data — all 17 visualization definitions
// ─────────────────────────────────────────────────────────────────────────────

export const VISUALIZATIONS: VisualizationMeta[] = [
  {
    id: 'electric-charge',
    topic: "Electric Charge & Coulomb's Law",
    title: "Coulomb's Law",
    conceptTags: ['charge', 'force', 'coulomb', 'attraction', 'repulsion'],
    difficultyLevel: 1,
    commonMisconceptions: ['force acts only on one charge', 'force is linear with distance'],
    recommendedUseCases: ['intro to E&M', 'understanding force direction'],
    caption: {
      what: 'Two charges exert equal and opposite forces on each other.',
      why: 'This is the foundation of all electrostatics.',
      notice: 'How force scales with distance and charge magnitude.',
    },
  },
  {
    id: 'electric-field',
    topic: 'Electric Field',
    title: 'Electric Field Lines',
    conceptTags: ['field', 'vector', 'field lines', 'test charge'],
    difficultyLevel: 1,
    commonMisconceptions: [
      'field lines are physical objects',
      'field exists only where lines are drawn',
    ],
    recommendedUseCases: ['visualizing field direction', 'superposition'],
    caption: {
      what: 'Electric field lines show the direction a positive test charge would move.',
      why: 'Fields allow us to describe force without needing a second charge present.',
      notice: 'Line density indicates field strength.',
    },
  },
  {
    id: 'electric-flux',
    topic: 'Electric Flux',
    title: 'Electric Flux',
    conceptTags: ['flux', 'surface', 'angle', 'field lines'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'flux depends on surface shape',
      'all field lines count equally',
    ],
    recommendedUseCases: ["prepping for Gauss's Law"],
    caption: {
      what: 'Flux measures how many field lines pass through a surface.',
      why: "It's the key quantity in Gauss's Law.",
      notice: 'Flux is zero when the surface is parallel to the field.',
    },
  },
  {
    id: 'gauss-law',
    topic: "Gauss's Law",
    title: "Gauss's Law",
    conceptTags: ['gauss', 'enclosed charge', 'symmetry', 'gaussian surface'],
    difficultyLevel: 2,
    commonMisconceptions: [
      "Gauss's Law only works for spheres",
      'flux depends on surface size',
    ],
    recommendedUseCases: ['finding E fields with symmetry'],
    caption: {
      what: 'Total flux through any closed surface equals the enclosed charge over ε₀.',
      why: 'Makes calculating fields for symmetric charge distributions easy.',
      notice: "The shape of the surface doesn't matter — only enclosed charge.",
    },
  },
  {
    id: 'electric-potential',
    topic: 'Electric Potential',
    title: 'Electric Potential',
    conceptTags: ['potential', 'voltage', 'equipotential', 'gradient'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'high potential = high field',
      'potential and field point same direction',
    ],
    recommendedUseCases: ['circuit analysis prep', 'energy conservation'],
    caption: {
      what: 'Potential is the electric "altitude" — charges roll downhill.',
      why: "It's a scalar, easier to work with than vector fields.",
      notice: 'E field always points from high to low potential.',
    },
  },
  {
    id: 'potential-energy',
    topic: 'Potential Energy',
    title: 'Electric Potential Energy',
    conceptTags: ['energy', 'work', 'potential energy', 'conservative force'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'PE is always positive',
      'moving with field increases PE',
    ],
    recommendedUseCases: ['energy conservation problems'],
    caption: {
      what: 'Potential energy stored in a charge configuration.',
      why: 'Energy is conserved — understanding PE predicts motion.',
      notice: 'The graph shows PE vs distance in real time.',
    },
  },
  {
    id: 'capacitors',
    topic: 'Capacitors & Dielectrics',
    title: 'Capacitors & Dielectrics',
    conceptTags: ['capacitor', 'dielectric', 'capacitance', 'charge storage'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'dielectric increases field',
      'larger plates means less capacitance',
    ],
    recommendedUseCases: ['circuit design', 'energy storage'],
    caption: {
      what: 'A capacitor stores charge on two parallel plates separated by a gap.',
      why: 'Capacitors are everywhere in electronics and energy storage.',
      notice: 'Adding a dielectric reduces the field but increases capacitance.',
    },
  },
  {
    id: 'current-resistance',
    topic: 'Current & Resistance',
    title: 'Current & Resistance',
    conceptTags: ['current', 'resistance', 'drift velocity', 'ohms law'],
    difficultyLevel: 1,
    commonMisconceptions: [
      'electrons move at the speed of light',
      'current flows from - to +',
    ],
    recommendedUseCases: ['circuit basics', "Ohm's Law"],
    caption: {
      what: 'Current is the net flow of charge carriers through a conductor.',
      why: 'Resistance determines how much current flows for a given voltage.',
      notice: 'Drift velocity is surprisingly slow — about 1 mm/s.',
    },
  },
  {
    id: 'dc-circuits',
    topic: 'DC Circuits',
    title: 'DC Circuits',
    conceptTags: ['circuit', 'series', 'parallel', 'resistor', 'voltage drop'],
    difficultyLevel: 1,
    commonMisconceptions: [
      'all resistors get same current in parallel',
      'battery is used up in resistors',
    ],
    recommendedUseCases: ["Kirchhoff's laws", 'circuit analysis'],
    caption: {
      what: 'Charges flow through resistors, dropping voltage along the way.',
      why: 'DC circuits are the foundation of electronics.',
      notice: 'Color shows voltage — brighter means higher potential.',
    },
  },
  {
    id: 'magnetic-fields',
    topic: 'Magnetic Fields',
    title: 'Magnetic Field Patterns',
    conceptTags: ['magnetic field', 'field lines', 'dipole', 'right-hand rule'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'B field lines start/end on poles',
      'field is zero inside magnet',
    ],
    recommendedUseCases: ['intro to magnetism', 'right-hand rule'],
    caption: {
      what: 'Magnetic fields form closed loops — they have no source or sink.',
      why: 'Understanding field geometry is key to motors and generators.',
      notice: 'Field lines never cross and always form closed loops.',
    },
  },
  {
    id: 'magnetic-force',
    topic: 'Magnetic Force',
    title: 'Magnetic Force on a Charge',
    conceptTags: ['magnetic force', 'cross product', 'lorentz force', 'circular motion'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'force is parallel to velocity',
      'stationary charges feel magnetic force',
    ],
    recommendedUseCases: ['cyclotron motion', 'mass spectrometers'],
    caption: {
      what: 'A moving charge in a magnetic field feels a force perpendicular to its velocity.',
      why: 'This causes circular motion — the basis of particle accelerators.',
      notice: 'F = qv × B — force is always perpendicular to velocity.',
    },
  },
  {
    id: 'biot-savart',
    topic: 'Sources of Magnetic Fields',
    title: 'Biot-Savart Law',
    conceptTags: ['biot-savart', 'current', 'magnetic field', 'wire', 'solenoid'],
    difficultyLevel: 3,
    commonMisconceptions: [
      'field is strongest far from wire',
      'solenoid field is non-uniform',
    ],
    recommendedUseCases: ['calculating B from current distributions'],
    caption: {
      what: 'Current-carrying conductors create magnetic fields around them.',
      why: 'This is how electromagnets, motors, and MRI machines work.',
      notice: 'Field strength drops with distance from the wire.',
    },
  },
  {
    id: 'amperes-law',
    topic: "Ampere's Law",
    title: "Ampere's Law",
    conceptTags: ['ampere', 'current', 'magnetic field', 'loop', 'symmetry'],
    difficultyLevel: 3,
    commonMisconceptions: [
      'loop shape matters',
      'only works for infinite wires',
    ],
    recommendedUseCases: ['symmetric current distributions'],
    caption: {
      what: 'The line integral of B around any closed loop equals μ₀ times the enclosed current.',
      why: "Like Gauss's Law, it makes field calculation easy with symmetry.",
      notice: 'B is constant in magnitude along a circular Amperian loop.',
    },
  },
  {
    id: 'faradays-law',
    topic: "Faraday's Law",
    title: "Faraday's Law of Induction",
    conceptTags: ['faraday', 'induction', 'flux', 'emf', 'lenz'],
    difficultyLevel: 2,
    commonMisconceptions: [
      'magnet must touch coil to induce current',
      'induced current opposes magnet',
    ],
    recommendedUseCases: ['generators', 'transformers', 'inductors'],
    caption: {
      what: 'A changing magnetic flux through a loop induces an EMF.',
      why: 'This is how generators produce electricity.',
      notice: 'Faster change = stronger induced EMF.',
    },
  },
  {
    id: 'inductance',
    topic: 'Inductance',
    title: 'Inductance & Back-EMF',
    conceptTags: ['inductance', 'back-emf', 'inductor', 'energy storage'],
    difficultyLevel: 3,
    commonMisconceptions: [
      'inductor behaves like resistor',
      'inductance depends on current',
    ],
    recommendedUseCases: ['RL circuits', 'filter design'],
    caption: {
      what: 'An inductor resists changes in current by generating a back-EMF.',
      why: 'Inductors store energy in their magnetic field.',
      notice: 'The back-EMF always opposes the change in current.',
    },
  },
  {
    id: 'rlc-circuits',
    topic: 'RLC Circuits',
    title: 'RLC Circuit Oscillations',
    conceptTags: ['rlc', 'resonance', 'oscillation', 'damping', 'lc'],
    difficultyLevel: 3,
    commonMisconceptions: [
      'resistance always kills oscillation immediately',
      'energy is lost in LC',
    ],
    recommendedUseCases: ['resonance', 'filters', 'oscillator design'],
    caption: {
      what: 'Energy sloshes between the inductor and capacitor, creating oscillations.',
      why: 'RLC circuits are the basis of radio tuners and signal filters.',
      notice: 'Resistance damps the oscillation — watch energy decay over time.',
    },
  },
  {
    id: 'em-waves',
    topic: 'Electromagnetic Waves',
    title: 'Electromagnetic Waves',
    conceptTags: ['em wave', 'light', 'propagation', 'E field', 'B field', 'maxwell'],
    difficultyLevel: 3,
    commonMisconceptions: [
      'EM waves need a medium',
      'E and B fields are separate',
    ],
    recommendedUseCases: ['optics intro', 'radio waves', "Maxwell's equations"],
    caption: {
      what: 'Oscillating E and B fields propagate together at the speed of light.',
      why: 'All light, radio, X-rays, and microwaves are EM waves.',
      notice: 'E and B are always perpendicular to each other and to the direction of travel.',
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers (used by existing pages)
// ─────────────────────────────────────────────────────────────────────────────

export function getVisualizationById(id: string): VisualizationMeta | undefined {
  return VISUALIZATIONS.find((v) => v.id === id)
}

export function getVisualizationsByDifficulty(level: 1 | 2 | 3): VisualizationMeta[] {
  return VISUALIZATIONS.filter((v) => v.difficultyLevel === level)
}

// ─────────────────────────────────────────────────────────────────────────────
// TopicToVisualizationMapper
//
// Maps a plain-text topic string (e.g. from a syllabus, search, or AI output)
// to the best matching visualization ID.
// ─────────────────────────────────────────────────────────────────────────────

/** Keyword → visualization-id mapping table */
const TOPIC_KEYWORD_MAP: Record<string, string[]> = {
  'electric-charge':    ['coulomb', 'charge', 'attraction', 'repulsion', 'point charge'],
  'electric-field':     ['electric field', 'field line', 'test charge', 'e field', 'field vector'],
  'electric-flux':      ['flux', 'field through surface', 'surface integral'],
  'gauss-law':          ['gauss', 'gaussian surface', 'enclosed charge'],
  'electric-potential': ['potential', 'voltage', 'equipotential', 'volt', 'potential difference'],
  'potential-energy':   ['potential energy', 'electric energy', 'work done by field', 'pe'],
  'capacitors':         ['capacitor', 'capacitance', 'dielectric', 'parallel plate'],
  'current-resistance': ['current', 'resistance', 'ohm', 'drift velocity', 'resistivity'],
  'dc-circuits':        ['circuit', 'kirchhoff', 'series', 'parallel', 'voltage divider', 'dc'],
  'magnetic-fields':    ['magnetic field', 'b field', 'dipole', 'field lines magnet'],
  'magnetic-force':     ['magnetic force', 'lorentz', 'cross product', 'circular motion in field'],
  'biot-savart':        ['biot', 'savart', 'wire', 'current loop', 'solenoid field'],
  'amperes-law':        ['ampere', 'line integral', 'amperian loop'],
  'faradays-law':       ['faraday', 'induction', 'induced emf', 'lenz', 'changing flux'],
  'inductance':         ['inductance', 'inductor', 'back emf', 'self induction', 'rl circuit'],
  'rlc-circuits':       ['rlc', 'lc circuit', 'resonance', 'damping', 'oscillation', 'ac circuit'],
  'em-waves':           ['electromagnetic wave', 'em wave', 'light wave', 'maxwell', 'radiation', 'photon'],
}

/**
 * TopicToVisualizationMapper — given a topic string, returns the most relevant
 * visualization ID(s). Returns an empty array if no match is found.
 *
 * @param topic - Free-text topic description
 * @param maxResults - Maximum number of IDs to return (default 3)
 */
export function TopicToVisualizationMapper(topic: string, maxResults = 3): string[] {
  const normalized = topic.toLowerCase()

  const scores: Array<{ id: string; score: number }> = Object.entries(TOPIC_KEYWORD_MAP).map(
    ([id, keywords]) => {
      const score = keywords.reduce(
        (acc, kw) => acc + (normalized.includes(kw) ? kw.split(' ').length : 0),
        0,
      )
      return { id, score }
    },
  )

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.id)
}

// ─────────────────────────────────────────────────────────────────────────────
// MisconceptionRecommender
//
// Given a keyword describing a misconception (e.g. "charges repel equally"),
// returns visualization IDs that directly address it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MisconceptionRecommender — matches a keyword against each visualization's
 * `commonMisconceptions` and `conceptTags` arrays and returns matching IDs,
 * sorted by relevance.
 *
 * @param keyword - A word or short phrase describing the misconception
 * @param maxResults - Maximum number of results (default 5)
 */
export function MisconceptionRecommender(keyword: string, maxResults = 5): string[] {
  const kw = keyword.toLowerCase()

  const scored = VISUALIZATIONS.map((v) => {
    const misconceptionMatches = v.commonMisconceptions.filter((m) =>
      m.toLowerCase().includes(kw),
    ).length

    const tagMatches = v.conceptTags.filter((t) => t.toLowerCase().includes(kw)).length

    // Misconception matches are worth more than tag matches
    const score = misconceptionMatches * 3 + tagMatches

    return { id: v.id, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.id)
}

// Also export the old name for any existing callers
export const findByMisconception = (keyword: string) => MisconceptionRecommender(keyword)
