import React, { useState, useEffect } from "react";
import { Complaint, DashboardStats, User } from "../types";
import { 
  Plus, Edit2, Trash2, Calendar, MapPin, CheckCircle, 
  Clock, AlertCircle, FileText, ChevronRight, X, ArrowUpRight, CheckSquare, Layers, Loader2
} from "lucide-react";

interface StudentDashboardProps {
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

export default function StudentDashboard({ user, token }: StudentDashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    categoryCounts: {}
  });

  // UI state controllers
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);

  // Load complaints and stats on startup or change
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch complaints
      const complaintsRes = await fetch("/api/complaints", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const complaintsData = await complaintsRes.json();
      if (complaintsRes.ok) {
        setComplaints(complaintsData.complaints);
      }

      // 2. Fetch stats
      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData.stats);
      }
    } catch (e) {
      console.error("Failed to load student dashboard info:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Open lodge form
  const handleOpenNewComplaint = () => {
    setEditingComplaint(null);
    setTitle("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setLocation("");
    setFormError(null);
    setShowForm(true);
  };

  // Open edit form
  const handleOpenEditComplaint = (complaint: Complaint) => {
    if (complaint.status !== "Pending") return;
    setEditingComplaint(complaint);
    setTitle(complaint.title);
    setCategory(complaint.category);
    setDescription(complaint.description);
    setLocation(complaint.location);
    setFormError(null);
    setShowForm(true);
  };

  // Submit new or edited complaint
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setFormError("All fields must be completely filled.");
      return;
    }

    setFormIsSubmitting(true);
    try {
      const url = editingComplaint 
        ? `/api/complaints/${editingComplaint._id}` 
        : "/api/complaints";
      
      const method = editingComplaint ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, category, description, location })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed saving complaint");
      }

      setShowForm(false);
      fetchData(); // Refresh list

      // Update details panel if active
      if (editingComplaint && selectedComplaint?._id === editingComplaint._id) {
        setSelectedComplaint(data.complaint);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed lodging issue to backend server.");
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // Delete complaint
  const handleDeleteComplaint = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        if (selectedComplaint?._id === id) {
          setSelectedComplaint(null);
        }
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed deleting complaint");
      }
    } catch (e) {
      console.error("Deletion error:", e);
    }
  };

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

  // Helper categorized icon maps
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

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 id="welcome-header" className="text-2xl font-bold text-slate-900 tracking-tight">Student Action Panel</h1>
          <p className="text-slate-500 text-sm mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user.name}</span>. Lodge issues and track live resolutions.
          </p>
        </div>
        <button
          onClick={handleOpenNewComplaint}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer self-start md:self-auto uppercase tracking-wide gap-2"
        >
          <Plus className="h-4 w-4" />
          Lodge Complaint
        </button>
      </div>

      {/* Grid of stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Total Lodged</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Pending Resolution</p>
              <h3 className="text-3xl font-bold text-amber-600">{stats.pending + stats.inProgress}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Successfully Resolved</p>
              <h3 className="text-3xl font-bold text-emerald-600">{stats.resolved}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left pane: Active Complaints */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-500" />
                Durable Complaint Registry ({complaints.length})
              </h3>
              <p className="text-xs text-slate-400 font-mono">Real-time DB connection</p>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-xs font-medium">Fetching complaint entries...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">No complaints logged yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Get started by lodging your first complaint regarding facilities, classrooms, or library resources.
                </p>
                <button
                  onClick={handleOpenNewComplaint}
                  className="mt-4 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 font-semibold text-xs transition-colors"
                >
                  Lodge First Complaint
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {complaints.map((c) => {
                  const statusInfo = getStatusDetails(c.status);
                  const isPending = c.status === "Pending";
                  const isSelected = selectedComplaint?._id === c._id;
                  
                  return (
                    <div 
                      key={c._id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                        isSelected ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      {/* Selection accent line */}
                      {isSelected && <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500"></div>}

                      <div className="space-y-1 w-full sm:max-w-[75%]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCategoryTheme(c.category)}`}>
                            {c.category}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600">
                          {c.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
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

                      {/* Controls on cards */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isPending && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditComplaint(c);
                              }}
                              title="Edit lodging"
                              className="p-1 px-2 text-xs font-semibold rounded border border-slate-200 hover:bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComplaint(c._id);
                              }}
                              title="Delete lodging"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded border border-transparent hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Tracking details or Form */}
        <div className="lg:col-span-5">
          {showForm ? (
            /* Lodge / Edit Form block */
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  {editingComplaint ? "Modify Logged Issue" : "Lodge Facility Complaint"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 mb-4 rounded-lg bg-rose-50 text-xs text-rose-600 border border-rose-100 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Short Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Block B second floor water faucet damage"
                    className="block w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-35">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category Type</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Specific Location</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Room 302, Library floor 2"
                      className="block w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Details & Context</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description of the infrastructure malfunction. What needs fixing?"
                    className="block w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans"
                  ></textarea>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3.5 py-2 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formIsSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {formIsSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {editingComplaint ? "Save Updates" : "Submit Issue"}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedComplaint ? (
            /* Complaint details & tracking timeline */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative overflow-hidden space-y-5">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{selectedComplaint._id}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCategoryTheme(selectedComplaint.category)}`}>
                      {selectedComplaint.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-950 text-base mt-1 tracking-tight">
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

              {/* Status details card */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Complaint Status</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                    {getStatusDetails(selectedComplaint.status).icon}
                    {selectedComplaint.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Lodge Date</p>
                  <p className="text-slate-600 mt-0.5 font-medium">
                    {new Date(selectedComplaint.createdDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description context */}
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Lodge Description</p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-100 font-sans">
                  {selectedComplaint.description}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  Location: <span className="text-slate-700">{selectedComplaint.location}</span>
                </p>
              </div>

              {/* Resolution Info if exists */}
              {selectedComplaint.status === "Resolved" && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">Resolution Summary</span>
                  <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                    {selectedComplaint.resolutionDetails || "Facilities maintenance validated issues resolved on secondary audit."}
                  </p>
                  {selectedComplaint.resolvedDate && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Closed date: {new Date(selectedComplaint.resolvedDate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline segment */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Audit Progress Timeline</h4>
                
                <div className="space-y-4 pt-1 pl-2">
                  {selectedComplaint.statusHistory?.map((history, idx) => {
                    const isNewest = idx === selectedComplaint.statusHistory.length - 1;
                    const details = getStatusDetails(history.status);

                    return (
                      <div key={idx} className="flex gap-3 relative">
                        {/* Connecting line */}
                        {idx !== selectedComplaint.statusHistory.length - 1 && (
                          <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-slate-100"></div>
                        )}
                        
                        {/* Bullet circle */}
                        <div className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center z-10 ${
                          isNewest ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-400"
                        }`}>
                          <Layers className="h-2.5 w-2.5" />
                        </div>

                        {/* History comment */}
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className={`font-bold uppercase tracking-wide text-[10px] ${
                              isNewest ? "text-indigo-600" : "text-slate-500"
                            }`}>
                              {history.status}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(history.date).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
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
            /* Direct tracker display */
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 h-full flex flex-col justify-center items-center">
              <Layers className="h-8 w-8 text-slate-350 mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">Track Complaint Actions</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Select any lodged complaint on the left panel to display its status tracking timeline, admin actions, and final resolution audit details.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
