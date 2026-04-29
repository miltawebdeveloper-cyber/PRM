import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { getProjectById, clearAuth } from "../../services/auth";
import { getForumPosts, getAnnouncements } from "../../api";

const OverviewTab = ({ project }) => (
  <div className="detail-grid">
    <div className="detail-main">
      <div className="panel-card">
        <h2>Description</h2>
        <p>{project.description || "No description provided."}</p>
      </div>

      <div className="panel-card">
        <h2>Progress</h2>
        <div className="project-tile-progress-track">
          <div
            className="project-tile-progress-fill"
            style={{ width: `${project.progress}%`, background: "var(--primary)" }}
          />
        </div>
        <p>{project.progress}% Complete</p>
      </div>
    </div>

    <div className="detail-sidebar">
      <div className="panel-card">
        <h2>Project Information</h2>
        <div className="info-list">
          <div className="info-item">
            <label>Start Date</label>
            <span>{project.start_date || "—"}</span>
          </div>
          <div className="info-item">
            <label>End Date</label>
            <span>{project.end_date || "—"}</span>
          </div>
          <div className="info-item">
            <label>Created By</label>
            <span>{project.CreatedBy?.name || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ActivityTab = ({ projectId }) => <div className="panel-card"><h2>Activity</h2><p>Activity log coming soon...</p></div>;
const BudgetTab = ({ project }) => <div className="panel-card"><h2>Budget</h2><p>Budget info for {project.project_title}...</p></div>;
const DiscussionsTab = ({ projectId }) => {
  const [posts, setPosts] = useState([]);
  useEffect(() => { getForumPosts({ projectId }).then(setPosts).catch(console.error); }, [projectId]);
  return (
    <div className="panel-card">
      <h2>Discussions</h2>
      {posts.map(p => <div key={p.id}><h4>{p.title}</h4><p>{p.content}</p></div>)}
      {posts.length === 0 && <p>No discussions found.</p>}
    </div>
  );
};
const AnnouncementsTab = ({ projectId }) => {
  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => { getAnnouncements().then(setAnnouncements).catch(console.error); }, []);
  return (
    <div className="panel-card">
      <h2>Announcements</h2>
      {announcements.map(a => <div key={a.id}><h4>{a.title}</h4><p>{a.content}</p></div>)}
      {announcements.length === 0 && <p>No announcements.</p>}
    </div>
  );
};
const GanttTab = ({ projectId }) => <div className="panel-card"><h2>Gantt Chart</h2><p>Gantt chart rendering...</p></div>;

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");

  const TABS = ["Overview", "Tasks", "Milestones", "Issues", "Team", "Files", "Activity", "Budget", "Discussions", "Announcements", "Gantt"];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjectById(id);
        setProject(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load project");
        if (err.response?.status === 401) {
          clearAuth();
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading project details...</h2>
        </section>
      </main>
    );
  }

  if (error || !project) {
    return (
      <WorkspaceLayout title="Project Details" onLogout={handleLogout}>
        <div className="error-text">{error || "Project not found"}</div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout
      title={project.project_title}
      subtitle={`Project ID: ${project.project_code}`}
      onLogout={handleLogout}
      activeSection="Projects"
    >
      <div className="project-detail-container">
        <section className="project-detail-hero">
          <div className="hero-content">
            <h1>{project.project_title}</h1>
            <p className="project-meta">
              <span className="status-chip active">{project.status}</span>
              <span className="meta-item">Client: {project.Client?.name || "None"}</span>
              <span className="meta-item">Group: {project.ProjectGroup?.name || "None"}</span>
            </p>
          </div>
        </section>

        <section className="project-detail-tabs" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
          {TABS.map((tab) => (
            <button 
              key={tab} 
              className={`tab-btn ${tab === activeTab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{ whiteSpace: "nowrap" }}
            >
              {tab}
            </button>
          ))}
        </section>

        <div className="project-detail-content" style={{ marginTop: "16px" }}>
          {activeTab === "Overview" && <OverviewTab project={project} />}
          {activeTab === "Activity" && <ActivityTab projectId={project.id} />}
          {activeTab === "Budget" && <BudgetTab project={project} />}
          {activeTab === "Discussions" && <DiscussionsTab projectId={project.id} />}
          {activeTab === "Announcements" && <AnnouncementsTab projectId={project.id} />}
          {activeTab === "Gantt" && <GanttTab projectId={project.id} />}
          {["Tasks", "Milestones", "Issues", "Team", "Files"].includes(activeTab) && (
            <div className="panel-card">
              <h2>{activeTab}</h2>
              <p>Content for {activeTab} coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export default ProjectDetail;
