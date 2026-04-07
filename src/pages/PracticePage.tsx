import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { VISUALIZATIONS } from '../services/visualizationMapper'
import { useAppStore } from '../store/appStore'
import { MathText } from '../components/math/MathRenderer'
import { HandwrittenUpload } from '../components/frq/HandwrittenUpload'
import type { UploadedFile } from '../components/frq/HandwrittenUpload'
import { FRQGradingResult } from '../components/frq/FRQGradingResult'
import type { GradingResult } from '../components/frq/FRQGradingResult'
import { parseGradingResponse } from '../lib/grading/rubricEngine'

// ─── Question bank ────────────────────────────────────────────────────────────

interface MCQ {
  id: string
  type: 'mcq'
  topicId: string
  topic: string
  difficulty: 1 | 2 | 3
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface FRQ {
  id: string
  type: 'frq'
  topicId: string
  topic: string
  difficulty: 1 | 2 | 3
  question: string
  rubric: string[]
  sampleAnswer: string
}

type Question = MCQ | FRQ

const ALL_QUESTIONS: Question[] = [
  // ── Electric Charge ──
  { id: 'ec1', type: 'mcq', topicId: 'electric-charge', topic: "Coulomb's Law", difficulty: 1,
    question: "If you double the distance between two charges, the force becomes:",
    options: ["4× stronger", "2× stronger", "4× weaker", "2× weaker"],
    correct: 2, explanation: "F ∝ 1/r². Doubling r means r² grows by 4, so force is 4× weaker." },
  { id: 'ec2', type: 'mcq', topicId: 'electric-charge', topic: "Coulomb's Law", difficulty: 1,
    question: "Two equal positive charges are held fixed. A third positive charge placed exactly midway will:",
    options: ["Accelerate toward charge 1", "Accelerate toward charge 2", "Remain in equilibrium", "Oscillate"],
    correct: 2, explanation: "By symmetry the forces from both charges cancel exactly at the midpoint — unstable equilibrium." },
  { id: 'ec3', type: 'frq', topicId: 'electric-charge', topic: "Coulomb's Law", difficulty: 2,
    question: "Two point charges q₁ = +3 μC and q₂ = −2 μC are 0.4 m apart. (a) Find the magnitude of the force. (b) Is it attractive or repulsive? (c) What happens to the force if both charges are doubled?",
    rubric: ["Correct use of F = kq₁q₂/r²", "k = 8.99×10⁹ N·m²/C²", "F ≈ 0.337 N", "Attractive (opposite signs)", "Force quadruples if both charges double"],
    sampleAnswer: "F = (8.99×10⁹)(3×10⁻⁶)(2×10⁻⁶)/(0.4)² ≈ 0.337 N. The force is attractive because the charges have opposite signs. Doubling both charges multiplies the numerator by 4, so the force quadruples." },

  // ── Electric Field ──
  { id: 'ef1', type: 'mcq', topicId: 'electric-field', topic: "Electric Field", difficulty: 1,
    question: "Electric field lines always point:",
    options: ["From − to +", "From + to −", "Perpendicular to E", "With electron motion"],
    correct: 1, explanation: "Field lines point in the direction a positive test charge would move — away from + and toward −." },
  { id: 'ef2', type: 'mcq', topicId: 'electric-field', topic: "Electric Field", difficulty: 2,
    question: "The electric field inside a conductor in electrostatic equilibrium is:",
    options: ["Maximum at the center", "Equal to the external field", "Zero", "Directed radially outward"],
    correct: 2, explanation: "Free charges redistribute until the internal field is zero — a key property of conductors." },
  { id: 'ef3', type: 'frq', topicId: 'electric-field', topic: "Electric Field", difficulty: 2,
    question: "A +5 nC point charge sits at the origin. (a) Find |E| at r = 0.2 m. (b) Sketch the field line pattern. (c) How does field strength change if r triples?",
    rubric: ["E = kq/r²", "E = (8.99×10⁹)(5×10⁻⁹)/(0.04) ≈ 1124 N/C", "Radial lines outward from positive charge", "Field decreases by factor of 9 when r triples"],
    sampleAnswer: "E = kq/r² = (8.99×10⁹ × 5×10⁻⁹)/0.04 ≈ 1124 N/C. Field lines radiate outward from a positive charge. Tripling r increases r² by 9, so the field drops to 1/9 its original value." },

  // ── Electric Flux ──
  { id: 'fl1', type: 'mcq', topicId: 'electric-flux', topic: "Electric Flux", difficulty: 1,
    question: "A flat surface is parallel to a uniform electric field. The flux through it is:",
    options: ["EA", "EA cos θ", "Zero", "Maximum"],
    correct: 2, explanation: "Φ = E·A·cos θ. When θ = 90° (surface parallel to field), cos 90° = 0, so Φ = 0." },

  // ── Gauss's Law ──
  { id: 'gl1', type: 'mcq', topicId: 'gauss-law', topic: "Gauss's Law", difficulty: 1,
    question: "A Gaussian surface encloses zero net charge. Total flux through it is:",
    options: ["Depends on shape", "Depends on field strength", "Always zero", "Always positive"],
    correct: 2, explanation: "Φ = Q_enc/ε₀. If Q_enc = 0 → Φ = 0 regardless of surface shape." },
  { id: 'gl2', type: 'mcq', topicId: 'gauss-law', topic: "Gauss's Law", difficulty: 2,
    question: "Gauss's Law is most useful when:",
    options: ["Charges are moving fast", "The charge distribution has high symmetry", "The Gaussian surface is very large", "The electric field is zero"],
    correct: 1, explanation: "Symmetry (spherical, cylindrical, planar) allows B to be factored out of the integral, making the math tractable." },
  { id: 'gl3', type: 'frq', topicId: 'gauss-law', topic: "Gauss's Law", difficulty: 3,
    question: "An insulating sphere of radius R carries uniform volume charge density ρ. Derive E(r) both inside (r < R) and outside (r > R) the sphere using Gauss's Law.",
    rubric: ["Choose spherical Gaussian surface", "Outside: Q_enc = ρ(4/3)πR³, E = ρR³/(3ε₀r²)", "Inside: Q_enc = ρ(4/3)πr³, E = ρr/(3ε₀)", "Note E is linear inside, inverse-square outside"],
    sampleAnswer: "Outside (r > R): Gaussian sphere of radius r encloses total Q = ρ·(4πR³/3). By Gauss: E·4πr² = Q/ε₀, so E = ρR³/(3ε₀r²) = Q/(4πε₀r²).\nInside (r < R): enclosed charge is ρ·(4πr³/3). E·4πr² = ρr³/(3ε₀) → E = ρr/(3ε₀). Field grows linearly with r inside." },

  // ── Electric Potential ──
  { id: 'ep1', type: 'mcq', topicId: 'electric-potential', topic: "Electric Potential", difficulty: 1,
    question: "The electric field points in the direction of:",
    options: ["Increasing potential", "Decreasing potential", "Constant potential", "Maximum potential"],
    correct: 1, explanation: "E = −∇V. The field always points from high to low potential — downhill on the potential landscape." },
  { id: 'ep2', type: 'frq', topicId: 'electric-potential', topic: "Electric Potential", difficulty: 2,
    question: "A proton is released from rest at a point where V = +200 V and moves to a point where V = +50 V. (a) Find the work done by the electric field. (b) Find the final kinetic energy.",
    rubric: ["W = q·ΔV = q(V_i − V_f)", "q = +1.6×10⁻¹⁹ C", "ΔV = 200 − 50 = 150 V", "W = 2.4×10⁻¹⁷ J = KE"],
    sampleAnswer: "W = qΔV = (1.6×10⁻¹⁹)(200−50) = (1.6×10⁻¹⁹)(150) = 2.4×10⁻¹⁷ J. Since the proton starts from rest, this equals its final kinetic energy: KE = 2.4×10⁻¹⁷ J." },

  // ── Capacitors ──
  { id: 'cap1', type: 'mcq', topicId: 'capacitors', topic: "Capacitors", difficulty: 1,
    question: "Inserting a dielectric into a capacitor with fixed charge will:",
    options: ["Increase V and decrease C", "Decrease V and increase C", "Increase both", "Have no effect"],
    correct: 1, explanation: "A dielectric reduces E (and V = Ed). Since C = Q/V and Q is fixed, C increases as V drops." },
  { id: 'cap2', type: 'mcq', topicId: 'capacitors', topic: "Capacitors", difficulty: 2,
    question: "Two identical capacitors are connected in parallel. The combined capacitance is:",
    options: ["Half of one", "Equal to one", "Double one", "Four times one"],
    correct: 2, explanation: "Parallel capacitors add: C_total = C₁ + C₂ = 2C." },

  // ── Current & Resistance ──
  { id: 'cr1', type: 'mcq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 1,
    question: "Ohm's Law states that current is:",
    options: ["Inversely proportional to both V and R", "Directly proportional to V, inversely proportional to R", "Directly proportional to R, inversely proportional to V", "Independent of voltage"],
    correct: 1, explanation: "I = V/R. Current increases with voltage and decreases with resistance." },
  { id: 'cr2', type: 'mcq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 1,
    question: "A wire's resistance doubles if its length:",
    options: ["Doubles", "Halves", "Quadruples", "Is unchanged"],
    correct: 0, explanation: "R = ρL/A. Resistance is directly proportional to length — double L, double R." },
  { id: 'cr3', type: 'mcq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 2,
    question: "A 12 V battery drives 3 A through a resistor. The resistance is:",
    options: ["36 Ω", "4 Ω", "0.25 Ω", "9 Ω"],
    correct: 1, explanation: "R = V/I = 12/3 = 4 Ω." },
  { id: 'cr4', type: 'mcq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 2,
    question: "Power dissipated by a resistor can be written as:",
    options: ["P = IR", "P = I²R", "P = V/R", "P = R/V"],
    correct: 1, explanation: "P = I²R = V²/R = IV. Memorize all three forms." },
  { id: 'cr5', type: 'mcq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 1,
    question: "Conventional current flows:",
    options: ["In the direction electrons move", "Opposite to electron flow", "Only in conductors", "Only in semiconductors"],
    correct: 1, explanation: "By convention, current flows from + to − (opposite to electron motion)." },
  { id: 'cr6', type: 'frq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 2,
    question: "A nichrome wire (ρ = 1.1×10⁻⁶ Ω·m) is 2 m long with cross-sectional area 0.5×10⁻⁶ m². (a) Find its resistance. (b) If connected to 9 V, find the current. (c) Find the power dissipated.",
    rubric: ["R = ρL/A", "R = (1.1×10⁻⁶ × 2)/(0.5×10⁻⁶) = 4.4 Ω", "I = V/R = 9/4.4 ≈ 2.05 A", "P = IV = 9 × 2.05 ≈ 18.4 W or P = I²R"],
    sampleAnswer: "R = ρL/A = (1.1×10⁻⁶ × 2)/(0.5×10⁻⁶) = 4.4 Ω. I = V/R = 9/4.4 ≈ 2.05 A. P = IV = 9 × 2.05 ≈ 18.4 W." },
  { id: 'cr7', type: 'frq', topicId: 'current-resistance', topic: 'Current & Resistance', difficulty: 3,
    question: "Resistivity of copper is 1.7×10⁻⁸ Ω·m at 20°C and increases with temperature as ρ(T) = ρ₀[1 + α(T−T₀)] where α = 3.9×10⁻³ /°C. A copper wire has R = 10 Ω at 20°C. (a) Find R at 80°C. (b) If 120 V is applied at each temperature, find the change in current.",
    rubric: ["R(T) = R₀[1 + α(T−T₀)]", "R(80°C) = 10[1 + (3.9×10⁻³)(60)] = 10 × 1.234 = 12.34 Ω", "I₂₀ = 120/10 = 12 A", "I₈₀ = 120/12.34 ≈ 9.73 A", "ΔI ≈ −2.27 A"],
    sampleAnswer: "R(80°C) = 10[1 + (3.9×10⁻³)(60)] ≈ 12.34 Ω. At 20°C: I = 12 A. At 80°C: I = 120/12.34 ≈ 9.73 A. The current drops by about 2.27 A as temperature increases resistance." },

  // ── DC Circuits ──
  { id: 'dc1', type: 'mcq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 1,
    question: "Two resistors in series have equivalent resistance:",
    options: ["R₁R₂/(R₁+R₂)", "R₁ + R₂", "1/R₁ + 1/R₂", "R₁ × R₂"],
    correct: 1, explanation: "Series: R_total = R₁ + R₂ + ... Resistances simply add." },
  { id: 'dc2', type: 'mcq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 1,
    question: "Two resistors in parallel have equivalent resistance:",
    options: ["R₁ + R₂", "R₁ × R₂", "R₁R₂/(R₁+R₂)", "Always less than both"],
    correct: 2, explanation: "Parallel: 1/R_eq = 1/R₁ + 1/R₂, so R_eq = R₁R₂/(R₁+R₂). Always less than the smaller resistor." },
  { id: 'dc3', type: 'mcq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 2,
    question: "In a series circuit with a battery, voltage across each resistor:",
    options: ["Is equal for all resistors", "Adds up to battery voltage", "Is the same as the current", "Is independent of resistance"],
    correct: 1, explanation: "By Kirchhoff's Voltage Law: ΣV = 0 around a loop. Voltage drops must sum to the EMF." },
  { id: 'dc4', type: 'mcq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 2,
    question: "In a parallel circuit, the current through each branch:",
    options: ["Is equal", "Adds to total current", "Equals the voltage", "Depends only on total resistance"],
    correct: 1, explanation: "By Kirchhoff's Current Law: I_total = I₁ + I₂ + ... Branch currents sum to total." },
  { id: 'dc5', type: 'mcq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 3,
    question: "Kirchhoff's Voltage Law is based on:",
    options: ["Conservation of charge", "Conservation of energy", "Newton's third law", "Gauss's Law"],
    correct: 1, explanation: "KVL states net voltage around any closed loop is zero — this is energy conservation (work around a closed path is zero)." },
  { id: 'dc6', type: 'frq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 2,
    question: "A 24 V battery is connected to three resistors: R₁ = 6 Ω in series with a parallel combination of R₂ = 4 Ω and R₃ = 12 Ω. (a) Find the equivalent resistance. (b) Find the current from the battery. (c) Find the voltage across R₁.",
    rubric: ["Parallel: R₂₃ = (4×12)/(4+12) = 3 Ω", "Series: R_eq = 6 + 3 = 9 Ω", "I = V/R_eq = 24/9 ≈ 2.67 A", "V_R1 = IR₁ = 2.67 × 6 = 16 V"],
    sampleAnswer: "R₂₃ = (4×12)/(4+12) = 48/16 = 3 Ω. R_eq = 6 + 3 = 9 Ω. I = 24/9 ≈ 2.67 A. V_R1 = 2.67 × 6 = 16 V." },
  { id: 'dc7', type: 'frq', topicId: 'dc-circuits', topic: 'DC Circuits', difficulty: 3,
    question: "Using Kirchhoff's Laws, find the currents I₁, I₂, I₃ in a circuit with: 12 V battery in loop 1, 6 V battery in loop 2, R₁ = 2 Ω (branch 1), R₂ = 4 Ω (branch 2), R₃ = 6 Ω (shared branch). The batteries oppose each other.",
    rubric: ["Apply KCL: I₁ = I₂ + I₃ (or appropriate junction rule)", "Apply KVL to loop 1: 12 = I₁R₁ + I₃R₃", "Apply KVL to loop 2: 6 = I₂R₂ − I₃R₃", "Solve system of equations for I₁, I₂, I₃", "Verify solutions satisfy all equations"],
    sampleAnswer: "KCL at junction: I₁ = I₂ + I₃. KVL loop 1: 12 = 2I₁ + 6I₃. KVL loop 2: 6 = 4I₂ − 6I₃. Substituting I₁: 12 = 2(I₂+I₃) + 6I₃ = 2I₂ + 8I₃. Solving: 2I₂ + 8I₃ = 12 and 4I₂ − 6I₃ = 6. From the second: I₂ = (6 + 6I₃)/4. Substituting and solving gives I₃ ≈ 0.6 A, I₂ ≈ 2.4 A, I₁ ≈ 3 A." },

  // ── Magnetic Force ──
  { id: 'mf1', type: 'mcq', topicId: 'magnetic-force', topic: "Magnetic Force", difficulty: 1,
    question: "A positive charge moves parallel to B. The magnetic force is:",
    options: ["Maximum", "Along B direction", "Zero", "Perpendicular to v"],
    correct: 2, explanation: "F = qv × B. When v ∥ B, the cross product is zero → no magnetic force." },
  { id: 'mf2', type: 'mcq', topicId: 'magnetic-force', topic: "Magnetic Force", difficulty: 2,
    question: "A charged particle moves in a circle in a uniform magnetic field. If the speed doubles, the radius:",
    options: ["Stays the same", "Doubles", "Halves", "Quadruples"],
    correct: 1, explanation: "r = mv/qB. Doubling v doubles r directly." },
  { id: 'mf3', type: 'frq', topicId: 'magnetic-force', topic: "Magnetic Force", difficulty: 2,
    question: "A proton (m = 1.67×10⁻²⁷ kg, q = 1.6×10⁻¹⁹ C) moves at 2×10⁶ m/s perpendicular to B = 0.5 T. Find the radius of its circular orbit.",
    rubric: ["F = qvB = mv²/r", "r = mv/(qB)", "r = (1.67×10⁻²⁷)(2×10⁶)/((1.6×10⁻¹⁹)(0.5))", "r ≈ 0.0418 m ≈ 4.2 cm"],
    sampleAnswer: "Setting qvB = mv²/r → r = mv/qB = (1.67×10⁻²⁷ × 2×10⁶)/(1.6×10⁻¹⁹ × 0.5) = 3.34×10⁻²¹/8×10⁻²⁰ ≈ 0.0418 m (about 4.2 cm)." },

  // ── Faraday's Law ──
  { id: 'far1', type: 'mcq', topicId: 'faradays-law', topic: "Faraday's Law", difficulty: 1,
    question: "A magnet held stationary near a coil induces:",
    options: ["Maximum EMF", "EMF ∝ B strength", "Zero EMF", "EMF ∝ coil resistance"],
    correct: 2, explanation: "EMF = −dΦ/dt. No change in flux → no induced EMF." },
  { id: 'far2', type: 'mcq', topicId: 'faradays-law', topic: "Faraday's Law", difficulty: 2,
    question: "Lenz's Law states that the induced current will:",
    options: ["Amplify the change in flux", "Oppose the change in flux", "Be proportional to B", "Always flow clockwise"],
    correct: 1, explanation: "Lenz's Law is the −sign in Faraday's Law: induced effects always oppose the cause (conservation of energy)." },
  { id: 'far3', type: 'frq', topicId: 'faradays-law', topic: "Faraday's Law", difficulty: 3,
    question: "A 50-turn coil of area 0.02 m² sits in a magnetic field that increases uniformly from 0.1 T to 0.6 T in 0.5 s. (a) Find the induced EMF. (b) If coil resistance is 10 Ω, find the induced current. (c) What direction is the current by Lenz's Law?",
    rubric: ["EMF = −N·dΦ/dt = −N·A·dB/dt", "dB/dt = (0.6−0.1)/0.5 = 1 T/s", "EMF = 50 × 0.02 × 1 = 1 V", "I = EMF/R = 0.1 A", "Current opposes increasing B (by Lenz's Law)"],
    sampleAnswer: "dB/dt = 0.5/0.5 = 1 T/s. EMF = N·A·|dB/dt| = 50 × 0.02 × 1 = 1 V. I = EMF/R = 1/10 = 0.1 A. By Lenz's Law, the induced current creates a field opposing the increasing B (into the page if B is into the page and increasing)." },

  // ── RLC Circuits ──
  { id: 'rlc1', type: 'mcq', topicId: 'rlc-circuits', topic: "RLC Circuits", difficulty: 1,
    question: "In an ideal LC circuit, energy:",
    options: ["Dissipates as heat", "Stays in L permanently", "Oscillates between L and C", "Is lost to radiation"],
    correct: 2, explanation: "Energy oscillates: magnetic energy in L ↔ electric energy in C, with period T = 2π√(LC)." },
  { id: 'rlc2', type: 'mcq', topicId: 'rlc-circuits', topic: "RLC Circuits", difficulty: 2,
    question: "Adding resistance to an LC circuit causes the oscillations to:",
    options: ["Increase in amplitude", "Oscillate faster", "Damp out exponentially", "Become square waves"],
    correct: 2, explanation: "Resistance dissipates energy each cycle, causing exponentially decaying oscillations." },
  { id: 'rlc3', type: 'frq', topicId: 'rlc-circuits', topic: "RLC Circuits", difficulty: 3,
    question: "An LC circuit has L = 2 mH and C = 8 μF. (a) Find the resonant frequency f₀. (b) At t = 0, the capacitor is fully charged to V₀ = 10 V and no current flows. Write expressions for V_C(t) and I(t).",
    rubric: ["ω₀ = 1/√(LC)", "ω₀ = 1/√(2×10⁻³ × 8×10⁻⁶) = 1/√(1.6×10⁻⁸) ≈ 7906 rad/s", "f₀ = ω₀/2π ≈ 1258 Hz", "V_C(t) = 10 cos(ω₀t)", "I(t) = −V₀C·ω₀ sin(ω₀t) or derived from V₀/Z·sin(ω₀t)"],
    sampleAnswer: "ω₀ = 1/√(LC) = 1/√(1.6×10⁻⁸) ≈ 7906 rad/s, f₀ ≈ 1258 Hz.\nV_C(t) = 10 cos(7906t) V\nI(t) = (10/Z)sin(7906t) where Z = √(L/C), or equivalently I(t) = V₀·C·ω₀·sin(ω₀t) ≈ 0.632 sin(7906t) A." },

  // ── EM Waves ──
  { id: 'emw1', type: 'mcq', topicId: 'em-waves', topic: "EM Waves", difficulty: 1,
    question: "In an electromagnetic wave, E and B fields are:",
    options: ["Parallel to each other and propagation", "⊥ each other, ∥ propagation", "∥ each other, ⊥ propagation", "⊥ each other and to propagation"],
    correct: 3, explanation: "E ⊥ B, and both are ⊥ to the propagation direction. EM waves are transverse." },
  { id: 'emw2', type: 'frq', topicId: 'em-waves', topic: "EM Waves", difficulty: 2,
    question: "An EM wave in vacuum has E-field amplitude E₀ = 300 V/m. (a) Find B₀. (b) Find the intensity I. (c) What type of EM wave has wavelength λ ≈ 500 nm?",
    rubric: ["B₀ = E₀/c = 300/(3×10⁸) = 1×10⁻⁶ T", "I = E₀B₀/(2μ₀) or cε₀E₀²/2", "I ≈ 119.4 W/m²", "500 nm is visible light (green)"],
    sampleAnswer: "B₀ = E₀/c = 300/(3×10⁸) = 1 μT.\nI = (1/2)cε₀E₀² = (1/2)(3×10⁸)(8.85×10⁻¹²)(300²) ≈ 119 W/m².\n500 nm is in the visible light range (green)." },

  // ── Ampere's Law ──
  { id: 'amp1', type: 'mcq', topicId: 'amperes-law', topic: "Ampere's Law", difficulty: 1,
    question: "Ampere's Law is most useful when:",
    options: ["Current is small", "Charge distribution has high symmetry", "Magnetic field is zero", "Only two wires present"],
    correct: 1, explanation: "Like Gauss's Law for E, Ampere's Law is most powerful when symmetry makes B constant along the path." },
  { id: 'amp2', type: 'frq', topicId: 'amperes-law', topic: "Ampere's Law", difficulty: 2,
    question: "A long straight wire carries I = 5 A. Using Ampere's Law, find B at r = 2 cm from the wire. What is the direction?",
    rubric: ["∮B·dl = μ₀I_enc", "B(2πr) = μ₀I", "B = μ₀I/(2πr)", "B = (4π×10⁻⁷ × 5)/(2π × 0.02) = 5×10⁻⁵ T = 50 μT", "Direction: right-hand rule around wire"],
    sampleAnswer: "B·2πr = μ₀I → B = μ₀I/(2πr) = (4π×10⁻⁷ × 5)/(2π × 0.02) = 50 μT. Direction: use right-hand rule — curl fingers in direction of current, B circles the wire." },

  // ── Inductance ──
  { id: 'ind1', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 1,
    question: "Self-inductance L is defined by:",
    options: ["L = NΦ/I", "L = V/I", "L = IR", "L = dI/dV"],
    correct: 0, explanation: "L = NΦ/I, where NΦ is the total flux linkage. Also: EMF = −L·dI/dt." },
  { id: 'ind2', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 1,
    question: "An inductor opposes changes in:",
    options: ["Voltage", "Charge", "Current", "Resistance"],
    correct: 2, explanation: "By Faraday's Law, EMF = −L·dI/dt. The inductor resists any change in the current flowing through it." },
  { id: 'ind3', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 2,
    question: "The time constant τ of a series RL circuit is:",
    options: ["R/L", "L/R", "RL", "1/(RL)"],
    correct: 1, explanation: "τ = L/R. After one time constant, current rises to ~63% of its final value (or falls to ~37% when switched off)." },
  { id: 'ind4', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 2,
    question: "Energy stored in an inductor carrying current I is:",
    options: ["LI", "½LI²", "LI²", "½LI"],
    correct: 1, explanation: "U = ½LI² — analogous to ½CV² for a capacitor. Energy is stored in the magnetic field." },
  { id: 'ind5', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 2,
    question: "When the switch in an RL circuit is opened suddenly (breaking current), the inductor:",
    options: ["Does nothing", "Drives current in the same direction it was flowing", "Reverses the current", "Stores charge like a capacitor"],
    correct: 1, explanation: "By Lenz's Law, the inductor opposes the drop in current — it generates a large EMF to keep current flowing in the same direction, which can cause arcing." },
  { id: 'ind6', type: 'mcq', topicId: 'inductance', topic: 'Inductance', difficulty: 3,
    question: "Doubling the number of turns N of a solenoid (keeping length and radius constant) changes L by a factor of:",
    options: ["2", "4", "1/2", "√2"],
    correct: 1, explanation: "L = μ₀N²A/ℓ. Inductance is proportional to N². Doubling N multiplies L by 4." },
  { id: 'ind7', type: 'frq', topicId: 'inductance', topic: 'Inductance', difficulty: 2,
    question: "A series RL circuit has R = 40 Ω and L = 0.2 H. At t = 0 a 12 V battery is connected. (a) Find the time constant τ. (b) Find the steady-state current. (c) Write I(t) and find I at t = τ.",
    rubric: ["τ = L/R = 0.2/40 = 5 ms", "I_∞ = V/R = 12/40 = 0.3 A", "I(t) = I_∞(1 − e^{−t/τ})", "I(τ) = 0.3(1 − e⁻¹) ≈ 0.3 × 0.632 ≈ 0.190 A"],
    sampleAnswer: "τ = L/R = 0.2/40 = 0.005 s = 5 ms. Steady-state: I_∞ = 12/40 = 0.3 A. I(t) = 0.3(1 − e^{−t/0.005}) A. At t = τ: I = 0.3(1 − 1/e) ≈ 0.190 A." },
  { id: 'ind8', type: 'frq', topicId: 'inductance', topic: 'Inductance', difficulty: 2,
    question: "A solenoid has 500 turns, length 0.25 m, and cross-sectional area 4 cm². (a) Find its self-inductance L. (b) If it carries 2 A, find the stored energy. (c) Find the induced EMF if the current drops from 2 A to 0 in 10 ms.",
    rubric: ["L = μ₀N²A/ℓ", "L = (4π×10⁻⁷)(500²)(4×10⁻⁴)/0.25 ≈ 0.503 mH", "U = ½LI² = ½(0.503×10⁻³)(4) ≈ 1.005×10⁻³ J", "EMF = L·|ΔI/Δt| = (0.503×10⁻³)(2/0.01) ≈ 0.1 V"],
    sampleAnswer: "L = μ₀N²A/ℓ = (4π×10⁻⁷)(250000)(4×10⁻⁴)/0.25 ≈ 5.03×10⁻⁴ H. U = ½LI² ≈ 1.0 mJ. EMF = L·dI/dt = (5.03×10⁻⁴)(200) ≈ 0.1 V." },
  { id: 'ind9', type: 'frq', topicId: 'inductance', topic: 'Inductance', difficulty: 3,
    question: "Explain why a spark or arc often appears when you unplug a device from a wall outlet, relating this to inductance, Lenz's Law, and energy conservation.",
    rubric: ["Current in inductive loads cannot change instantaneously", "L·dI/dt produces a very large EMF when Δt → 0", "Lenz's Law: induced EMF drives current in same direction to oppose change", "Energy stored U = ½LI² must go somewhere — dissipated as spark/arc", "Larger L or faster disconnect = larger spark"],
    sampleAnswer: "Inductive loads (motors, transformers) store energy U = ½LI². When unplugged suddenly, Δt ≈ 0 so dI/dt → ∞, generating an enormous EMF = L·dI/dt. By Lenz's Law, this EMF drives current in the original direction, ionizing the air gap and creating a spark. The spark is the stored magnetic energy being released — consistent with energy conservation." },
]

// ─── Feedback pools ──────────────────────────────────────────────────────────

const FEEDBACK = {
  correct: [
    "Nailed it.",
    "That's the one.",
    "Clean.",
    "Physics is clicking.",
    "You knew that one.",
    "Building momentum.",
    "Locked in.",
    "That's exactly right.",
    "Big brain.",
    "Easy work.",
  ],
  wrong: [
    "Not this time — the reasoning is below.",
    "This one's tricky. Check the explanation.",
    "Close. Worth reading why below.",
    "Good attempt. See the breakdown.",
    "That trips a lot of people — read it once.",
  ],
  streak: (n: number): string => {
    if (n === 3) return "3 in a row. You're in the zone."
    if (n === 5) return "5 straight. Genuinely impressive."
    if (n >= 7)  return `${n} in a row. Actual demon behavior.`
    return `${n} in a row. Keep going.`
  },
  complete: {
    high:   ["That's a strong set. You actually know this.", "Solid performance. The work is paying off.", "Physics is not beating you today.", "Strong finish."],
    mid:    ["Good foundation. Review the ones you missed.", "Progress is real. Keep at it.", "More than halfway there — that counts."],
    low:    ["Rough one. Now you know exactly what to review.", "Every miss is information. Check those explanations.", "Start with the explanations, then retry."],
  },
}

function pick<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'builder' | 'quiz' | 'results'

interface BuilderState {
  selectedTopics: Set<string>
  totalQuestions: number
  mcqCount: number
  frqCount: number
  difficulty: 0 | 1 | 2 | 3
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  page: { maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' } as React.CSSProperties,
  heading: { fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' } as React.CSSProperties,
  sub: { fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' } as React.CSSProperties,
  surface: (active?: boolean): React.CSSProperties => ({
    background: active ? 'rgba(79,142,247,0.08)' : 'var(--bg-surface)',
    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
    borderRadius: '10px',
    padding: '0.875rem 1rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  }),
  btn: (variant: 'primary' | 'ghost' = 'primary'): React.CSSProperties => ({
    padding: '0.625rem 1.5rem',
    borderRadius: '8px',
    border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
    background: variant === 'primary' ? 'var(--accent-blue)' : 'transparent',
    color: variant === 'primary' ? '#fff' : 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  }),
  label: { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.04em' } as React.CSSProperties,
}

// ─── Builder ─────────────────────────────────────────────────────────────────

function PracticeBuilder({ onStart }: { onStart: (qs: Question[]) => void }) {
  const [buildError, setBuildError] = useState<string | null>(null)
  const [cfg, setCfg] = useState<BuilderState>({
    selectedTopics: new Set<string>(),
    totalQuestions: 10,
    mcqCount: 8,
    frqCount: 2,
    difficulty: 0,
  })

  const toggleTopic = (id: string) => {
    setCfg(c => {
      const t = new Set(c.selectedTopics)
      t.has(id) ? t.delete(id) : t.add(id)
      return { ...c, selectedTopics: t }
    })
  }

  const selectAll = () => setCfg(c => ({ ...c, selectedTopics: new Set(VISUALIZATIONS.map(v => v.id)) }))
  const clearAll  = () => setCfg(c => ({ ...c, selectedTopics: new Set() }))

  const buildTest = () => {
    const topicFilter = cfg.selectedTopics.size === 0
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter(q => cfg.selectedTopics.has(q.topicId))

    const diffFiltered = cfg.difficulty === 0
      ? topicFilter
      : topicFilter.filter(q => q.difficulty === cfg.difficulty)

    const mcqs = shuffle(diffFiltered.filter(q => q.type === 'mcq')).slice(0, cfg.mcqCount)
    const frqs = shuffle(diffFiltered.filter(q => q.type === 'frq')).slice(0, cfg.frqCount)
    const combined = shuffle([...mcqs, ...frqs]).slice(0, cfg.totalQuestions)

    if (combined.length === 0) {
      setBuildError(`No questions found. Selected topics: ${Array.from(cfg.selectedTopics).join(', ') || 'none'}. Difficulty: ${DIFF_LABELS[cfg.difficulty]}. Try selecting more topics or using "All Difficulties".`)
      return
    }
    setBuildError(null)
    onStart(combined)
  }

  const DIFF_LABELS = ['All Difficulties', 'Intro', 'Mid-Level', 'Advanced']

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
      <h1 style={S.heading}>Practice Builder</h1>
      <p style={S.sub}>Choose your topics, question types, and difficulty — then start.</p>

      {/* Topic selector */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={S.label}>Topics</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={selectAll} style={{ ...S.btn('ghost'), padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>All</button>
            <button onClick={clearAll}  style={{ ...S.btn('ghost'), padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Clear</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {VISUALIZATIONS.map(v => {
            const active = cfg.selectedTopics.has(v.id)
            return (
              <button key={v.id} onClick={() => toggleTopic(v.id)} style={S.surface(active)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                    background: active ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.625rem', color: '#fff',
                  }}>{active ? '✓' : ''}</span>
                  <span style={{ fontSize: '0.8125rem', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400, textAlign: 'left' }}>
                    {v.topic}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {cfg.selectedTopics.size > 0 && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {cfg.selectedTopics.size} topic{cfg.selectedTopics.size !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Config row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={S.label}>Total Questions</p>
          <input type="range" min={1} max={20} value={cfg.totalQuestions}
            onChange={e => setCfg(c => ({ ...c, totalQuestions: +e.target.value }))}
            style={{ width: '100%', accentColor: 'var(--accent-blue)' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem', marginTop: '0.25rem' }}>{cfg.totalQuestions}</p>
        </div>
        <div>
          <p style={S.label}>MCQ Count</p>
          <input type="range" min={0} max={20} value={cfg.mcqCount}
            onChange={e => setCfg(c => ({ ...c, mcqCount: +e.target.value }))}
            style={{ width: '100%', accentColor: 'var(--accent-blue)' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem', marginTop: '0.25rem' }}>{cfg.mcqCount}</p>
        </div>
        <div>
          <p style={S.label}>FRQ Count</p>
          <input type="range" min={0} max={10} value={cfg.frqCount}
            onChange={e => setCfg(c => ({ ...c, frqCount: +e.target.value }))}
            style={{ width: '100%', accentColor: 'var(--accent-amber)' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem', marginTop: '0.25rem' }}>{cfg.frqCount}</p>
        </div>
        <div>
          <p style={S.label}>Difficulty</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.25rem' }}>
            {DIFF_LABELS.map((label, i) => (
              <button key={i} onClick={() => setCfg(c => ({ ...c, difficulty: i as 0|1|2|3 }))}
                style={{ ...S.surface(cfg.difficulty === i), padding: '0.375rem 0.75rem', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8125rem', color: cfg.difficulty === i ? 'var(--accent-blue)' : 'var(--text-secondary)', fontWeight: cfg.difficulty === i ? 600 : 400 }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={buildTest} style={{ ...S.btn('primary'), padding: '0.75rem 2.5rem', fontSize: '0.9375rem' }}>
        Start Practice →
      </button>
      {buildError && (
        <p style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: 'var(--accent-amber, #f59e0b)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
          {buildError}
        </p>
      )}
    </motion.div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

function QuizView({ questions, onDone }: { questions: Question[]; onDone: (score: number) => void }) {
  const [idx, setIdx]               = useState(0)
  const [selected, setSelected]     = useState<number | null>(null)
  const [answered, setAnswered]     = useState(false)
  const [frqShown, setFrqShown]     = useState(false)
  const [score, setScore]           = useState(0)
  const [streak, setStreak]         = useState(0)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [isGrading, setIsGrading]   = useState(false)
  const [gradingError, setGradingError] = useState<string | null>(null)
  const navigate                    = useNavigate()
  const q = questions[idx]

  const progress = (idx / questions.length) * 100

  const handleMCQSelect = (i: number) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    const isCorrect = (q as MCQ).correct === i
    if (isCorrect) {
      setScore(s => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      setFeedbackMsg(newStreak >= 3 ? FEEDBACK.streak(newStreak) : pick(FEEDBACK.correct))
    } else {
      setStreak(0)
      setFeedbackMsg(pick(FEEDBACK.wrong))
    }
  }

  const handleFRQReveal = () => {
    setFrqShown(true)
    setAnswered(true)
  }

  const handleGrade = useCallback(async () => {
    if (uploadedFiles.length === 0 || isGrading) return
    setIsGrading(true)
    setGradingError(null)
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), 60000)
    try {
      const response = await fetch('/.netlify/functions/grade-frq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: uploadedFiles[0].previewUrl, questionText: q.question }),
        signal: abort.signal,
      })
      clearTimeout(timer)
      if (!response.ok) {
        setGradingError('AI grading is not available in this environment. Run via Netlify Dev with ANTHROPIC_API_KEY configured.')
        return
      }
      const data = await response.json()
      if (data.notConfigured) {
        setGradingError('AI grading requires ANTHROPIC_API_KEY in Netlify environment variables.')
        return
      }
      if (data.error) { setGradingError(`Grading failed: ${data.error}`); return }
      setGradingResult(parseGradingResponse(data.gradingJson, 'Student submission'))
      setAnswered(true)
    } catch (err) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : ''
      setGradingError(msg.includes('abort') ? 'Grading timed out — please try again.' : 'Network error — please try again.')
    } finally {
      setIsGrading(false)
    }
  }, [uploadedFiles, isGrading, q.question])

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
      setFrqShown(false)
      setFeedbackMsg(null)
      setUploadedFiles([])
      setGradingResult(null)
      setGradingError(null)
    } else {
      onDone(score)
    }
  }

  return (
    <div style={S.page}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Question {idx + 1} of {questions.length}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {q.type === 'mcq' ? 'Multiple Choice' : 'Free Response'}
        </span>
      </div>
      <div style={{ height: '3px', background: 'var(--bg-elevated)', borderRadius: '9999px', marginBottom: '1.75rem' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-blue)', borderRadius: '9999px', transition: 'width 0.3s' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
          <div style={{ ...S.surface(), padding: '1.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{q.topic}</span>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.625rem', lineHeight: 1.65 }}><MathText>{q.question}</MathText></p>
          </div>

          {q.type === 'mcq' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(q as MCQ).options.map((opt, i) => {
                const isCorrect = (q as MCQ).correct === i
                const isWrong   = answered && selected === i && !isCorrect
                return (
                  <button key={i} onClick={() => handleMCQSelect(i)} style={{
                    textAlign: 'left', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid',
                    cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s',
                    background: !answered ? 'var(--bg-surface)' : isCorrect ? 'rgba(79,222,152,0.1)' : isWrong ? 'rgba(247,95,95,0.1)' : 'var(--bg-surface)',
                    borderColor: !answered ? 'var(--border)' : isCorrect ? '#4fde98' : isWrong ? '#f75f5f' : 'var(--border)',
                    color: !answered ? 'var(--text-primary)' : isCorrect ? '#4fde98' : isWrong ? '#f75f5f' : 'var(--text-muted)',
                    opacity: answered && !isCorrect && selected !== i ? 0.45 : 1,
                    fontSize: '0.9375rem', lineHeight: 1.5,
                  }}>
                    <span style={{ fontWeight: 700, marginRight: '0.625rem' }}>{String.fromCharCode(65 + i)}.</span><MathText>{opt}</MathText>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Upload your handwritten work */}
              <div style={{ ...S.surface(), padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>Your Work</p>
                <HandwrittenUpload
                  uploaded={uploadedFiles}
                  onUpload={files => { setUploadedFiles(files); setGradingResult(null); setGradingError(null) }}
                  onClear={() => { setUploadedFiles([]); setGradingResult(null); setGradingError(null) }}
                  disabled={isGrading}
                />
                {uploadedFiles.length > 0 && !gradingResult && (
                  <button
                    onClick={handleGrade}
                    disabled={isGrading}
                    style={{ ...S.btn('primary'), marginTop: '0.75rem', opacity: isGrading ? 0.6 : 1 }}
                  >
                    {isGrading ? 'Grading…' : 'Submit for AI Grading →'}
                  </button>
                )}
                {gradingError && (
                  <p style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: '#f7a94f', background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '7px', padding: '0.5rem 0.75rem' }}>
                    {gradingError}
                  </p>
                )}
              </div>

              {/* AI grading result */}
              {gradingResult && <FRQGradingResult result={gradingResult} />}

              {/* Manual reveal toggle */}
              {!frqShown ? (
                <button onClick={handleFRQReveal} style={{ ...S.btn('ghost'), alignSelf: 'flex-start' }}>
                  Show Rubric &amp; Sample Answer
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ ...S.surface(), borderColor: 'var(--accent-amber)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rubric</p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(q as FRQ).rubric.map((r, i) => (
                        <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>✓</span>
                          <MathText>{r}</MathText>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={S.surface()}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Answer</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                      <MathText>{(q as FRQ).sampleAnswer}</MathText>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback + Explanation for MCQ */}
          {answered && q.type === 'mcq' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {feedbackMsg && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  background: selected === (q as MCQ).correct ? 'rgba(79,222,152,0.1)' : 'rgba(247,169,79,0.08)',
                  border: `1px solid ${selected === (q as MCQ).correct ? 'rgba(79,222,152,0.3)' : 'rgba(247,169,79,0.25)'}`,
                  color: selected === (q as MCQ).correct ? '#4fde98' : 'var(--accent-amber)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}>
                  {feedbackMsg}
                </div>
              )}
              <div style={{ ...S.surface(), marginTop: '0.75rem', borderColor: 'var(--border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}><MathText>{(q as MCQ).explanation}</MathText></p>
                <button onClick={() => navigate(`/visualize/${q.topicId}`)} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}>
                  → Visualize this concept
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {answered && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={next}
          style={{ ...S.btn('primary'), marginTop: '1.25rem', padding: '0.75rem 2rem' }}>
          {idx < questions.length - 1 ? 'Next →' : 'See Results'}
        </motion.button>
      )}
    </div>
  )
}

// ─── Results ─────────────────────────────────────────────────────────────────

function ResultsView({ score, total, onRetry, onNew }: { score: number; total: number; onRetry: () => void; onNew: () => void }) {
  const pct = Math.round((score / total) * 100)
  const color = pct >= 80 ? '#4fde98' : pct >= 60 ? '#f7a94f' : '#f75f5f'
  const markProgress = useAppStore(s => s.markProgress)
  const pool = pct >= 80 ? FEEDBACK.complete.high : pct >= 60 ? FEEDBACK.complete.mid : FEEDBACK.complete.low
  const headline = useMemo(() => pick(pool), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark a practice session as completed
  useMemo(() => { markProgress('practice-session') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ ...S.page, textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>
        {pct >= 80 ? '⚡' : pct >= 60 ? '📚' : '🔋'}
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
        {headline}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
        {score} / {total} correct &nbsp;·&nbsp; <span style={{ color }}>{pct}%</span>
      </p>

      {/* Score bar */}
      <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '9999px', maxWidth: '360px', margin: '0 auto 2rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '9999px', transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={S.btn('primary')}>Retry Same Set</button>
        <button onClick={onNew}   style={S.btn('ghost')}>Build New Practice</button>
      </div>
    </motion.div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── Page orchestration ───────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase]         = useState<Phase>('builder')
  const [questions, setQuestions] = useState<Question[]>([])
  const [finalScore, setFinalScore] = useState(0)

  const handleStart = (qs: Question[]) => { setQuestions(qs); setPhase('quiz') }
  const handleDone  = (s: number)      => { setFinalScore(s); setPhase('results') }
  const handleRetry = ()               => { setPhase('quiz') }
  const handleNew   = ()               => { setQuestions([]); setPhase('builder') }

  return (
    <AnimatePresence mode="wait">
      {phase === 'builder' && <PracticeBuilder key="builder" onStart={handleStart} />}
      {phase === 'quiz'    && <QuizView key="quiz" questions={questions} onDone={handleDone} />}
      {phase === 'results' && <ResultsView key="results" score={finalScore} total={questions.length} onRetry={handleRetry} onNew={handleNew} />}
    </AnimatePresence>
  )
}
