import type { IncidentSignal, DemoScenario } from "@/lib/schemas";

export const heatwaveWaterSignals: IncidentSignal[] = [
  {
    id: "hw-001",
    type: "heatwave_alert",
    title: "Extreme Heatwave Warning — Zone A",
    description:
      "India Meteorological Department issues red alert. Temperatures expected to reach 44°C for 3 consecutive days. Vulnerable populations at risk: elderly care homes, outdoor workers, school children.",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    location: {
      address: "Sector 14, Greenfield Township",
      lat: 28.6139,
      lng: 77.209,
      zone: "Zone A",
    },
    source: "weather_api",
    severity: 9,
    affectedPopulation: 12400,
  },
  {
    id: "hw-002",
    type: "water_outage",
    title: "Water Supply Cut — Sector 12 & 14",
    description:
      "Municipal water supply disrupted due to pump failure at Sector 12 treatment plant. Residents report no water for 6+ hours. Summer demand at peak. Nearby hospital also affected.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: {
      address: "Sector 12, Water Pump Station Road",
      lat: 28.612,
      lng: 77.207,
      zone: "Zone A",
    },
    source: "manual_report",
    severity: 8,
    affectedPopulation: 8200,
  },
  {
    id: "hw-003",
    type: "clinic_shortage",
    title: "Clinic Heatstroke Kit Stock Critical",
    description:
      "PHC Sector 10 reports ORS packets, IV fluids, and cooling blankets running critically low. 3 heatstroke cases already admitted. Expected surge in next 48 hours.",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    location: {
      address: "PHC Sector 10, Health Complex",
      lat: 28.611,
      lng: 77.205,
      zone: "Zone A",
    },
    source: "facility_status",
    severity: 9,
    affectedPopulation: 5000,
  },
  {
    id: "hw-004",
    type: "electricity_issue",
    title: "Power Grid Load Warning — Zone A",
    description:
      "DISCOM reports Zone A grid operating at 94% capacity. Rolling blackouts likely if temperature exceeds forecast. Cooling centers would lose power.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    location: {
      address: "Zone A Grid Station",
      lat: 28.615,
      lng: 77.211,
      zone: "Zone A",
    },
    source: "facility_status",
    severity: 7,
    affectedPopulation: 22000,
  },
  {
    id: "hw-005",
    type: "noise_complaint",
    title: "Construction Noise — Sector 15",
    description:
      "Residents complaint about construction work starting before 6 AM in Sector 15 residential block. Noise exceeding permissible limits.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    location: {
      address: "Sector 15, Block B",
      lat: 28.617,
      lng: 77.213,
      zone: "Zone B",
    },
    source: "citizen_app",
    severity: 3,
    affectedPopulation: 200,
  },
  {
    id: "hw-006",
    type: "waste_pileup",
    title: "Garbage Dump Overflow — Near Water Tank",
    description:
      "Open garbage dump near Sector 12 water storage tank overflowing. Risk of water contamination during heatwave when residents increase water consumption from emergency tankers.",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    location: {
      address: "Sector 12, Near Emergency Water Tank",
      lat: 28.6125,
      lng: 77.2075,
      zone: "Zone A",
    },
    source: "manual_report",
    severity: 7,
    affectedPopulation: 3500,
  },
  {
    id: "hw-007",
    type: "safety_complaint",
    title: "Road Surface Melting Report",
    description:
      "Bitumen road in Sector 13 showing signs of softening. Vehicles reporting tire damage. Pedestrian safety risk near school zone.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    location: {
      address: "Sector 13, Main Road near School Gate",
      lat: 28.614,
      lng: 77.208,
      zone: "Zone A",
    },
    source: "citizen_app",
    severity: 5,
    affectedPopulation: 1500,
  },
];

export const floodTrafficSignals: IncidentSignal[] = [
  {
    id: "fl-001",
    type: "road_flooding",
    title: "Major Road Flooding — Underpass B3",
    description:
      "Underpass B3 completely submerged after 4 hours of continuous heavy rainfall. Water depth estimated at 1.2m. 2 vehicles stranded. Fire department alerted but pending.",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    location: {
      address: "Underpass B3, Ring Road Junction",
      lat: 28.62,
      lng: 77.215,
      zone: "Zone C",
    },
    source: "manual_report",
    severity: 9,
    affectedPopulation: 0,
  },
  {
    id: "fl-002",
    type: "traffic_disruption",
    title: "Gridlock — NH-48 Service Lane Blocked",
    description:
      "Flooding on NH-48 service lane forces all traffic onto main carriageway. 4km queue reported. Ambulance routes from Sector 8 hospital compromised.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    location: {
      address: "NH-48 Service Lane, Km 23",
      lat: 28.618,
      lng: 77.22,
      zone: "Zone C",
    },
    source: "traffic_api",
    severity: 8,
    affectedPopulation: 4500,
  },
  {
    id: "fl-003",
    type: "water_outage",
    title: "Water Contamination Alert — Zone C Borewells",
    description:
      "Floodwater has breached 3 community borewells in Zone C. Water quality testing pending. Residents advised not to consume tap water. Estimated 2,000 households affected.",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    location: {
      address: "Zone C Community Borewells",
      lat: 28.619,
      lng: 77.216,
      zone: "Zone C",
    },
    source: "facility_status",
    severity: 10,
    affectedPopulation: 6000,
  },
  {
    id: "fl-004",
    type: "building_damage",
    title: "Wall Collapse Risk — Old Building Block 7",
    description:
      "Structural engineer report: old residential building Block 7 showing cracks widening due to water seepage. 14 families need evacuation assessment. Rain continues.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    location: {
      address: "Block 7, Old Township Area",
      lat: 28.621,
      lng: 77.214,
      zone: "Zone C",
    },
    source: "manual_report",
    severity: 10,
    affectedPopulation: 56,
  },
  {
    id: "fl-005",
    type: "waste_pileup",
    title: "Debris Accumulation — Bridge Road",
    description:
      "Storm debris blocking storm drains near Bridge Road, worsening local flooding. Sanitation team notified but unable to reach due to road flooding.",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    location: {
      address: "Bridge Road, Drain Outfall",
      lat: 28.6195,
      lng: 77.218,
      zone: "Zone C",
    },
    source: "citizen_app",
    severity: 6,
    affectedPopulation: 800,
  },
  {
    id: "fl-006",
    type: "electricity_issue",
    title: "Electrical Short Circuit Risk — Submerged Transformer",
    description:
      "Distribution transformer near Sector 11 community hall partially submerged. Risk of electrocution if power not cut. 300 homes in blackout.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    location: {
      address: "Sector 11 Community Hall Compound",
      lat: 28.6175,
      lng: 77.219,
      zone: "Zone C",
    },
    source: "facility_status",
    severity: 10,
    affectedPopulation: 1200,
  },
  {
    id: "fl-007",
    type: "noise_complaint",
    title: "Generator Noise — Relief Camp",
    description:
      "Emergency relief camp generators running loud through the night. Residents in adjacent apartments unable to sleep. Camp houses 200 displaced families.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: {
      address: "Community Center, Sector 9",
      lat: 28.616,
      lng: 77.212,
      zone: "Zone B",
    },
    source: "citizen_app",
    severity: 2,
    affectedPopulation: 150,
  },
];

export const clinicSupplySignals: IncidentSignal[] = [
  {
    id: "cl-001",
    type: "clinic_shortage",
    title: "Diabetes Medication Stock-Out — Urban PHC",
    description:
      "Urban Primary Health Center reports complete stock-out of Metformin 500mg and insulin vials. 340 registered diabetic patients. Next supply delivery scheduled in 72 hours. 12 patients need immediate refill.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    location: {
      address: "Urban PHC, Sector 5 Main Road",
      lat: 28.61,
      lng: 77.206,
      zone: "Zone B",
    },
    source: "inventory_feed",
    severity: 8,
    affectedPopulation: 340,
  },
  {
    id: "cl-002",
    type: "heatwave_alert",
    title: "Heat Index Advisory — All Zones",
    description:
      "Apparent temperature index exceeds 48°C across all zones. Outdoor workers, construction laborers, and street vendors most exposed. WHO threshold for outdoor work suspension triggered.",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    location: {
      address: "All Zones",
      lat: 28.614,
      lng: 77.21,
      zone: "All",
    },
    source: "weather_api",
    severity: 8,
    affectedPopulation: 35000,
  },
  {
    id: "cl-003",
    type: "safety_complaint",
    title: "Maternity Ward Overcrowding — District Hospital",
    description:
      "District Hospital maternity ward at 140% capacity. 6 deliveries expected tonight. Only 2 functioning delivery beds. Staff shortage of 3 nurses on night shift.",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    location: {
      address: "District Hospital, Ward Block C",
      lat: 28.608,
      lng: 77.204,
      zone: "Zone B",
    },
    source: "manual_report",
    severity: 9,
    affectedPopulation: 60,
  },
  {
    id: "cl-004",
    type: "water_outage",
    title: "Hospital Water Supply Interrupted",
    description:
      "District Hospital main water line cracked. Water being supplied via tanker but pressure insufficient for 3rd floor operating theaters. Repair team ETA 4 hours.",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    location: {
      address: "District Hospital, Service Basement",
      lat: 28.6082,
      lng: 77.2042,
      zone: "Zone B",
    },
    source: "facility_status",
    severity: 9,
    affectedPopulation: 500,
  },
  {
    id: "cl-005",
    type: "waste_pileup",
    title: "Biomedical Waste Overflow — Hospital Compound",
    description:
      "Biomedical waste collection bins at District Hospital are full. 48 hours since last pickup. Risk of infection spread. NCDC guidelines require daily collection for high-volume facilities.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: {
      address: "District Hospital, Waste Bay",
      lat: 28.6085,
      lng: 77.2045,
      zone: "Zone B",
    },
    source: "facility_status",
    severity: 7,
    affectedPopulation: 500,
  },
  {
    id: "cl-006",
    type: "electricity_issue",
    title: "Backup Generator Fuel Low — PHC Sector 5",
    description:
      "PHC Sector 5 backup generator fuel at 15%. 3-hour supply remaining. If power cuts occur, blood bank refrigeration and oxygen concentrators will fail.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    location: {
      address: "PHC Sector 5, Generator Room",
      lat: 28.6105,
      lng: 77.2065,
      zone: "Zone B",
    },
    source: "facility_status",
    severity: 9,
    affectedPopulation: 340,
  },
  {
    id: "cl-007",
    type: "other",
    title: "Cosmetic Issue — Park Fountain Decoration",
    description:
      "Decorative fountain in Central Park needs new LED lights for upcoming community festival. Budget allocation pending from ward office. Purely aesthetic issue.",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    location: {
      address: "Central Park, Main Entrance",
      lat: 28.616,
      lng: 77.21,
      zone: "Zone A",
    },
    source: "citizen_app",
    severity: 1,
    affectedPopulation: 0,
  },
];

// ─── Duplicate cluster example ───────────────────────────────────────
export const duplicateSignals: IncidentSignal[] = [
  {
    id: "dup-001",
    type: "waste_pileup",
    title: "Garbage Not Collected — Sector 12 Block C",
    description:
      "Garbage has not been collected for 3 days in Block C Sector 12. Pile growing. Smell spreading to adjacent blocks.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    location: {
      address: "Sector 12, Block C",
      lat: 28.6121,
      lng: 77.2071,
      zone: "Zone A",
    },
    source: "citizen_app",
    severity: 5,
    affectedPopulation: 400,
  },
  {
    id: "dup-002",
    type: "waste_pileup",
    title: "Waste Dump Overflow Block C",
    description:
      "Multiple residents reporting garbage dump overflowing in Block C. Flies and stray animals around. Health hazard growing.",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    location: {
      address: "Sector 12 Block C, Main Dump Point",
      lat: 28.6122,
      lng: 77.2072,
      zone: "Zone A",
    },
    source: "complaint_log",
    severity: 5,
    affectedPopulation: 400,
  },
  {
    id: "dup-003",
    type: "waste_pileup",
    title: "Sanitation Issue Sector 12",
    description:
      "Block C sector 12 garbage collection stopped. Rats visible. Urgent action needed before monsoon.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    location: {
      address: "Sector 12 C Block",
      lat: 28.6123,
      lng: 77.2073,
      zone: "Zone A",
    },
    source: "manual_report",
    severity: 5,
    affectedPopulation: 400,
  },
];

// ─── Scenarios ───────────────────────────────────────────────────────
export const demoScenarios: DemoScenario[] = [
  {
    id: "heatwave-water",
    name: "Heatwave + Water Shortage",
    description:
      "Extreme heatwave combined with water supply failure and clinic shortages. Compounding crisis across Zone A.",
    icon: "Thermometer",
    signals: [...heatwaveWaterSignals],
  },
  {
    id: "flood-traffic",
    name: "Local Flooding + Traffic Disruption",
    description:
      "Heavy rainfall causes flooding, building damage risks, and major traffic gridlock affecting emergency routes.",
    icon: "CloudRain",
    signals: [...floodTrafficSignals],
  },
  {
    id: "clinic-supply",
    name: "Clinic Supply Shortage + Surge",
    description:
      "Critical medical supply shortages combined with hospital overcrowding and heat-related patient surge.",
    icon: "Stethoscope",
    signals: [...clinicSupplySignals],
  },
];

export function getAllSignals(): IncidentSignal[] {
  return [...heatwaveWaterSignals, ...floodTrafficSignals, ...clinicSupplySignals, ...duplicateSignals];
}

export function getSignalsByScenario(scenarioId: string): IncidentSignal[] {
  const scenario = demoScenarios.find((s) => s.id === scenarioId);
  return scenario ? [...scenario.signals] : [];
}
