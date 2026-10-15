// MycoPulse: alternating-polarity bio-resistance meter -> serial CSV "ms,ohms"
// Wiring: D2 -> Rod A | substrate | Rod B -> node -> ADS1115 A0 ; node -> 10k -> D3
// Library: Adafruit ADS1X15 (Library Manager)
#include <Wire.h>
#include <Adafruit_ADS1X15.h>

const uint8_t PIN_A = 2;            // drives Rod A side
const uint8_t PIN_B = 3;            // drives reference-resistor side
const float   R_REF = 10000.0;      // measure your 10k and put the real value here
const float   VCC   = 5.0;          // measure the Uno 5V pin for best accuracy
const uint8_t SETTLE_MS = 5;
const uint8_t SAMPLES   = 8;
const uint8_t REST_MS   = 50;       // floating pause between polarities (limits electrode polarisation)
const uint16_t CYCLE_MS = 200;      // one output line per cycle

Adafruit_ADS1115 ads;

float readNode() {                  // average of SAMPLES conversions, in volts
  long sum = 0;
  for (uint8_t i = 0; i < SAMPLES; i++) sum += ads.readADC_SingleEnded(0);
  return ads.computeVolts(sum / (float)SAMPLES);
}

void rest() { pinMode(PIN_A, INPUT); pinMode(PIN_B, INPUT); }

void setup() {
  Serial.begin(115200);
  rest();
  ads.setGain(GAIN_ONE);                   // +/-4.096 V
  ads.setDataRate(RATE_ADS1115_860SPS);    // ~1.2 ms per sample
  if (!ads.begin()) { Serial.println("ADS1115 not found"); while (1); }
}

void loop() {
  unsigned long t0 = millis();

  // forward: A high, B low -> node = VCC * Rref / (Rsub + Rref)
  pinMode(PIN_A, OUTPUT); pinMode(PIN_B, OUTPUT);
  digitalWrite(PIN_A, HIGH); digitalWrite(PIN_B, LOW);
  delay(SETTLE_MS);
  float vf = readNode();
  rest(); delay(REST_MS);

  // reverse: B high, A low -> node = VCC * Rsub / (Rsub + Rref)
  pinMode(PIN_A, OUTPUT); pinMode(PIN_B, OUTPUT);
  digitalWrite(PIN_B, HIGH); digitalWrite(PIN_A, LOW);
  delay(SETTLE_MS);
  float vr = readNode();
  rest();

  float rf = (vf > 0.001)        ? R_REF * (VCC / vf - 1.0)   : NAN;
  float rr = (vr < VCC - 0.001)  ? R_REF * vr / (VCC - vr)    : NAN;
  float r  = (isnan(rf) || isnan(rr)) ? (isnan(rf) ? rr : rf) : (rf + rr) / 2.0;

  if (!isnan(r)) { Serial.print(t0); Serial.print(','); Serial.println(r, 1); }

  while (millis() - t0 < CYCLE_MS) {}      // fixed ~5 Hz update rate
}
