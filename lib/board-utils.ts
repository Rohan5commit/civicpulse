import type { NormalizedIncident, PriorityScore, EnrichedContext } from "@/lib/schemas";

export interface BoardIncident {
  incident: NormalizedIncident;
  score: PriorityScore;
  enrichment?: EnrichedContext;
}

export function getSeverityColor(severity: number): string {
  if (severity >= 9) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (severity >= 7) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (severity >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (severity >= 3) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function getUrgencyColor(urgency: number): string {
  if (urgency >= 9) return "bg-red-600/20 text-red-300 border-red-600/30";
  if (urgency >= 7) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (urgency >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 30) return "text-yellow-400";
  return "text-green-400";
}

export function getRankBadge(rank: number): string {
  if (rank === 1) return "bg-red-500 text-white";
  if (rank === 2) return "bg-orange-500 text-white";
  if (rank === 3) return "bg-yellow-500 text-black";
  return "bg-slate-600 text-white";
}

export function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    water_outage: "💧",
    road_flooding: "🌊",
    waste_pileup: "🗑️",
    clinic_shortage: "🏥",
    heatwave_alert: "🌡️",
    electricity_issue: "⚡",
    safety_complaint: "⚠️",
    traffic_disruption: "🚦",
    noise_complaint: "🔊",
    building_damage: "🏗️",
    other: "📋",
  };
  return icons[type] || "📋";
}

export function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatPopulation(pop: number): string {
  if (pop === 0) return "N/A";
  if (pop >= 1000) return `${(pop / 1000).toFixed(1)}K`;
  return String(pop);
}
