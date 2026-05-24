import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Leaf, 
  Bell, 
  Trash2, 
  PlusCircle, 
  AlertCircle,
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  CloudAlert,
  FolderSync,
  X,
  FastForward,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScannedProduce, AnalysisResult, ExpiryReminder } from "./types";
import CameraUploader from "./components/CameraUploader";
import FreshnessDetailView from "./components/FreshnessDetailView";

// Initial items to seed the application with realistic data for immediate play
const SEED_PRODUCE: ScannedProduce[] = [
  {
    id: "prod-921",
    dateScanned: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
    itemImage: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&q=80&w=400",
    reminderScheduled: true,
    reminderDaysBefore: 1,
    expirationDate: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(), // 5 days remaining from now
    analysis: {
      itemName: "Gala Apple",
      isFresh: true,
      freshnessStatus: "Fresh",
      freshnessPercentage: 92,
      shelfLifeEstimateDays: 6,
      shelfLifeRange: "4-7 days remaining",
      visualObservations: [
        "Skin holds a polished light waxy layer with excellent red-yellow pigmentation",
        "Absolutely no soft water cores or physical bruising detected near the crown",
        "Extremely firm cell walls; high level of turgor pressure intact"
      ],
      storageRecommendation: "Store apple dry in the designated refrigerator crisper drawer. Keep isolated from moisture to avoid surface mold cultivation on wood/cardboard substrates.",
      idealEnvironment: "Cold crisper environment (1-4°C) with low humidity levels.",
      spoilageSignals: [
        "Skin becomes dull and develops spongy mushy margins",
        "Slight fermenting vinegary smell near the core stem",
        "Wrinkled skin texture indicating severe internal moisture depletion"
      ],
      culinaryAdvice: "Perfect for refreshing raw snacking, dicing raw into organic green salads, or pairing with walnut butter."
    }
  },
  {
    id: "prod-104",
    dateScanned: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(), // 3 days ago
    itemImage: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400",
    reminderScheduled: true,
    reminderDaysBefore: 1,
    expirationDate: new Date(Date.now() + 3600 * 1000 * 24 * 1).toISOString(), // 1 day remaining from now
    analysis: {
      itemName: "Cavendish Banana",
      isFresh: true,
      freshnessStatus: "Overripe",
      freshnessPercentage: 54,
      shelfLifeEstimateDays: 1,
      shelfLifeRange: "Use within 24-36 hours",
      visualObservations: [
        "High degree of epidermal browning with starch converting rapidly to simple sugars",
        "Neck stem is soft, yielding slightly to minor compression",
        "Peel is intact but thinner and highly pliable"
      ],
      storageRecommendation: "Do not store with sealed plastic bags. Peel completely, portion into segments, and freeze in a silicone container to extend baking life indefinitely.",
      idealEnvironment: "Separated hanger at moderate humidity, or in freezer bins.",
      spoilageSignals: [
        "Liquid seepage leaking from the crown or bottom tip",
        "Pungent sweet fruit-fly-inducing yeast odor",
        "Black liquid spots under the peel indicate progressive internal fungal rot"
      ],
      culinaryAdvice: "Highly recommended for banana pancakes, breakfast oat muffins, or frozen smoothie bases immediately."
    }
  }
];

export default function App() {
  const [items, setItems] = useState<ScannedProduce[]>(() => {
    const saved = localStorage.getItem("produce_inventory");
    return saved ? JSON.parse(saved) : SEED_PRODUCE;
  });

  const [notifications, setNotifications] = useState<ExpiryReminder[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "scan">("catalog");
  const [selectedProduce, setSelectedProduce] = useState<ScannedProduce | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "fresh" | "critical">("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Simulated day multiplier to demonstrate expiry notifications in testing
  const [simulatedDayShift, setSimulatedDayShift] = useState(0);

  // Synchronize with local storage
  useEffect(() => {
    localStorage.setItem("produce_inventory", JSON.stringify(items));
    checkForApproachingExpirations();
  }, [items, simulatedDayShift]);

  // Request browser notification permission on initialization
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const triggerNativeNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "/favicon.ico"
      });
    }
  };

  const checkForApproachingExpirations = () => {
    const freshReminders: ExpiryReminder[] = [];
    const now = Date.now() + (simulatedDayShift * 1000 * 3600 * 24);

    items.forEach((item) => {
      if (!item.reminderScheduled) return;

      const expDate = new Date(item.expirationDate).getTime();
      const differenceDays = Math.ceil((expDate - now) / (1000 * 3600 * 24));

      // If simulated or actual expiration is less than or equals the configured offset
      if (differenceDays <= item.reminderDaysBefore && differenceDays >= -1) {
        const reminderId = `rem-${item.id}-${differenceDays}`;
        
        let message = "";
        let isExpired = differenceDays < 0;

        if (isExpired) {
          message = `⚠️ Warning: Your ${item.analysis.itemName} was estimated to spoil today! Inspect immediately.`;
        } else if (differenceDays === 0) {
          message = `⏳ Expiration Day: Your ${item.analysis.itemName} is at its critical day. Consume immediately!`;
        } else {
          message = `⏰ Reminder: Your ${item.analysis.itemName} is estimated to expire in ${differenceDays} day(s). Organize your kitchen!`;
        }

        // Only add if not already registered in state to avoid dual triggers
        if (!notifications.some(n => n.id === reminderId)) {
          const freshAlert: ExpiryReminder = {
            id: reminderId,
            produceId: item.id,
            produceName: item.analysis.itemName,
            scheduledTime: new Date(now).toISOString(),
            status: "pending",
            message: message
          };
          freshReminders.push(freshAlert);
          triggerNativeNotification("Freshness Expiry Warning", message);
        }
      }
    });

    if (freshReminders.length > 0) {
      setNotifications(prev => [...prev, ...freshReminders]);
    }
  };

  const handleSetReminder = (produceId: string, daysBefore: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === produceId) {
        return {
          ...item,
          reminderScheduled: true,
          reminderDaysBefore: daysBefore
        };
      }
      return item;
    }));
  };

  const handleImageCaptured = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-freshness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: base64, mimeType })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed server freshness analysis calculation.");
      }

      const analysis: AnalysisResult = await response.json();
      
      const newProduce: ScannedProduce = {
        id: `prod-${Math.floor(Math.random() * 900000 + 100000)}`,
        dateScanned: new Date().toISOString(),
        itemImage: base64,
        reminderScheduled: true, // Default to true so user immediately benefits
        reminderDaysBefore: 1,  // Default trigger buffer
        expirationDate: new Date(Date.now() + 3600 * 1000 * 24 * analysis.shelfLifeEstimateDays).toISOString(),
        analysis: analysis
      };

      setItems(prev => [newProduce, ...prev]);
      setSelectedProduce(newProduce);
      setActiveTab("catalog");
    } catch (err: any) {
      console.error(err);
      alert(`AI Freshness Analysis Failed:\n${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteProduce = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this item from your inventory?")) {
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedProduce?.id === id) {
        setSelectedProduce(null);
      }
    }
  };

  const advanceSimulatedTime = () => {
    setSimulatedDayShift(prev => prev + 1);
  };

  const resetSimulatedTime = () => {
    setSimulatedDayShift(0);
    setNotifications([]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Math metrics calculator
  const totalInInventory = items.length;
  const freshCount = items.filter(i => i.analysis.isFresh && i.analysis.freshnessPercentage >= 70).length;
  const criticalCount = items.filter(i => {
    const exp = new Date(i.expirationDate).getTime();
    const now = Date.now() + (simulatedDayShift * 1000 * 3600 * 24);
    const diff = Math.ceil((exp - now) / (1000 * 365 * 24)); // or simplistic checking
    return i.analysis.freshnessPercentage < 70 && i.analysis.shelfLifeEstimateDays <= 2;
  }).length;

  const filteredItems = items.filter(item => {
    // Search filter
    const titleMatch = item.analysis.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch) return false;

    // Freshness state selection
    const exp = new Date(item.expirationDate).getTime();
    const now = Date.now() + (simulatedDayShift * 1000 * 3600 * 24);
    const dayDiff = Math.ceil((exp - now) / (1000 * 3600 * 24));

    if (filterType === "fresh") {
      return item.analysis.isFresh && dayDiff > 2;
    }
    if (filterType === "critical") {
      return dayDiff <= 2;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col antialiased font-sans pb-16">
      
      {/* Top Main Navigation Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-emerald-600 shadow-md flex items-center justify-center text-white">
              <Leaf size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-gray-900 tracking-tight leading-none block">
                FreshScan
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mt-0.5">
                AI Optical Guard & Shelf Life Engine
              </span>
            </div>
          </div>

          {/* Time simulation triggers */}
          <div className="flex items-center gap-3">
            {simulatedDayShift > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 rounded-lg text-amber-700 text-xs font-semibold animate-pulse border border-amber-100 flex items-center gap-1">
                📅 Simulated Day +{simulatedDayShift}
              </span>
            )}

            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 rounded-lg font-medium cursor-pointer"
                onClick={advanceSimulatedTime}
                title="Simulate the passage of 1 day to test expiration warnings"
              >
                <FastForward size={14} /> Fast-Forward Day
              </button>
              {simulatedDayShift > 0 && (
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg cursor-pointer"
                  onClick={resetSimulatedTime}
                  title="Reset simulation parameters"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        
        {/* Banner Alert Center */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="text-xs uppercase font-extrabold text-orange-700 flex items-center gap-1.5">
                  <Bell size={13} className="animate-swing" /> Expiring Produce Reminders ({notifications.length})
                </span>
                <button 
                  type="button"
                  className="text-[10px] text-gray-400 hover:text-red-650 cursor-pointer"
                  onClick={() => setNotifications([])}
                >
                  Clear all alerts
                </button>
              </div>

              {notifications.map((alert) => (
                <div 
                  key={alert.id} 
                  className="bg-amber-50 border border-amber-100 rounded-xl py-3 px-4 flex items-center justify-between shadow-xs gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <CloudAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-950 font-medium">{alert.message}</span>
                  </div>
                  <button 
                    type="button"
                    className="p-1 rounded-md text-amber-400 hover:text-amber-800 transition cursor-pointer"
                    onClick={() => dismissNotification(alert.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-450 uppercase font-bold block">Consumables Monitored</span>
              <span className="font-display font-extrabold text-3xl text-gray-900 block">{totalInInventory}</span>
              <span className="text-xs text-gray-500 block">Active household items in drawer</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderSync size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-450 uppercase font-bold block">Fresh Ratio</span>
              <span className="font-display font-extrabold text-3xl text-emerald-600 block">
                {totalInInventory > 0 ? `${Math.round((freshCount / totalInInventory) * 100)}%` : "0%"}
              </span>
              <span className="text-xs text-gray-500 block">Meeting excellent standard marks</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-gray-450 uppercase font-bold block">Expired / Critical Alert</span>
              <span className="font-display font-extrabold text-3xl text-rose-500 block">
                {items.filter(i => {
                  const exp = new Date(i.expirationDate).getTime();
                  const simulatedNow = Date.now() + (simulatedDayShift * 1000 * 3600 * 24);
                  return exp <= simulatedNow;
                }).length}
              </span>
              <span className="text-xs text-gray-500 block">Inedible or needs immediate cooking</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
          </div>

        </div>

        {/* Outer view detail section if select state is filled */}
        <AnimatePresence>
          {selectedProduce && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-10"
            >
              <FreshnessDetailView 
                produce={selectedProduce}
                onSetReminder={(days) => handleSetReminder(selectedProduce.id, days)}
                onDismiss={() => setSelectedProduce(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Toggle Tab Workspace */}
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            type="button"
            className={`pb-3 font-display font-bold text-sm tracking-tight cursor-pointer relative transition-all ${
              activeTab === "catalog" ? "text-indigo-600 font-extrabold" : "text-gray-400 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("catalog")}
          >
            Inventory Catalog ({totalInInventory})
            {activeTab === "catalog" && (
              <motion.div layoutId="tab-marker" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          <button
            id="scan-tab-navigation"
            type="button"
            className={`pb-3 font-display font-bold text-sm tracking-tight cursor-pointer relative transition-all flex items-center gap-1.5 ${
              activeTab === "scan" ? "text-indigo-600 font-extrabold" : "text-gray-400 hover:text-gray-900"
            }`}
            onClick={() => {
              setSelectedProduce(null);
              setActiveTab("scan");
            }}
          >
            <Sparkles size={14} className="text-indigo-500" /> Scan New Crop
            {activeTab === "scan" && (
              <motion.div layoutId="tab-marker" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>

        {/* Active view workspace */}
        <div>
          {activeTab === "scan" ? (
            <div className="py-2">
              <CameraUploader 
                onImageCaptured={handleImageCaptured}
                isLoading={isAnalyzing}
              />
            </div>
          ) : (
            /* Catalog Hub list with sorting filters */
            <div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                
                {/* Search string */}
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                    <Leaf size={14} />
                  </span>
                  <input
                    id="search-input"
                    type="text"
                    aria-label="Search produce names"
                    placeholder="Search by crop name (e.g. Apple)"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Hot filter buttons */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      filterType === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setFilterType("all")}
                  >
                    All items
                  </button>
                  <button
                    type="button"
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      filterType === "fresh" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setFilterType("fresh")}
                  >
                    Fresh Store
                  </button>
                  <button
                    type="button"
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      filterType === "critical" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setFilterType("critical")}
                  >
                    Critical Level
                  </button>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                /* Empty state container */
                <div className="w-full text-center py-16 px-4 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                  <div className="p-4 rounded-full bg-emerald-50 text-emerald-505 mb-4 text-emerald-600">
                    <Leaf size={32} />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">No Produce Matches</h3>
                  <p className="text-gray-450 text-xs mt-1.5 max-w-sm leading-relaxed">
                    {searchQuery 
                      ? "Try altering your keywords. Ensure spelling matches common orchard vegetable types."
                      : "Start using FreshScan now! Add your first item by capturing its photo with camera."}
                  </p>
                  
                  <button
                    type="button"
                    className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-2"
                    onClick={() => setActiveTab("scan")}
                  >
                    <Plus size={14} /> Scan First Crop Image
                  </button>
                </div>
              ) : (
                /* Produce Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const shelfDays = item.analysis.shelfLifeEstimateDays;
                    
                    // Expiration relative calculation
                    const expirationTime = new Date(item.expirationDate).getTime();
                    const simulatedNow = Date.now() + (simulatedDayShift * 1000 * 3600 * 24);
                    const diffDays = Math.ceil((expirationTime - simulatedNow) / (1000 * 3600 * 24));
                    const isFullyExpired = diffDays <= 0;

                    return (
                      <div
                        id={`produce-card-${item.id}`}
                        key={item.id}
                        className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-lg flex flex-col justify-between ${
                          selectedProduce?.id === item.id 
                            ? "ring-2 ring-indigo-500 border-transparent shadow-md"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                        onClick={() => setSelectedProduce(item)}
                      >
                        <div>
                          {/* Image frame */}
                          <div className="relative aspect-video w-full bg-gray-50 overflow-hidden">
                            {item.itemImage ? (
                              <img 
                                src={item.itemImage} 
                                alt={item.analysis.itemName} 
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Leaf size={24} />
                              </div>
                            )}

                            {/* Relative badge overlay */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm text-white ${
                                item.analysis.freshnessPercentage >= 75 ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}>
                                {item.analysis.freshnessPercentage}% Freshness
                              </span>
                            </div>

                            {/* Days remaining badge overlay */}
                            <div className="absolute bottom-3 right-3">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1 bg-white/95 backdrop-blur ${
                                isFullyExpired ? 'text-rose-600' : 'text-gray-800'
                              }`}>
                                <Calendar size={11} /> 
                                {isFullyExpired ? "Expired" : `${diffDays} days left`}
                              </span>
                            </div>
                          </div>

                          {/* Detail block */}
                          <div className="p-4 md:p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-display font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition">
                                  {item.analysis.itemName}
                                </h4>
                                <span className="text-[10px] uppercase tracking-wider text-gray-450 font-semibold">
                                  {item.analysis.freshnessStatus}
                                </span>
                              </div>
                              <button
                                type="button"
                                aria-label="Delete scanner entry"
                                className="p-1 px-1.5 rounded-lg border border-transparent hover:border-gray-200 text-gray-300 hover:text-red-630 hover:bg-red-50 cursor-pointer transition shrink-0"
                                onClick={(e) => deleteProduce(item.id, e)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <p className="text-gray-500 text-xs line-clamp-2 mt-2 leading-relaxed">
                              {item.analysis.storageRecommendation}
                            </p>
                          </div>
                        </div>

                        {/* Card bottom tray metrics */}
                        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            {item.reminderScheduled ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                <Bell size={11} /> Alarm Configured
                              </span>
                            ) : (
                              <span className="text-gray-400 flex items-center gap-0.5">
                                <Bell size={11} /> Pin Alarm
                              </span>
                            )}
                          </span>
                          <span>Registered {new Date(item.dateScanned).toLocaleDateString()}</span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
