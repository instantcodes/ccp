import React, { useState, useEffect } from "react";
import { Complaint, DashboardStats, User } from "../types";
import { 
  Filter, Calendar, MapPin, CheckCircle, Clock, AlertCircle, FileText, 
  ChevronRight, X, Layers, Shield, RefreshCw, BarChart2, Edit3, MessageSquare, Loader2
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
  token: string;
}

const CATEGORIES = [
  "Classroom",
  "Laboratory",
  "Hostel",
  "Library",
  "Internet/Wi-Fi",
  "Electrical",
  "Water Supply",
  "Cleanliness",
  "Other"
];

export default function AdminDashboard({ user, token }: AdminDashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    categoryCounts: {}
  });

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Admin action controls
  const [selectedStatus, setSelectedStatus] = useState<"Pending" | "In Progress" | "Resolved">("Pending");
  const [resolutionDetails, setResolutionDetails] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load complaints and stats
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const complaintsRes = await fetch("/api/complaints", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const complaintsData = await complaintsRes.json();
      if (complaintsRes.ok) {
        setComplaints(complaintsData.complaints);
      }

      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData.stats);
      }
    } catch (e) {
      console.error("Failed to load admin stats info:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Hook up state selections on complaint click
  const handleSelectComplaint = (c: Complaint) => {
    setSelectedComplaint(c);
    setSelectedStatus(c.status);
    setResolutionDetails(c.resolutionDetails || "");
    setSubmitError(null);
  };

  // Handle administrator resolution submission
  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitError(null);

    // If resolved, ensure comments logged
    if (selectedStatus === "Resolved" && !resolutionDetails.trim()) {
      setSubmitError("Please fill out complete resolution details/corrective actions logged.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: selectedStatus,
          resolutionDetails: selectedStatus === "Resolved" ? resolutionDetails : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed saving status update.");
      }

      // Refresh data
      await fetchData();
      
      // Update selected reference
      const updated = data.complaint;
      setSelectedComplaint(updated);
      setSelectedStatus(updated.status);
      setResolutionDetails(updated.resolutionDetails || "");
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred updating the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering Logic
  const filteredComplaints = complaints.filter(c => {
    const categoryMatch = filterCategory === "All" || c.category === filterCategory;
    const statusMatch = filterStatus === "All" || c.status === filterStatus;
    return categoryMatch && statusMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.createdDate).getTime();
    const dateB = new Date(b.createdDate).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Helpers for styling status badges
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-100",
          icon: <Clock className="h-4 w-4" />,
          label: "Awaiting Review"
        };
      case "In Progress":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-100",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: "In Mobilization"
        };
      case "Resolved":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Resolved"
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-100",
          icon: <Clock className="h-4 w-4" />,
          label: status
        };
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "Electrical": return "text-amber-500 bg-amber-50";
      case "Water Supply": return "text-cyan-500 bg-cyan-50";
      case "Hostel": return "text-indigo-500 bg-indigo-50";
      case "Library": return "text-purple-500 bg-purple-50";
      case "Internet/Wi-Fi": return "text-blue-500 bg-blue-50";
      case "Classroom": return "text-emerald-500 bg-emerald-50";
      case "Cleanliness": return "text-teal-500 bg-teal-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  // Calculate high categories counts for simple custom graphics
  const maxCategoryCount = Math.max(...CATEGORIES.map(cat => stats.categoryCounts[cat] || 0), 1);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 id="admin-header" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Administrative Command Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Logged in as Admin: <span className="font-semibold text-slate-700">{user.name}</span>. Manage campus infrastructure workflow.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center justify-center p-2.5 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-250 rounded-lg shadow-sm transition-colors cursor-pointer text-xs font-semibold uppercase gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Registry
        </button>
      </div>

      {/* Grid of stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Total Incidents</p>
          <div className="flex justify-between items-baseline">
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.total}</h3>
            <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-mono">MongoDB</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-300"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Awaiting Review</p>
          <div className="flex justify-between items-baseline">
            <h3 className="text-3xl font-extrabold text-amber-500">{stats.pending}</h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold text-[9px]">Level 1</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">In Mobilization</p>
          <div className="flex justify-between items-baseline">
            <h3 className="text-3xl font-extrabold text-blue-500">{stats.inProgress}</h3>
            <span className="text-[10px] bg-blue-50 text-blue-750 px-1.5 py-0.5 rounded font-semibold text-[9px]">Active</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Resolved Jobs</p>
          <div className="flex justify-between items-baseline">
            <h3 className="text-3xl font-extrabold text-emerald-500">{stats.resolved}</h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold text-[9px]">Audited</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Section: Filters and List of complaints */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Filtering Rail */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between text-xs font-semibold">
            <div className="flex flex-wrap gap-4 items-center w-full">
              
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-slate-200 rounded-lg p-2 pr-6 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="All">All Categories ({stats.total})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat} ({stats.categoryCounts[cat] || 0})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Status State</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-200 rounded-lg p-2 pr-6 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="All">All States</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Sorting Filter */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Date Sort</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="border border-slate-200 rounded-lg p-2 pr-6 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Incident Registry Table/List */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                Active Complaint Registry ({filteredComplaints.length})
              </h3>
              <p className="text-xs text-slate-400 font-mono">Filter results</p>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-xs font-medium">Downloading live registry feeds...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                  <Filter className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">No matching records found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting the category or status selection dropdowns to explore other recorded facility requests.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {filteredComplaints.map((c) => {
                  const statusInfo = getStatusDetails(c.status);
                  const isSelected = selectedComplaint?._id === c._id;

                  return (
                    <div
                      key={c._id}
                      onClick={() => handleSelectComplaint(c)}
                      className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                        isSelected ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      {/* Selection accent line */}
                      {isSelected && <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-550"></div>}

                      <div className="space-y-1 w-full md:max-w-[70%]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCategoryTheme(c.category)}`}>
                            {c.category}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                          {c.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-650">
                            By: {c.createdBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {c.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Side feedback arrow */}
                      <div className="flex items-center gap-1 self-end md:self-auto text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                        <span>Review</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visual statistics analytics charts container */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-indigo-500" />
              Facility Complaint Density Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {CATEGORIES.map(cat => {
                const count = stats.categoryCounts[cat] || 0;
                const percentage = Math.round((count / (stats.total || 1)) * 100);
                
                return (
                  <div key={cat} className="space-y-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="font-bold text-slate-500 font-mono">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Section: Action workspace details pane */}
        <div className="lg:col-span-4">
          {selectedComplaint ? (
            /* Selected workflow workspace details */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden space-y-5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>

              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold">Reviewing: {selectedComplaint._id}</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                    {selectedComplaint.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Informative credentials */}
              <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium text-slate-650">
                <p>🙋‍♂️ <span className="font-bold text-slate-700">Lover:</span> {selectedComplaint.createdBy}</p>
                <p>📍 <span className="font-bold text-slate-700">Location:</span> {selectedComplaint.location}</p>
                <p>📅 <span className="font-bold text-slate-700">Lodge Time:</span> {new Date(selectedComplaint.createdDate).toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Details description</p>
                <p className="p-2.5 rounded bg-slate-50/50 border border-slate-100 text-xs text-slate-650 leading-relaxed font-sans">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Resolution Form or audit controls */}
              <form onSubmit={handleAdminUpdate} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Edit3 className="h-3 w-3" />
                  Management Workflow Actions
                </h4>

                {submitError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-semibold">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Set Resolution Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Pending", "In Progress", "Resolved"].map((st) => {
                      const isActive = selectedStatus === st;
                      const activeColors = st === "Pending" 
                        ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" 
                        : st === "In Progress" 
                        ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm";

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatus(st as any)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            isActive ? activeColors : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {st === "Pending" ? "Pending" : st === "In Progress" ? "In Progress" : "Resolve"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show resolution input if marked as Resolved */}
                {selectedStatus === "Resolved" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Resolution Audit Comments
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      placeholder="Comment on corrective action (e.g. Electrician scheduled, replaced faulty element in Block B library.)"
                      className="block w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    ></textarea>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Commit Workflow updates
                </button>
              </form>

              {/* Status Audit Timeline */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Audit Timeline Log</h4>
                <div className="space-y-3.5 pl-1.5">
                  {selectedComplaint.statusHistory?.map((history, idx) => {
                    const isNewest = idx === selectedComplaint.statusHistory.length - 1;
                    return (
                      <div key={idx} className="flex gap-2 relative text-xs">
                        {idx !== selectedComplaint.statusHistory.length - 1 && (
                          <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-slate-150"></div>
                        )}
                        <div className={`mt-1 h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                          isNewest ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>
                          <Layers className="h-2 w-2" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span className={isNewest ? "text-indigo-600" : ""}>{history.status}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(history.date).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[10px] mt-0.5 leading-snug">
                            {history.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* Empty administrative workspace details indicator */
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 h-full flex flex-col justify-center items-center">
              <Shield className="h-8 w-8 text-slate-300 mb-3" />
              <h4 className="text-sm font-semibold text-slate-700 font-bold">Admin Dispatch Center</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Select any logged complaint incident on the registry table to start updating statuses, assigning technicans, and saving final resolution logs.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
