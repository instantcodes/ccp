import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbStore, User, Complaint } from "./server/db";

// Express request extending to support authenticated fields
interface AuthenticatedRequest extends Request {
  user?: User;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  // Simple token authentication middleware helper
  const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <user_id>
    
    if (!token) {
      res.status(401).json({ error: "Access token required. Please login." });
      return;
    }

    const user = dbStore.findUserById(token);
    if (!user) {
      res.status(403).json({ error: "Invalid token or user session expired." });
      return;
    }

    req.user = user;
    next();
  };

  // --- API Routes ---

  // 1. Authentication: Register
  app.post("/api/auth/register", (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "name, email, password, and role are required fields." });
      }

      if (role !== "Student" && role !== "Admin") {
        return res.status(400).json({ error: "Role must be either 'Student' or 'Admin'." });
      }

      const existingUser = dbStore.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered. Please login." });
      }

      const newUser = dbStore.addUser({
        name,
        email: email.toLowerCase(),
        passwordHash: password, // For prototype ease, we save as is
        role
      });

      console.log(`[AUTH] User registered successfully: ${newUser.email} (${newUser.role})`);
      return res.status(201).json({
        success: true,
        token: newUser._id,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (e: any) {
      console.error("Register Error:", e);
      return res.status(500).json({ error: "Internal server registration failure." });
    }
  });

  // 2. Authentication: Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required fields." });
      }

      const user = dbStore.findUserByEmail(email);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: "Invalid email or password credentials." });
      }

      console.log(`[AUTH] User login successful: ${user.email} (${user.role})`);
      return res.json({
        success: true,
        token: user._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (e: any) {
      console.error("Login Error:", e);
      return res.status(500).json({ error: "Internal server login failure." });
    }
  });

  // 3. Current logged in user details retrieval
  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    return res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  });

  // 4. Complaint: Create a complaint (Student only)
  app.post("/api/complaints", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== "Student") {
        return res.status(403).json({ error: "Only students are authorized to lodge complaints." });
      }

      const { title, category, description, location } = req.body;
      if (!title || !category || !description || !location) {
        return res.status(400).json({ error: "All fields (title, category, description, location) are required." });
      }

      const newComplaint = dbStore.addComplaint({
        title,
        category,
        description,
        location,
        createdBy: user.name,
        createdById: user._id
      });

      console.log(`[COMPLAINT] Created: "${title}" by student ${user.name}`);
      return res.status(201).json({ success: true, complaint: newComplaint });
    } catch (e: any) {
      console.error("Create Complaint Error:", e);
      return res.status(500).json({ error: "Internal server error lodging complaint." });
    }
  });

  // 5. Complaint: Read / List complaints (Role specific)
  app.get("/api/complaints", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      let complaints = dbStore.getComplaints();

      // If user is a student, only return their own complaints
      if (user.role === "Student") {
        complaints = complaints.filter(c => c.createdById === user._id);
      }

      // Sort with newest on top
      complaints.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

      return res.json({ success: true, complaints });
    } catch (e: any) {
      console.error("List Complaints Error:", e);
      return res.status(500).json({ error: "Internal server error reading complaints." });
    }
  });

  // 6. Complaint: Update complaint (Student edits content or Admin resolves/updates status)
  app.put("/api/complaints/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const complaintId = req.params.id;
      const { title, category, description, location, status, resolutionDetails } = req.body;

      const complaints = dbStore.getComplaints();
      const complaint = complaints.find(c => c._id === complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found." });
      }

      // If role is Student: Can only edit if status is "Pending" & owns the complaint
      if (user.role === "Student") {
        if (complaint.createdById !== user._id) {
          return res.status(403).json({ error: "You can only edit complaints filed by yourself." });
        }
        if (complaint.status !== "Pending") {
          return res.status(400).json({ error: "Complaints cannot be edited once under administrative review." });
        }

        const updated = dbStore.updateComplaint(complaintId, {
          title: title || complaint.title,
          category: category || complaint.category,
          description: description || complaint.description,
          location: location || complaint.location
        });

        console.log(`[COMPLAINT] Updated by Student: "${complaintId}"`);
        return res.json({ success: true, complaint: updated });
      }

      // If role is Admin: Can update status, resolutionDetails
      if (user.role === "Admin") {
        if (status && !["Pending", "In Progress", "Resolved"].includes(status)) {
          return res.status(400).json({ error: "Status must be 'Pending', 'In Progress', or 'Resolved'." });
        }

        const updated = dbStore.updateComplaint(complaintId, {
          status: status || complaint.status,
          resolutionDetails: resolutionDetails !== undefined ? resolutionDetails : complaint.resolutionDetails
        });

        console.log(`[COMPLAINT] Updated by Admin: "${complaintId}" to status [${status || complaint.status}]`);
        return res.json({ success: true, complaint: updated });
      }

      return res.status(403).json({ error: "Unauthorized operation." });
    } catch (e: any) {
      console.error("Update Complaint Error:", e);
      return res.status(500).json({ error: "Internal server error updating complaint." });
    }
  });

  // 7. Complaint: Delete complaint (Student only - before review/pending)
  app.delete("/api/complaints/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const complaintId = req.params.id;

      const complaints = dbStore.getComplaints();
      const complaint = complaints.find(c => c._id === complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found." });
      }

      if (user.role !== "Student") {
        return res.status(403).json({ error: "Only student owners are authorized to delete complaints." });
      }

      if (complaint.createdById !== user._id) {
        return res.status(403).json({ error: "You can only delete your own complaints." });
      }

      if (complaint.status !== "Pending") {
        return res.status(400).json({ error: "Complaints cannot be deleted once under administrative review." });
      }

      const success = dbStore.deleteComplaint(complaintId);
      console.log(`[COMPLAINT] Deleted by Student: "${complaintId}"`);
      return res.json({ success, message: "Complaint successfully deleted from record." });
    } catch (e: any) {
      console.error("Delete Complaint Error:", e);
      return res.status(500).json({ error: "Internal server error deleting complaint." });
    }
  });

  // 8. Stats details API for dashboards
  app.get("/api/dashboard/stats", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const complaints = dbStore.getComplaints();

      let targetComplaints = complaints;
      if (user.role === "Student") {
        targetComplaints = complaints.filter(c => c.createdById === user._id);
      }

      // Calculate state totals
      const total = targetComplaints.length;
      const pending = targetComplaints.filter(c => c.status === "Pending").length;
      const inProgress = targetComplaints.filter(c => c.status === "In Progress").length;
      const resolved = targetComplaints.filter(c => c.status === "Resolved").length;

      // Group by categories
      const categoryCounts: Record<string, number> = {};
      targetComplaints.forEach(c => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      });

      return res.json({
        success: true,
        stats: {
          total,
          pending,
          inProgress,
          resolved,
          categoryCounts
        }
      });
    } catch (e: any) {
      console.error("Stats Api Error:", e);
      return res.status(500).json({ error: "Internal server error calculating stats indices." });
    }
  });

  // --- Serve Frontend Application / Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning dev hot reloading & direct frontend rendering
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve high-performance statically prebuilt frontend from dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server successfully to 0.0.0.0 as expected of sandboxed container
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(`  CCMS MERN-PROTOTYPE BACKEND RUNNING ON http://localhost:${PORT}`);
    console.log(`================================================================`);
  });
}

startServer();
