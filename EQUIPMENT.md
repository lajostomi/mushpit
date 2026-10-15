# Mushroom Bio-Resistance Monitor ("MycoPulse") — Equipment & Prompts

This document contains the complete equipment specification, circuit wiring, and ready-to-use AI prompts for the **MycoPulse** substrate bio-resistance and electrophysiology monitoring setup.

---

## 1. AI System & Context Prompt
> **Usage:** Copy and paste this into ChatGPT, Claude, Gemini, or any LLM when you need help writing code, debugging hardware issues, designing experiments, or analyzing your data.

```text
Project: Mushroom Mycelium Bio-Resistance & Electrophysiology Monitor ("MycoPulse")

Hardware & Equipment Setup:
- Microcontroller: Arduino Uno (ATmega328P, 5V logic, 16 MHz)
- Analog-to-Digital Converter: Adafruit ADS1115 16-bit I2C ADC module
  - Configured at GAIN_ONE (+/- 4.096 V range, ~0.125 mV resolution, ~15 MΩ input impedance)
  - I2C Connections: SDA -> Arduino A4, SCL -> Arduino A5, VDD -> 5V, GND -> GND
- Sensing Electrodes: 2x Stainless steel rods (Rod A and Rod B) inserted directly into the mushroom substrate / mycelium grow bag
- Circuit Topology: Alternating-polarity voltage divider circuit
  - Arduino Pin 2 connects to Rod A
  - Substrate sits between Rod A and Rod B
  - Rod B connects to the measurement central node
  - Central node connects to ADS1115 Channel A0
  - Reference Resistor: 10 kΩ precision resistor connected between the central node and Arduino Pin 3
  - Loading Test Probe: 1 MΩ resistor used externally across the node to test for input impedance loading
- Operation Principle: 
  - Alternating biphasic pulses (Forward: Pin 2 HIGH, Pin 3 LOW; Reverse: Pin 3 HIGH, Pin 2 LOW) with resting states (floating high-impedance INPUT mode) to prevent electrolytic polarization and electrode degradation.
  - Settle time: 5 ms, 8x oversampled per reading.
- Host Interface:
  - 115200 baud serial connection streaming CSV/telemetry to a Web Serial API browser dashboard ("MycoPulse") displaying real-time bio-resistance, electrode settling drift, and hydration estimates.
```

---

## 2. AI Image Generation Prompt
> **Usage:** Copy and paste into Midjourney, DALL-E 3, or Flux to generate realistic concept art, lab photography, or presentation graphics of the setup.

```text
Photorealistic close-up macro photograph of a bio-electrical fungal experiment in a modern laboratory. A mushroom mycelium substrate fruiting block sits on a clean slate lab workbench with two thin stainless steel electrode rods inserted into the dense white mycelium. Colorful silicone alligator clips and jumper wires connect the rods to a solderless breadboard containing a blue Arduino Uno and a small blue Adafruit ADS1115 ADC breakout board with neat 10k ohm resistors. Soft ambient cyan and emerald LED bioluminescence reflects off the workbench. High-detail scientific equipment photography, shallow depth of field, 8k resolution, crisp focus.
```

---

## 3. Bill of Materials (BOM)

| Component | Specification | Role / Placement |
| :--- | :--- | :--- |
| **Microcontroller** | Arduino Uno Rev3 (ATmega328P) | Drives alternating pulse pins (D2, D3), reads I2C, streams serial telemetry at 115200 baud. |
| **Precision ADC** | Adafruit ADS1115 (16-bit I2C) | Measures node voltage with 0.125 mV resolution (40× finer than Arduino's 10-bit analog pins). |
| **Electrodes** | 2× Stainless Steel Rods (Rod A, Rod B) | Inserted into the mycelium block to create a stable electrical interface with the substrate. |
| **Reference Resistor** | 10 kΩ (1% metal film, 0.25W) | Fixed lower/upper arm of the voltage divider connected between the central node and Pin 3. |
| **Diagnostic Resistor** | 1 MΩ resistor | External loading probe held briefly across node to ground to verify ADS1115 input loading. |
| **Substrate / Sample** | Mycelium Colonized Bag / Block | Bio-material sample (e.g. grain/sawdust block) acting as the variable resistor. |
| **Connectors & Leads** | Alligator Clips & Dupont Jumper Wires | Flexible connections between rods, breadboard, and Arduino pins. |
| **Breadboard** | Solderless Half-size Breadboard | Houses the ADS1115 module, 10 kΩ reference resistor, and common wiring node. |

---

## 4. Circuit Wiring Schematic

```text
                  [ Arduino Uno ]
                 +---------------+
                 |        5V     |-------------------> ADS1115 VDD
                 |       GND     |-------------------> ADS1115 GND
                 |        A4     |-------------------> ADS1115 SDA
                 |        A5     |-------------------> ADS1115 SCL
                 |               |
                 |     Pin 2     |--------> [ Alligator Clip ] --------> Rod A
                 +---------------+                                         |
                                                                   [ Substrate / Mycelium ]
                                                                           |
                 +---------------+                                         v
                 |     Pin 3     |--------> [ 10 kΩ Resistor ] -------> Rod B
                 +---------------+                                         |
                                                                           v
                                                                   [ Central Node ]
                                                                           |
                                                                           v
                                                                     ADS1115 A0
```

---

## 5. Key Operating Parameters

- **Serial Baud Rate:** `115200`
- **ADS1115 Gain Setting:** `GAIN_ONE` ($\pm 4.096\text{ V}$ range)
  - *Note:* Do not use finer gain ranges ($\pm 2.048\text{ V}$ or $\pm 1.024\text{ V}$) because their lower internal input impedance loads the high-resistance biological electrodes.
- **Pulse Duration:** ~22 ms total excitation per cycle (5 ms settle + 8 samples forward, 50 ms delay, reverse pulse, then floating `INPUT` rest mode).
- **Settling Criteria:** 3 consecutive 30-second measurement windows with drift change $< 0.3\%$.
