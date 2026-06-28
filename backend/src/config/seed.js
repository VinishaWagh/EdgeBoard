import Task from '../models/Task.js';

const INITIAL_TASKS = [
  {
    userEmail: "jordan@colledge.in",
    title: "Launch Social Campaign — Q3 Summer Drop",
    client: "NovaBrand",
    priority: "critical",
    status: "in-progress",
    dueDate: "2026-07-05",
    tags: ["social", "paid"],
    assigneeIds: ["a1", "a3"],
    description: "Full-funnel campaign rollout across Instagram Reels, TikTok, and Meta Ads for Q3 summer collection drop.",
    activity: [
      { id: "ac1", type: "created", user: "Jordan Lee", time: "3 days ago", message: "Task created and assigned to team." },
      { id: "ac2", type: "status", user: "Ravi Kumar", time: "2 days ago", message: "Status moved to In Progress." },
      { id: "ac3", type: "comment", user: "Jordan Lee", time: "6 hours ago", message: "Creative assets approved by client. Moving to scheduling." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Redesign Landing Page Hero Section",
    client: "PulseWear",
    priority: "high",
    status: "pending",
    dueDate: "2026-07-10",
    tags: ["web", "design"],
    assigneeIds: ["a2"],
    description: "Revamp the above-the-fold section with new brand photography and motion headline.",
    activity: [
      { id: "ac4", type: "created", user: "Maya Chen", time: "1 day ago", message: "Task created." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Influencer Brief Deck for TikTok Push",
    client: "DropZone",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-07-03",
    tags: ["influencer", "video"],
    assigneeIds: ["a4", "a5"],
    description: "Create a detailed brief deck for 8 micro-influencers across streetwear and sports verticals.",
    activity: [
      { id: "ac5", type: "created", user: "Priya Nair", time: "4 days ago", message: "Task created." },
      { id: "ac6", type: "assigned", user: "Sam Torres", time: "3 days ago", message: "Sam Torres added to task." },
      { id: "ac7", type: "comment", user: "Priya Nair", time: "1 day ago", message: "First draft of deck ready for review." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Email Drip Sequence — Onboarding Flow",
    client: "ArcHQ",
    priority: "medium",
    status: "completed",
    dueDate: "2026-06-28",
    tags: ["email", "automation"],
    assigneeIds: ["a1"],
    description: "7-email onboarding drip covering product education, social proof, and first-purchase incentive.",
    activity: [
      { id: "ac8", type: "created", user: "Jordan Lee", time: "6 days ago", message: "Task created." },
      { id: "ac9", type: "status", user: "Jordan Lee", time: "2 days ago", message: "Marked as completed." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "SEO Audit & Content Gap Analysis",
    client: "NovaBrand",
    priority: "medium",
    status: "overdue",
    dueDate: "2026-06-20",
    tags: ["seo", "content"],
    assigneeIds: ["a2", "a3"],
    description: "Full technical SEO audit + competitive content gap analysis across 5 target keyword clusters.",
    activity: [
      { id: "ac10", type: "created", user: "Maya Chen", time: "10 days ago", message: "Task created." },
      { id: "ac11", type: "comment", user: "Ravi Kumar", time: "8 days ago", message: "Ahrefs crawl complete. Writing report." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Paid Ads Creative — Meta Reels",
    client: "DropZone",
    priority: "critical",
    status: "pending",
    dueDate: "2026-07-01",
    tags: ["paid", "creative"],
    assigneeIds: ["a5"],
    description: "Design 6 video creative variants (9:16) for Meta Reels targeting 18-34 streetwear audience.",
    activity: [
      { id: "ac12", type: "created", user: "Sam Torres", time: "2 days ago", message: "Task created." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Monthly Analytics Report — June",
    client: "PulseWear",
    priority: "low",
    status: "completed",
    dueDate: "2026-06-30",
    tags: ["reporting"],
    assigneeIds: ["a2"],
    description: "Compile full-funnel performance report: reach, engagement, conversions, and ROAS across all active channels.",
    activity: [
      { id: "ac13", type: "created", user: "Maya Chen", time: "5 days ago", message: "Task created." },
      { id: "ac14", type: "status", user: "Maya Chen", time: "1 day ago", message: "Report delivered to client." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "Brand Guidelines Refresh",
    client: "ArcHQ",
    priority: "high",
    status: "overdue",
    dueDate: "2026-06-15",
    tags: ["branding", "design"],
    assigneeIds: ["a4"],
    description: "Update brand guidelines document to include new typography system, updated color palette, and revised logo usage rules.",
    activity: [
      { id: "ac15", type: "created", user: "Priya Nair", time: "14 days ago", message: "Task created." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "YouTube Thumbnail A/B Test",
    client: "DropZone",
    priority: "low",
    status: "pending",
    dueDate: "2026-07-08",
    tags: ["video", "creative"],
    assigneeIds: ["a5"],
    description: "Design and test 3 thumbnail variants per video across the last 5 uploads to optimise CTR.",
    activity: [
      { id: "ac16", type: "created", user: "Sam Torres", time: "1 day ago", message: "Task created." },
    ],
  },
  {
    userEmail: "jordan@colledge.in",
    title: "CRM Integration — HubSpot Setup",
    client: "NovaBrand",
    priority: "medium",
    status: "in-progress",
    dueDate: "2026-07-12",
    tags: ["tech", "crm"],
    assigneeIds: ["a1", "a2"],
    description: "Configure HubSpot CRM pipeline stages, contact properties, and automation workflows aligned to sales process.",
    activity: [
      { id: "ac17", type: "created", user: "Jordan Lee", time: "3 days ago", message: "Task created." },
      { id: "ac18", type: "status", user: "Maya Chen", time: "2 days ago", message: "Started pipeline configuration." },
      { id: "ac19", type: "comment", user: "Jordan Lee", time: "5 hours ago", message: "Contacted HubSpot support re: API limits." },
    ],
  },
];

export const seedDB = async () => {
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      console.log('Database empty. Seeding initial tasks...');
      await Task.insertMany(INITIAL_TASKS);
      console.log('Seeded database successfully with default tasks.');
    }
  } catch (error) {
    console.error('Error seeding the database:', error.message);
  }
};
