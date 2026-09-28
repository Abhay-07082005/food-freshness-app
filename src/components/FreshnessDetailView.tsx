import React, { useState } from "react";
import { 
  Heart, 
  Calendar, 
  Leaf, 
  AlertTriangle, 
  Lightbulb, 
  Search, 
  ShieldAlert, 
  Bell, 
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Fingerprint,
  Sparkles,
  ShieldCheck,
  Activity
} from "lucide-react";
import { motion } from "motion/react";
import { AnalysisResult, ScannedProduce } from "../types";

interface FreshnessDetailViewProps {
  produce: ScannedProduce;
  onSetReminder: (daysBefore: number) => void;
  onUpdateFirmness?: (firmness: "firm" | "soft" | "mushy") => void;
  onDismiss: () => void;
}

export default function FreshnessDetailView({ 
  produce, 
  onSetReminder, 
  onUpdateFirmness, 
  onDismiss 
}: FreshnessDetailViewProps) {
  const [selectedReminderDays, setSelectedReminderDays] = useState(1);
  const [reminderConfigured, setReminderConfigured] = useState(produce.reminderScheduled);
  const { analysis } = produce;

  const handleReminderSetup = () => {
    onSetReminder(selectedReminderDays);
    setReminderConfigured(true);
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (percent >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const getStatusBadge = (percent: number, status: string) => {
    if (percent >= 70) return {
      text: status,
      bg: "bg-emerald-100 text-emerald-800",
      icon: <CheckCircle2 size={14} className="text-emerald-600" />
    };
    if (percent >= 40) return {
      text: status,
      bg: "bg-amber-100 text-amber-800",
      icon: <AlertTriangle size={14} className="text-amber-600" />
    };
    return {
      text: status,
      bg: "bg-rose-100 text-rose-800",
      icon: <XCircle size={14} className="text-rose-600" />
    };
  };

  // Dynamic squeeze-test recalculation variables
  const userFirmness = produce.userFirmnessReport || "firm";
  let adjustedFreshnessPercentage = analysis.freshnessPercentage;
  let adjustedShelfLifeEstimateDays = analysis.shelfLifeEstimateDays;
  let adjustedShelfLifeRange = analysis.shelfLifeRange;
  let adjustedIsFresh = analysis.isFresh;
  let firmnessModifierMessage = "";

  if (userFirmness === "soft") {
    adjustedFreshnessPercentage = Math.max(0, analysis.freshnessPercentage - 15);
    adjustedShelfLifeEstimateDays = Math.max(0, Math.min(adjustedShelfLifeEstimateDays, 2));
    adjustedShelfLifeRange = "Soft texture - use within 1-2 days";
    firmnessModifierMessage = "Slight softness reported by manual squeeze test. Freshness percentage dynamically calibrated down (-15%).";
  } else if (userFirmness === "mushy") {
    adjustedFreshnessPercentage = Math.max(0, analysis.freshnessPercentage - 35);
    adjustedShelfLifeEstimateDays = 0;
    adjustedShelfLifeRange = "Mushy consistency - consume or bake immediately today!";
    adjustedIsFresh = false;
    firmnessModifierMessage = "Extreme soft mushy spot reported. Critical decay override triggered: 0 days remaining.";
  }

  // Derive status badge from adjusted score
  const dynamicStatusName = userFirmness === "firm" 
    ? analysis.freshnessStatus 
    : (userFirmness === "soft" ? "Soft / Bruised" : "Mushy / Overripe");

  const statusBadge = getStatusBadge(adjustedFreshnessPercentage, dynamicStatusName);

  return (
    <div id={`freshness-detail-${produce.id}`} className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
      {/* Top Banner Accent */}
      <div className={`h-2.5 w-full ${adjustedIsFresh ? 'bg-linear-to-r from-emerald-400 to-teal-500' : 'bg-linear-to-r from-amber-400 to-rose-500'}`} />

      {/* Hero Header Split */}
      <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Produce Visual image representation */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-white flex items-center justify-center">
              {produce.itemImage ? (
                <img 
                  src={produce.itemImage} 
                  alt={analysis.itemName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-300 flex flex-col items-center">
                  <Leaf size={48} className="animate-pulse" />
                  <span className="text-xs text-gray-400 mt-2">No image recorded</span>
                </div>
              )}
              
              {/* Quality Bubble Floating */}
              <div className="absolute top-4 right-4 flex flex-col items-end">
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm text-white ${adjustedIsFresh ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {adjustedIsFresh ? "Fresh / Edible" : "Spoiled / Past Limit"}
                </span>
                <span className="text-[10px] text-gray-500 bg-white/95 backdrop-blur px-2 py-0.5 rounded mt-1 shadow-xs border border-gray-100">
                  {new Date(produce.dateScanned).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Assessment Metadata */}
          <div className="flex-1 w-full flex flex-col justify-between self-stretch">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900 tracking-tight">
                  {analysis.itemName}
                </h1>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  <span>{statusBadge.text}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-5">
                {/* Freshness level */}
                <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Calibrated Freshness</span>
                    <span className="font-display font-semibold text-xl text-gray-800">{adjustedFreshnessPercentage}%</span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${getPercentageColor(adjustedFreshnessPercentage)}`}>
                    {adjustedFreshnessPercentage}
                  </div>
                </div>

                {/* Estimate Limit */}
                <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Remaining Life</span>
                    <span className="font-display font-semibold text-xl text-red-600">
                      {adjustedShelfLifeEstimateDays === 0 ? "0 Days" : `${adjustedShelfLifeEstimateDays} Days`}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold text-xs">
                    <Calendar size={18} />
                  </div>
                </div>

                {/* Friendly Expiration Text */}
                <div className="p-3 bg-white rounded-xl border border-gray-150 flex items-center justify-between shadow-xs sm:col-span-2 md:col-span-1">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Advisory Window</span>
                    <span className="font-display font-semibold text-xs text-gray-700 block mt-0.5">{adjustedShelfLifeRange}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                    <Clock size={18} />
                  </div>
                </div>
              </div>

              {firmnessModifierMessage && (
                <div className="mb-5 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-950 font-medium flex items-center gap-1.5 shadow-xs">
                  <Activity size={14} className="text-indigo-600 shrink-0" />
                  <span>{firmnessModifierMessage}</span>
                </div>
              )}

              {/* Push expiration reminder helper block */}
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
                    <Bell size={18} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-sm text-indigo-950">Active Expirations & Reminders</h4>
                    <p className="text-xs text-indigo-900 leading-relaxed mt-0.5 max-w-md">
                      {reminderConfigured 
                        ? `Reminder configured to alert you ${produce.reminderDaysBefore} day(s) before estimated decay (${new Date(produce.expirationDate).toLocaleDateString()}).`
                        : `Never forget! Receive a notification before this ${analysis.itemName} decays so you can cook, freeze, or enjoy it.`}
                    </p>
                  </div>
                </div>

                {!reminderConfigured ? (
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                      <select
                        id="reminder-days-dropdown"
                        aria-label="Reminder warning buffer days"
                        className="bg-transparent text-xs text-gray-700 focus:outline-none px-1.5 py-1 cursor-pointer font-medium"
                        value={selectedReminderDays}
                        onChange={(e) => setSelectedReminderDays(Number(e.target.value))}
                        disabled={adjustedShelfLifeEstimateDays <= 0}
                      >
                        <option value={0}>Same day</option>
                        {adjustedShelfLifeEstimateDays >= 1 && <option value={1}>1 day before</option>}
                        {adjustedShelfLifeEstimateDays >= 2 && <option value={2}>2 days before</option>}
                        {adjustedShelfLifeEstimateDays >= 3 && <option value={3}>3 days before</option>}
                        {adjustedShelfLifeEstimateDays >= 5 && <option value={5}>5 days before</option>}
                      </select>
                    </div>
                    <button
                      id="schedule-reminder-btn"
                      type="button"
                      className="whitespace-nowrap px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      disabled={adjustedShelfLifeEstimateDays <= 0}
                      onClick={handleReminderSetup}
                    >
                      Enable Push
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold self-start md:self-auto border border-emerald-200">
                    <CheckCircle2 size={13} /> Active Alarm
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Squeeze-Test override selector */}
      <div className="px-6 md:px-8 pt-6">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 shrink-0">
              <Fingerprint size={18} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-xs text-gray-950">Physical Squeeze-Test Self-Report</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                Is there an unphotographed soft spot? Select firmness below to adjust preservation estimates:
              </p>
            </div>
          </div>

          <div className="flex bg-gray-200/60 p-1 rounded-xl w-full md:w-auto">
            {(["firm", "soft", "mushy"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition uppercase tracking-wider text-[10px] ${
                  userFirmness === mode
                    ? mode === "firm" ? "bg-emerald-600 text-white shadow-sm" :
                      mode === "soft" ? "bg-amber-500 text-white shadow-sm" :
                      "bg-rose-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => onUpdateFirmness?.(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Analysis cards */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Surface wax / coating detection card */}
        <div className="rounded-2xl border border-gray-100 p-5 bg-stone-50/20 flex flex-col justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display font-semibold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">
              <span className="p-1 px-1.5 rounded-lg bg-teal-50 text-teal-600 font-bold block">
                <Sparkles size={16} />
              </span>
              Surface Authenticity Check
            </h3>
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Artificial Coating Probability</span>
                <span className={`font-display font-extrabold text-2xl ${analysis.artificialCoatingProbability >= 60 ? 'text-amber-600' : 'text-teal-600'}`}>
                  {analysis.artificialCoatingProbability}%
                </span>
              </div>
              <div className="flex-1 max-w-30 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${analysis.artificialCoatingProbability >= 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                  style={{ width: `${analysis.artificialCoatingProbability}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-650 leading-relaxed mb-4 font-medium">
              {analysis.artificialCoatingWarning || "No artificial coatings identified."}
            </p>

            {analysis.externalWaxCues && analysis.externalWaxCues.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Surface Wax Indicators</span>
                <ul className="space-y-1">
                  {analysis.externalWaxCues.map((cue, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-teal-500 font-bold">•</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysis.artificialCoatingProbability >= 50 && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/70 text-[11px] text-amber-900 leading-normal">
              <span className="font-bold block mb-1">🧼 Preservation Wax Washing Advisory:</span>
              To dissolve food-grade carnauba or shellac wax films, rinse thoroughly in lukewarm water mixed with 1 tablespoon of baking soda and a squeeze of fresh lemon juice or white vinegar. Gently brush skin.
            </div>
          )}
        </div>

        {/* Invisible Internal Rot Risk & Technology Limitations */}
        <div className="rounded-2xl border border-gray-100 p-5 bg-stone-50/20 flex flex-col justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display font-semibold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">
              <span className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600 font-bold block">
                <ShieldAlert size={16} />
              </span>
              Internal Rot Proxy Analysis
            </h3>
            <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Deep Core Rot Risk</span>
                <span className="text-xs text-gray-700 font-medium block mt-0.5">Based on micro-surface stem indicators</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                analysis.detectedInternalRotRisk === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                analysis.detectedInternalRotRisk === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {analysis.detectedInternalRotRisk || 'low'} Risk
              </span>
            </div>
            <p className="text-xs text-gray-650 leading-relaxed mb-4">
              {analysis.internalRotWarningExplanation || "No potential hidden decay proxies identified on the skin surface."}
            </p>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
            <span className="text-[10px] text-indigo-900 font-extrabold uppercase tracking-wider block mb-1">🔬 Optical Limits & Roadmap:</span>
            <p className="text-[11px] text-indigo-950 leading-relaxed">
              Standard optical cameras are physically blocked by dense outer skins. Future iterations plan to integrate <b>Near-Infrared (NIR) Spectroscopy</b> to perform non-destructive density scans. For now, rely on our interactive <b>Squeeze-Test override panel</b> above to calibrate metrics.
            </p>
          </div>
        </div>

        {/* Preserving / Storage Recommendation */}
        <div className="rounded-2xl border border-gray-100 p-5 bg-stone-50/20">
          <h3 className="flex items-center gap-2 font-display font-semibold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold block">
              <Leaf size={16} />
            </span>
            Conservation Strategies
          </h3>
          <p className="text-gray-650 text-sm leading-relaxed antialiased">
            {analysis.storageRecommendation}
          </p>

          <div className="mt-4 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/40">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Ideal Location Environment</span>
            <span className="text-xs text-emerald-950 font-medium block mt-1 leading-snug">{analysis.idealEnvironment}</span>
          </div>
        </div>

        {/* Visual Inspection Markers & Defects */}
        <div className="rounded-2xl border border-gray-100 p-5 bg-stone-50/20">
          <h3 className="flex items-center gap-2 font-display font-semibold text-gray-900 text-base mb-3 pb-2 border-b border-gray-100">
            <span className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold block">
              <Search size={16} />
            </span>
            Horticultural Observations
          </h3>
          
          <ul className="space-y-2 mb-4">
            {analysis.visualObservations.map((obs, i) => (
              <li key={i} className="text-xs text-gray-650 flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>

          {/* Spoiling / Warning flags */}
          <div className="rounded-xl bg-orange-50/50 p-3.5 border border-orange-100">
            <span className="text-[10px] text-orange-850 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={12} /> Expiration & Decaying Warnings
            </span>
            <ul className="mt-2 space-y-1">
              {analysis.spoilageSignals.map((sig, i) => (
                <li key={i} className="text-xs text-orange-950 flex items-start gap-1">
                  <span className="font-bold text-orange-600 shrink-0 select-none">-</span>
                  <span>{sig}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recipe Suggestion & Culinary Strategy */}
        <div className="md:col-span-2 rounded-2xl border border-indigo-100 p-5 bg-indigo-50/20">
          <h3 className="flex items-center gap-2 font-display font-semibold text-indigo-950 text-base mb-3 pb-2 border-b border-indigo-150">
            <span className="p-1 px-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold block">
              <Flame size={16} />
            </span>
            Empathetic Culinary Preparation Advice
          </h3>
          <p className="text-indigo-900 text-sm leading-relaxed antialiased font-medium">
            {analysis.culinaryAdvice}
          </p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer font-medium flex items-center gap-1"
          onClick={onDismiss}
        >
          ← Return to produce catalog
        </button>
        <span className="text-[10px] text-gray-400 font-mono">Produce Unique Identifier: {produce.id}</span>
      </div>
    </div>
  );
}
