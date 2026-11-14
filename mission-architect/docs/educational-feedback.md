# Educational Feedback Reference — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)  
**Date:** 2026-11-14  
**Phase:** 3 — Evaluation Test Matrix and Educational Feedback  
**Status:** Approved Educational Content for Mission Results & Help Modals  

---

## Pedagogical Philosophy

In **Mission Architect — Beyond Earth**, failure is never a dead end — it is the most valuable part of the engineering process. 

Every design evaluation explains:
1. **The Outcome:** What happened in space as a result of the player's choices.
2. **The Physics/Engineering Root Cause:** Why space hardware works this way.
3. **The Practical Trade-off:** How to balance conflicting requirements (mass, power, cost, performance) to succeed on the next attempt.

---

## Educational Feedback Modules

---

### 1. Successful Spacecraft Design

- **UI Summary Badge:**  
  `MISSION ACCOMPLISHED: ORBITAL INSERTION CONFIRMED`
- **Short Message for Game UI:**  
  "Telemetry confirms all subsystems nominal. Your satellite is generating ample power, pointing reliably at Earth, and beaming vital scientific observations back to mission control!"
- **Detailed Explanation for Students:**  
  Spacecraft engineering is the art of compromise. A successful satellite doesn't need the biggest or most expensive parts in every category — it needs components that harmonize. Your solar panels generate enough electricity to run all instruments with safety margin to spare, your battery keeps the computers alive when Earth's shadow blocks the Sun, and your launcher delivered your payload precisely into its target trajectory.
- **What Caused the Result:**  
  All seven physical feasibility checks passed cleanly. The power output exceeded demand by at least 10%, the total mass stayed within launcher payload limits, and the communication downlink rate accommodated all scientific data produced.
- **Practical Suggestion for Continued Play:**  
  "You've mastered the baseline Earth observation profile! Next, try challenging yourself: can you upgrade to a Multispectral Imager or achieve Sun-Synchronous Orbit while keeping your budget under control?"

---

### 2. Alternative Component Choice

- **UI Summary Badge:**  
  `INNOVATIVE DESIGN: VALID ENGINEERING PATHWAY`
- **Short Message for Game UI:**  
  "Great engineering ingenuity! You chose a different combination of components than the baseline blueprint, but your spacecraft satisfies every physical and mission requirement."
- **Detailed Explanation for Students:**  
  There is rarely a single 'correct' answer in aerospace engineering. One engineer might choose a heavier, cheaper battery and a smaller camera to save budget, while another chooses high-efficiency solar cells to power advanced sensors. Both satellites can complete the mission successfully. What matters is that your total mass, power, communications, and trajectory balance out.
- **What Caused the Result:**  
  The player selected non-standard or alternative components (such as High-Efficiency Solar Arrays or Sun-Synchronous Orbit) and successfully balanced the cascading mass, power, and cost consequences.
- **Practical Suggestion for Continued Play:**  
  "Check your score breakdown to see how your choices shifted your category ratings. High-performance instruments increase scientific output, but watch out for higher power draw and launch vehicle costs!"

---

### 3. Excessive Spacecraft Mass

- **UI Summary Badge:**  
  `LAUNCH ABORT: PAYLOAD CAPACITY EXCEEDED`
- **Short Message for Game UI:**  
  "Your spacecraft is too heavy! The rocket cannot generate enough thrust and velocity to lift this satellite into orbit."
- **Detailed Explanation for Students:**  
  Rockets work according to Newton's Third Law and Tsiolkovsky's Rocket Equation. Every single kilogram sent into orbit requires a massive amount of rocket fuel. Launch vehicles have a strict **maximum payload capacity**. If your satellite exceeds this limit by even a few kilograms, the rocket cannot accelerate to orbital velocity (approximately 7.8 km/s or 28,000 km/h) and will fail to reach space.
- **What Caused the Result:**  
  The sum of your spacecraft component masses exceeded the maximum payload capacity of your chosen launch vehicle (e.g. total mass > 50 kg for Launcher Alpha).
- **Practical Suggestion for Improving the Design:**  
  "Look at your heaviest components in the Workshop summary. The satellite structure (bus) and high-capacity batteries are often the biggest contributors to mass. Try swapping to the Small Satellite Bus or switching to Launcher Beta, which can lift up to 150 kg."

---

### 4. Insufficient Electrical Power

- **UI Summary Badge:**  
  `SYSTEM BROWNOUT: POWER DEFICIT DETECTED`
- **Short Message for Game UI:**  
  "Power generation shortfall! Your solar panels cannot produce enough electricity to run all active instruments and subsystems in sunlight."
- **Detailed Explanation for Students:**  
  Unlike cars or planes, satellites cannot pull over when they run out of energy. In space, electrical power must be continuously generated from sunlight using solar arrays. Active electronics (on-board computers, radio transmitters, attitude thrusters, and scientific cameras) continuously draw electrical current. If total power consumption exceeds solar panel generation, the spacecraft's voltage drops, onboard computers restart, and the satellite enters a tumbling brownout.
- **What Caused the Result:**  
  Total electrical power draw across all components multiplied by the 1.1 safety reserve factor exceeded the power output of your solar panels (e.g. power output < total draw × 1.1).
- **Practical Suggestion for Improving the Design:**  
  "You have two options: increase supply or reduce demand. You can upgrade to the High-Efficiency Solar Array (140 W output), or reduce power consumption by switching to lower-draw subsystems (such as the standard computer or standard ADCS)."

---

### 5. Incompatible Orbit and Launcher

- **UI Summary Badge:**  
  `TRAJECTORY MISMATCH: LAUNCH VEHICLE INCOMPATIBLE`
- **Short Message for Game UI:**  
  "Trajectory failure! Your chosen rocket does not have the capability to deliver payloads into your selected orbit."
- **Detailed Explanation for Students:**  
  Reaching space isn't just about going high — it's about going sideways fast enough to fall around Earth! Different orbits require vastly different amounts of energy and rocket stages:
  - **Low Earth Orbit (LEO):** Requires standard eastward launches benefiting from Earth's rotation.
  - **Sun-Synchronous Orbit (SSO):** A retrograde polar orbit that requires flying north-south against Earth's spin, demanding significantly more rocket energy and specialized guidance.
  Small launch vehicles (like Launcher Alpha) lack the upper-stage thrust to achieve polar inclinations.
- **What Caused the Result:**  
  You selected Sun-Synchronous Orbit (SSO-600), but assigned Launcher Alpha (`launch-a`), which is only certified for Low Earth Orbit (`leo-500`).
- **Practical Suggestion for Improving the Design:**  
  "If you want to observe Earth from a Sun-Synchronous Orbit, upgrade your launch vehicle to Launcher Beta (`launch-b`). If your budget is tight, switch your orbit to Low Earth Orbit (`leo-500`) to keep Launcher Alpha."

---

### 6. Missing Mandatory Subsystem

- **UI Summary Badge:**  
  `INCOMPLETE ASSEMBLY: CRITICAL SUBSYSTEM MISSING`
- **Short Message for Game UI:**  
  "Your spacecraft cannot launch because one or more essential subsystems have not been installed!"
- **Detailed Explanation for Students:**  
  A satellite is an integrated robotic vehicle. If you forget the antenna, you take pictures you can never send home. If you forget the computer, there is nothing to process commands. If you forget attitude control, the satellite tumbles randomly and points its camera into deep space instead of at Earth. Every satellite must possess all core subsystems: Structure, Power, Battery, Communications, Computer, ADCS, and at least one Scientific Instrument.
- **What Caused the Result:**  
  One or more of the nine mandatory categories (`structure`, `power`, `battery`, `communications`, `computer`, `adcs`, `instrument`, `orbit`, `launcher`) were omitted from the configuration.
- **Practical Suggestion for Improving the Design:**  
  "Open the Spacecraft Workshop and review the subsystem checklist on the left navigation panel. Ensure every tab has an active green checkmark indicating a selected component."

---

### 7. Overall Score Below 30%

- **UI Summary Badge:**  
  `MISSION EVALUATION: SCORE BELOW 30% THRESHOLD`
- **Short Message for Game UI:**  
  "Your design failed to meet the minimum 30% mission effectiveness score. Subsystem mismatches severely degraded operational performance."
- **Detailed Explanation for Students:**  
  Even if individual parts work, they must work *together*. When high-performance sensors are paired with weak support systems, the entire mission suffers:
  - If you select an infrared imager that requires precision pointing, pairing it with a standard attitude control system causes camera shake and blurred data.
  - If you generate 3.5 Mbps of multispectral data but only install a 0.5 Mbps antenna, data piles up and gets lost.
  Compounding mismatches pull your category ratings down below the passing threshold.
- **What Caused the Result:**  
  The weighted sum of your category scores totaled less than 30.0%. In the space agency's evaluation model, a score under 30% is considered non-viable for flight authorization.
- **Practical Suggestion for Improving the Design:**  
  "Check the category score breakdown on your Results page. Identify your lowest scoring category. Match precision instruments with precision ADCS, and high-bandwidth sensors with the X-Band High-Gain Antenna."

---

### 8. Exactly 30% Score Threshold Boundary

- **UI Summary Badge:**  
  `MARGINAL PASS: SCORE THRESHOLD ACHIEVED (30.0%)`
- **Short Message for Game UI:**  
  "Your spacecraft scored exactly 30.0% — the exact cutoff for flight score approval! Review feasibility checks to ensure physical flight safety."
- **Detailed Explanation for Students:**  
  In aerospace procurement and mission architecture, flight readiness thresholds establish the minimum allowable score for a mission concept to receive funding and flight clearance. A score of exactly 30.0% satisfies the score threshold alone, representing a design with minimal acceptable utility. However, a spacecraft must ALSO pass all physical feasibility constraints (mass, power, battery, and trajectory) to actually fly!
- **What Caused the Result:**  
  The weighted score landed on the exact boundary line ($30.0\%$).
- **Practical Suggestion for Improving the Design:**  
  "A 30% score earns partial reward, but there is enormous room for optimization! Review which subsystems are dragging down your score and upgrade mismatched components to earn Silver or Gold tier rewards."

---

### 9. High Cost or Budget Concerns

- **UI Summary Badge:**  
  `FISCAL ADVISORY: BUDGET CONSTRAINTS EXCEEDED`
- **Short Message for Game UI:**  
  "Budget alert: Total mission expenditure exceeds the available agency allocation of $500,000."
- **Detailed Explanation for Students:**  
  Space exploration is constrained by economics just as much as physics. Governments and commercial agencies allocate strict budgets for space missions. Selecting top-of-the-line components in every category (Reinforced Bus, High-Efficiency Solar, Precision ADCS, Thermal IR sensor, and Launcher Beta) creates a magnificent satellite, but one that the agency cannot afford to build or launch.
- **What Caused the Result:**  
  The sum of component costs and launch vehicle contract price exceeded the $500,000 mission budget.
- **Practical Suggestion for Improving the Design:**  
  "Engineering is about maximizing performance per dollar. The Small Satellite Bus ($25,000) and Standard On-Board Computer ($20,000) offer substantial cost savings without sacrificing core mission capabilities. Look for areas where standard components are 'good enough'."

---

### 10. Poor Component Suitability

- **UI Summary Badge:**  
  `SYSTEM MISMATCH: SUBOPTIMAL COMPONENT PAIRING`
- **Short Message for Game UI:**  
  "Inefficient hardware combination: Certain components are poorly matched to your mission objectives or to adjacent subsystems."
- **Detailed Explanation for Students:**  
  Every satellite component is designed for specific operational envelopes:
  - Putting a heavily shielded, radiation-hardened 28 kg bus on a 2-year low Earth orbit satellite adds dead weight without delivering any benefit.
  - Using a small UHF patch antenna to downlink megabytes of high-resolution multispectral imagery forces the satellite to discard valuable scientific measurements.
  Engineering excellence means choosing the *appropriate* tool for the specific task.
- **What Caused the Result:**  
  Components received lower suitability ratings in `component-suitability.json` due to over-engineering (excessive mass/cost where not needed) or under-engineering (bottlenecking a superior instrument).
- **Practical Suggestion for Improving the Design:**  
  "Read the component descriptions in the Workshop carefully! Look for synergy: pair the Optical Camera with the Small Bus and Standard ADCS, or pair the Multispectral Imager with the X-Band High-Gain Antenna."
