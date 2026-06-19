import fs from "fs";
import path from "path";

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "Student" | "Admin";
}

export interface StatusHistoryEntry {
  status: "Pending" | "In Progress" | "Resolved";
  comment: string;
  date: string;
}

export interface Complaint {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: "Pending" | "In Progress" | "Resolved";
  createdBy: string;
  createdById: string;
  createdDate: string;
  resolutionDetails?: string;
  resolvedDate?: string;
  statusHistory: StatusHistoryEntry[];
}

const DB_FILE = path.join(process.cwd(), "db_store.json");

interface DBStructure {
  users: User[];
  complaints: Complaint[];
}

const DEFAULT_USERS: User[] = [
  {
    _id: "user_admin_1",
    name: "Dean Aris (Admin)",
    email: "admin@college.edu",
    passwordHash: "admin123", // Simple plain/hash for demonstration ease
    role: "Admin"
  },
  {
    _id: "user_student_1",
    name: "Alex Rivera",
    email: "student@college.edu",
    passwordHash: "student123",
    role: "Student"
  }
];

const DEFAULT_COMPLAINTS: Complaint[] = [
  {
    _id: "comp_1",
    title: "Water Dispenser Leaking in Block C Lobby",
    category: "Water Supply",
    description: "The primary drinking water dispenser has a constant leak at the tap. Water is pooling on the polished tile floor, creating a severe slipping hazard for students entering and exiting.",
    location: "Block C hostels, Ground Floor Lobby",
    status: "Pending",
    createdBy: "Alex Rivera",
    createdById: "user_student_1",
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    statusHistory: [
      {
        status: "Pending",
        comment: "Complaint lodged in system.",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    _id: "comp_2",
    title: "Lab Computers in C-102 internet outage",
    category: "Internet/Wi-Fi",
    description: "During the afternoon computer science practical exams, none of the PCs on the right-hand bay (systems 20-35) were able to connect to the intranet or global web. This delayed our lab assignment imports.",
    location: "Computer Lab 102, Main Science Wing",
    status: "In Progress",
    createdBy: "Alex Rivera",
    createdById: "user_student_1",
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    statusHistory: [
      {
        status: "Pending",
        comment: "Complaint lodged in system.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: "In Progress",
        comment: "IT Technician assigned. Re-routing Ethernet switch to Bay 2.",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    _id: "comp_3",
    title: "Flickering Overhead Tube Lights in Library quiet zone",
    category: "Electrical",
    description: "Three tube light fixtures overhead are flickering rapidly. It is extremely distracting for anyone attempting to read or write in the quiet study area at the back of the second floor.",
    location: "Central Library, Second Floor Silent Wing",
    status: "Resolved",
    createdBy: "Sarah Jenkins",
    createdById: "user_student_demo",
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    resolutionDetails: "Electrician replaced the faulty electronic ballasts and installed clean, high-performance LED tubes. Flickering is fully resolved.",
    resolvedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      {
        status: "Pending",
        comment: "Complaint registered.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: "In Progress",
        comment: "Work order created for Central Maintenance Unit.",
        date: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: "Resolved",
        comment: "Tubes replaced with LED elements. Checked works.",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

class Database {
  private data: DBStructure = { users: [], complaints: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure defaults are populated if list empty
        if (!this.data.users || this.data.users.length === 0) {
          this.data.users = [...DEFAULT_USERS];
        }
        if (!this.data.complaints) {
          this.data.complaints = [...DEFAULT_COMPLAINTS];
        }
        this.save();
      } else {
        this.data = {
          users: [...DEFAULT_USERS],
          complaints: [...DEFAULT_COMPLAINTS]
        };
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB, fallback in memory", e);
      this.data = {
        users: [...DEFAULT_USERS],
        complaints: [...DEFAULT_COMPLAINTS]
      };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database store", e);
    }
  }

  // --- Collection Simulation Methods ---

  getUsers(): User[] {
    this.load();
    return this.data.users;
  }

  getComplaints(): Complaint[] {
    this.load();
    return this.data.complaints;
  }

  findUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.getUsers().find(u => u._id === id);
  }

  addUser(user: Omit<User, "_id">): User {
    const newUser: User = {
      ...user,
      _id: "user_" + Math.random().toString(36).substr(2, 9)
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  addComplaint(complaint: Omit<Complaint, "_id" | "status" | "createdDate" | "statusHistory">): Complaint {
    const newComplaint: Complaint = {
      ...complaint,
      _id: "comp_" + Math.random().toString(36).substr(2, 9),
      status: "Pending",
      createdDate: new Date().toISOString(),
      statusHistory: [
        {
          status: "Pending",
          comment: "Complaint registered in local store.",
          date: new Date().toISOString()
        }
      ]
    };
    this.data.complaints.push(newComplaint);
    this.save();
    return newComplaint;
  }

  updateComplaint(id: string, updates: Partial<Omit<Complaint, "_id" | "createdBy" | "createdById" | "createdDate">>): Complaint | null {
    const cIdx = this.data.complaints.findIndex(c => c._id === id);
    if (cIdx === -1) return null;

    const current = this.data.complaints[cIdx];
    const prevStatus = current.status;
    
    // Merge general updates
    const updated = {
      ...current,
      ...updates
    };

    // If status changed, record to history
    if (updates.status && updates.status !== prevStatus) {
      const comment = updates.status === "In Progress" 
        ? "Work started. Admin moved complaint status to In Progress."
        : updates.status === "Resolved"
        ? (updates.resolutionDetails || "Issue resolved by maintaining officer.")
        : "Complaint status reverted to Pending.";
        
      updated.statusHistory.push({
        status: updates.status,
        comment,
        date: new Date().toISOString()
      });

      if (updates.status === "Resolved") {
        updated.resolvedDate = new Date().toISOString();
        if (updates.resolutionDetails) {
          updated.resolutionDetails = updates.resolutionDetails;
        }
      }
    }

    this.data.complaints[cIdx] = updated;
    this.save();
    return updated;
  }

  deleteComplaint(id: string): boolean {
    const initialLen = this.data.complaints.length;
    this.data.complaints = this.data.complaints.filter(c => c._id !== id);
    this.save();
    return this.data.complaints.length < initialLen;
  }
}

export const dbStore = new Database();
