export interface SquawkInfo {
  code: string;
  label: string;
  description: string;
  isEmergency: boolean;
  color: string;
}

export function decodeSquawk(squawk: string | null | undefined): SquawkInfo | null {
  if (!squawk) return null;
  switch (squawk) {
    case "7500":
      return { code: squawk, label: "HIJACK", description: "Unlawful interference — the crew is signalling a hijack silently to ATC.", isEmergency: true, color: "#ef4444" };
    case "7600":
      return { code: squawk, label: "RADIO FAILURE", description: "Lost two-way radio communication with ATC.", isEmergency: true, color: "#ef4444" };
    case "7700":
      return { code: squawk, label: "EMERGENCY", description: "General emergency — engine, medical, fuel, or other situation requiring immediate help.", isEmergency: true, color: "#ef4444" };
    case "7000":
      return { code: squawk, label: "VFR", description: "Standard VFR conspicuity code (Europe).", isEmergency: false, color: "#9ca3af" };
    case "1200":
      return { code: squawk, label: "VFR (US)", description: "Standard VFR squawk in the US/Canada.", isEmergency: false, color: "#9ca3af" };
    case "2000":
      return { code: squawk, label: "NO ATC", description: "Entering controlled airspace without an assigned code.", isEmergency: false, color: "#9ca3af" };
    case "1000":
      return { code: squawk, label: "MODE S", description: "Mode S identity in use; no discrete octal code needed.", isEmergency: false, color: "#9ca3af" };
    case "7777":
      return { code: squawk, label: "MILITARY", description: "Military interceptor operations.", isEmergency: false, color: "#fb923c" };
    default:
      return { code: squawk, label: squawk, description: "Discrete ATC-assigned transponder code.", isEmergency: false, color: "#d1d5db" };
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  A1: "Light", A2: "Small", A3: "Large", A4: "High Vortex",
  A5: "Heavy", A6: "High Performance", A7: "Rotorcraft",
  B1: "Glider", B2: "Lighter-than-Air", B3: "Parachutist",
  B4: "Ultralight", B6: "UAV", B7: "Space",
  C1: "Surface Vehicle", C2: "Service Vehicle", C3: "Fixed Obstacle",
};
