import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";
import FileAttachments from "../../components/FileAttachments";
import GanttChart from "../../components/GanttChart";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import CalendarView from "../../components/CalendarView";
import { useSocket } from "../../context/SocketContext";
import {
  clearAuth,
  createEmployeeOrManager,
  createTask,
  getCategories,
  getClients,
  getCurrentUser,
  getProjects,
  getUsers,
  getAllTasks,
  getMyTimesheets,
  startTimer,
  stopTimer,
  getTaskActivity,
  createTaskComment,
  updateTask,
} from "../../services/auth";
import KanbanCard from "../../components/KanbanCard";

const TASK_COLUMN_OPTIONS = [
  { key: "taskId", label: "Task ID" },
  { key: "phase", label: "Phase" },
  { key: "taskList", label: "Task List" },
  { key: "category", label: "Category" },
  { key: "taskName", label: "Task" },
  { key: "description", label: "Description" },
  { key: "dependency", label: "Dependency" },
  { key: "recurrence", label: "Recurring" },
  { key: "subtasks", label: "Subtasks" },
  { key: "project", label: "Milestone / Project" },
  { key: "assignedTo", label: "Associated Team" },
  { key: "assignedBy", label: "Assigned By" },
  { key: "status", label: "Status" },
  { key: "startDate", label: "Start Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "duration", label: "Work Hours" },
  { key: "priority", label: "Priority" },
  { key: "tags", label: "Task List / Tags" },
  { key: "timer", label: "Timer" },
];

function getInitialVisibleColumns() {
  if (typeof window === "undefined") {
    return TASK_COLUMN_OPTIONS.map((column) => column.key);
  }

  const raw = window.localStorage.getItem("task-board-visible-columns");
  if (!raw) {
    return TASK_COLUMN_OPTIONS.map((column) => column.key);
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    return TASK_COLUMN_OPTIONS.map((column) => column.key);
  }

  return TASK_COLUMN_OPTIONS.map((column) => column.key);
}



function CreateTask() {
  const socket = useSocket();
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [myLogs, setMyLogs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showEmployeeDrawer, setShowEmployeeDrawer] = useState(false);
  const [showColumnSidebar, setShowColumnSidebar] = useState(false);
  const [selectedDiscussionTask, setSelectedDiscussionTask] = useState(null);
  const [taskActivity, setTaskActivity] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [viewMode, setViewMode] = useState("list");
  const [columnSearch, setColumnSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(getInitialVisibleColumns);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState({ field: "createdAt", order: "DESC" });

  const [form, setForm] = useState({
    projectId: "",
    clientId: "",
    categoryId: "",
    taskName: "",
    description: "",
    phaseName: "",
    taskListName: "",
    assigneeId: "",
    predecessorTaskId: "",
    start_date: "",
    due_date: "",
    priority: "None",
    tags: "",
    estimated_hours: "",
    status: "Not Started",
    recurring: false,
    recurrence_pattern: "None",
    subtaskText: "",
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_name: "Employee",
    hourly_rate: "",
  });

  const loadData = async (page = 1) => {
    const [currentUser, clientsData, categoriesData, usersData, projectsData, taskResponse, timesheetData] =
      await Promise.all([
        getCurrentUser(),
        getClients(),
        getCategories(),
        getUsers(),
        getProjects(),
        getAllTasks({ 
          page, 
          limit: pageSize, 
          sortField: sortConfig.field, 
          sortOrder: sortConfig.order 
        }),
        getMyTimesheets(),
      ]);

    if (!currentUser || !["Manager", "Admin"].includes(currentUser.role)) {
      throw new Error("Only Manager/Admin can access this page");
    }

    setUser(currentUser);
    setClients(clientsData || []);
    setCategories(categoriesData || []);
    setProjects(projectsData || []);
    setEmployees(
      (usersData || []).filter(
        (u) => ["Employee", "Manager", "Admin"].includes(u.Role?.name) && u.is_active
      )
    );
    setTasks(taskResponse?.tasks || []);
    setTotalTasks(taskResponse?.total || 0);
    setTotalPages(taskResponse?.totalPages || 1);
    setCurrentPage(taskResponse?.page || 1);
    setMyLogs(timesheetData || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData(currentPage);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load task board");
        clearAuth();
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate, pageSize, sortConfig]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "task-board-visible-columns",
      JSON.stringify(visibleColumns)
    );
  }, [visibleColumns]);

  useEffect(() => {
    if (!socket) return;

    const handler = () => loadData(currentPage);
    socket.on("task-updated", handler);
    socket.on("task-created", handler);

    return () => {
      socket.off("task-updated", handler);
      socket.off("task-created", handler);
    };
  }, [socket, currentPage]);

  const runningLog = myLogs.find((log) => !log.end_time) || null;

  const formatDuration = (totalSeconds) => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hrs = String(Math.floor(safe / 3600)).padStart(2, "0");
    const mins = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
    const secs = String(safe % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const getLiveSeconds = (start) => {
    if (!start) return 0;
    return Math.floor((now - new Date(start).getTime()) / 1000);
  };

  const getTaskTimeSummary = (taskId) => {
    let total = 0;
    let runningEntry = null;

    myLogs.forEach((log) => {
      if (log.taskId !== taskId) return;
      if (log.end_time) {
        total += Number(log.hours_spent || 0);
      } else {
        total += getLiveSeconds(log.start_time) / 3600;
        runningEntry = log;
      }
    });

    return {
      total: Number(total.toFixed(2)),
      runningEntry,
    };
  };

  const taskRows = useMemo(
    () =>
      (tasks || []).map((task) => ({
        id: task.id,
        taskId: task.task_id,
        phase: task.phase_name || "-",
        taskList: task.task_list_name || "-",
        taskName: task.task_name || task.description || "-",
        description: task.description || "-",
        category: task.Category?.name || "-",
        categoryId: task.Category?.id || null,
        project: task.Project?.project_title || "-",
        projectId: task.Project?.id || null,
        assignedTo: task.Assignee?.name || "Unassigned",
        assigneeId: task.Assignee?.id || null,
        assignedBy: task.Manager?.name || "-",
        creatorId: task.Manager?.id || null,
        dependency: task.PredecessorTask?.task_id || "-",
        predecessorTaskId: task.PredecessorTask?.id || null,
        recurrence: task.recurrence_pattern || "None",
        subtasks:
          task.SubTasks?.length > 0
            ? task.SubTasks.map((subtask) => subtask.title).join(", ")
            : "-",
        subtaskItems: task.SubTasks || [],
        status: task.status || "Not Started",
        startDate: task.start_date || (task.createdAt ? String(task.createdAt).slice(0, 10) : "-"),
        dueDate: task.due_date || "-",
        duration: task.estimated_hours ? `${task.estimated_hours}h est.` : task.recurring ? "Recurring" : "-",
        priority: task.priority || "None",
        tags: task.tags || "-",
        createdAt: task.createdAt || null,
        updatedAt: task.updatedAt || null,
      })),
    [tasks]
  );

  const taskDependencyIndex = useMemo(() => {
    const map = new Map();
    taskRows.forEach((row) => {
      if (row.predecessorTaskId) {
        map.set(row.predecessorTaskId, (map.get(row.predecessorTaskId) || 0) + 1);
      }
    });
    return map;
  }, [taskRows]);

  const getDueDateInfo = useCallback((row) => {
    if (!row.dueDate || row.dueDate === "-") {
      return { label: "No Due Date", className: "neutral", daysUntilDue: null };
    }

    const due = new Date(`${row.dueDate}T23:59:59`);
    if (Number.isNaN(due.getTime())) {
      return { label: "No Due Date", className: "neutral", daysUntilDue: null };
    }

    const diffMs = due.getTime() - now;
    const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (row.status !== "Completed" && daysUntilDue < 0) {
      return { label: `${Math.abs(daysUntilDue)}d overdue`, className: "overdue", daysUntilDue };
    }
    if (row.status !== "Completed" && daysUntilDue === 0) {
      return { label: "Due today", className: "today", daysUntilDue };
    }
    if (row.status !== "Completed" && daysUntilDue <= 2) {
      return { label: `Due in ${daysUntilDue}d`, className: "soon", daysUntilDue };
    }

    return { label: row.status === "Completed" ? "Completed" : `Due in ${daysUntilDue}d`, className: "ontrack", daysUntilDue };
  }, [now]);

  const isCriticalTask = useCallback((row) => {
    const dueInfo = getDueDateInfo(row);
    const hasDependencyChain = Boolean(row.predecessorTaskId) || taskDependencyIndex.has(row.id);
    return row.status !== "Completed" && (row.priority === "Critical" || (hasDependencyChain && (dueInfo.className === "overdue" || dueInfo.className === "today" || dueInfo.className === "soon")));
  }, [getDueDateInfo, taskDependencyIndex]);

  const boardStats = useMemo(() => {
    const overdue = taskRows.filter((row) => getDueDateInfo(row).className === "overdue").length;
    const dueSoon = taskRows.filter((row) => {
      const dueInfo = getDueDateInfo(row).className;
      return dueInfo === "today" || dueInfo === "soon";
    }).length;
    const critical = taskRows.filter((row) => isCriticalTask(row)).length;
    const completed = taskRows.filter((row) => row.status === "Completed").length;

    return {
      total: taskRows.length,
      overdue,
      dueSoon,
      critical,
      completed,
    };
  }, [taskRows, getDueDateInfo, isCriticalTask]);

  const portfolioRows = useMemo(() => {
    const groups = new Map();

    taskRows.forEach((row) => {
      const projectKey = row.projectId || row.project;
      if (!groups.has(projectKey)) {
        groups.set(projectKey, {
          id: projectKey,
          name: row.project || "No Project",
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          critical: 0,
        });
      }

      const group = groups.get(projectKey);
      const dueInfo = getDueDateInfo(row);
      group.total += 1;
      if (row.status === "Completed") group.completed += 1;
      if (row.status === "In Progress") group.inProgress += 1;
      if (dueInfo.className === "overdue") group.overdue += 1;
      if (isCriticalTask(row)) group.critical += 1;
    });

    return Array.from(groups.values()).sort((a, b) => b.total - a.total);
  }, [taskRows, getDueDateInfo, isCriticalTask]);

  const kanbanColumns = useMemo(
    () => [
      { key: "Not Started", label: "Not Started" },
      { key: "In Progress", label: "In Progress" },
      { key: "Waiting for Client", label: "Waiting for Client" },
      { key: "Completed", label: "Completed" },
    ],
    []
  );

  const getEditableCellValue = (row, key) => {
    switch (key) {
      case "taskName":
        return row.taskName === "-" ? "" : row.taskName;
      case "description":
        return row.description === "-" ? "" : row.description;
      case "phase":
        return row.phase === "-" ? "" : row.phase;
      case "taskList":
        return row.taskList === "-" ? "" : row.taskList;
      case "category":
        return row.categoryId ? String(row.categoryId) : "";
      case "dependency":
        return row.predecessorTaskId ? String(row.predecessorTaskId) : "";
      case "recurrence":
        return row.recurrence || "None";
      case "project":
        return row.projectId ? String(row.projectId) : "";
      case "assignedTo":
        return row.assigneeId ? String(row.assigneeId) : "";
      case "status":
        return row.status;
      case "startDate":
        return row.startDate === "-" ? "" : row.startDate;
      case "dueDate":
        return row.dueDate === "-" ? "" : row.dueDate;
      case "duration":
        return row.duration.endsWith("h est.") ? row.duration.replace("h est.", "").trim() : "";
      case "priority":
        return row.priority;
      case "tags":
        return row.tags === "-" ? "" : row.tags;
      default:
        return row[key] ?? "";
    }
  };

  const startEditingCell = (row, key) => {
    if (Number(row.creatorId) !== Number(user?.id)) return;
    if (!["taskName", "description", "phase", "taskList", "category", "dependency", "recurrence", "project", "assignedTo", "status", "startDate", "dueDate", "duration", "priority", "tags"].includes(key)) {
      return;
    }
    setEditingCell({ rowId: row.id, key });
    setEditValue(getEditableCellValue(row, key));
  };

  const cancelEditingCell = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEditingCell = async (row, nextValue = editValue) => {
    if (!editingCell || editingCell.rowId !== row.id) return;

    const normalizedValue = typeof nextValue === "string" ? nextValue : String(nextValue ?? "");
    const payload = {};
    switch (editingCell.key) {
      case "taskName":
        payload.taskName = normalizedValue.trim();
        break;
      case "description":
        payload.description = normalizedValue.trim();
        break;
      case "phase":
        payload.phaseName = normalizedValue.trim();
        break;
      case "taskList":
        payload.taskListName = normalizedValue.trim();
        break;
      case "category":
        payload.categoryId = normalizedValue ? Number(normalizedValue) : null;
        break;
      case "dependency":
        payload.predecessorTaskId = normalizedValue ? Number(normalizedValue) : null;
        break;
      case "recurrence":
        payload.recurrence_pattern = normalizedValue || "None";
        payload.recurring = normalizedValue && normalizedValue !== "None";
        break;
      case "project":
        payload.projectId = normalizedValue ? Number(normalizedValue) : null;
        break;
      case "assignedTo":
        payload.assigneeId = normalizedValue ? Number(normalizedValue) : null;
        break;
      case "status":
        payload.status = normalizedValue;
        break;
      case "startDate":
        payload.start_date = normalizedValue || null;
        break;
      case "dueDate":
        payload.due_date = normalizedValue;
        break;
      case "duration":
        payload.estimated_hours = normalizedValue || null;
        break;
      case "priority":
        payload.priority = normalizedValue;
        break;
      case "tags":
        payload.tags = normalizedValue.trim();
        break;
      default:
        return;
    }

    if (editingCell.key === "taskName" && !payload.taskName) {
      setError("Task name is required");
      return;
    }
    if (editingCell.key === "dueDate" && !payload.due_date) {
      setError("Due date is required");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await updateTask(row.id, payload);
      cancelEditingCell();
      await loadData();
      setSuccess("Task updated");
    } catch (err) {
      const apiMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "");
      if (err.response?.status === 404) {
        setError("Task update route not available. Restart the backend server and try again.");
      } else {
        setError(apiMessage || "Failed to update task");
      }
    }
  };

  const handleEditorKeyDown = async (event, row) => {
    if (event.key === "Enter" && editingCell?.key !== "description") {
      event.preventDefault();
      await saveEditingCell(row);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditingCell();
    }
  };

  const renderEditableCell = (row, key, displayValue) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.key === key;
    const canEdit = Number(row.creatorId) === Number(user?.id);

    if (!isEditing) {
      return (
        <div
          className={`task-cell-display ${canEdit ? "editable" : ""}`}
          onDoubleClick={() => startEditingCell(row, key)}
          title={canEdit ? "Double-click to edit" : ""}
        >
          {displayValue}
        </div>
      );
    }

    if (key === "description") {
      return (
        <textarea
          className="task-inline-editor task-inline-textarea"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        />
      );
    }

    if (key === "category") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="">No Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      );
    }

    if (key === "dependency") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="">No Dependency</option>
          {taskRows
            .filter((taskRow) => taskRow.id !== row.id)
            .map((taskRow) => (
              <option key={taskRow.id} value={taskRow.id}>
                {taskRow.taskId} - {taskRow.taskName}
              </option>
            ))}
        </select>
      );
    }

    if (key === "recurrence") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="None">None</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      );
    }

    if (key === "project") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="">No Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.project_title}
            </option>
          ))}
        </select>
      );
    }

    if (key === "assignedTo") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="">Unassigned</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      );
    }

    if (key === "status") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Waiting for Client">Waiting for Client</option>
        </select>
      );
    }

    if (key === "priority") {
      return (
        <select
          className="task-inline-editor"
          autoFocus
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            saveEditingCell(row, e.target.value);
          }}
          onBlur={(e) => saveEditingCell(row, e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, row)}
        >
          <option value="None">None</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      );
    }

    return (
      <input
        className="task-inline-editor"
        autoFocus
        type={key === "startDate" || key === "dueDate" ? "date" : key === "duration" ? "number" : "text"}
        min={key === "duration" ? "0" : undefined}
        step={key === "duration" ? "0.25" : undefined}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={(e) => saveEditingCell(row, e.target.value)}
        onKeyDown={(e) => handleEditorKeyDown(e, row)}
      />
    );
  };

  const renderTaskTitleCell = (row) => {
    const dueInfo = getDueDateInfo(row);
    const critical = isCriticalTask(row);

    return (
      <div className="task-title-cell">
        {renderEditableCell(row, "taskName", row.taskName)}
        <div className="task-row-flags">
          <span className={`task-reminder-pill ${dueInfo.className}`}>{dueInfo.label}</span>
          {critical ? <span className="task-reminder-pill critical">Critical Path</span> : null}
          <button
            type="button"
            className="task-link-chip"
            onClick={() => openDiscussionDrawer(row)}
          >
            Discuss
          </button>
        </div>
      </div>
    );
  };

  const taskColumns = [
      {
        key: "taskId",
        label: "ID",
        exportLabel: "Task ID",
        render: (row) => row.taskId,
      },
      {
        key: "phase",
        label: "Phase",
        exportLabel: "Phase",
        render: (row) => renderEditableCell(row, "phase", row.phase),
      },
      {
        key: "taskList",
        label: "Task List",
        exportLabel: "Task List",
        render: (row) => renderEditableCell(row, "taskList", row.taskList),
      },
      {
        key: "category",
        label: "Category",
        exportLabel: "Category",
        render: (row) => renderEditableCell(row, "category", row.category),
      },
      {
        key: "taskName",
        label: "Task",
        exportLabel: "Task",
        render: (row) => renderTaskTitleCell(row),
        exportValue: (row) => row.taskName,
      },
      {
        key: "description",
        label: "Description",
        exportLabel: "Description",
        render: (row) => renderEditableCell(row, "description", row.description),
      },
      {
        key: "dependency",
        label: "Dependency",
        exportLabel: "Dependency",
        render: (row) => renderEditableCell(row, "dependency", row.dependency),
      },
      {
        key: "recurrence",
        label: "Recurring",
        exportLabel: "Recurring",
        render: (row) => renderEditableCell(row, "recurrence", row.recurrence),
      },
      {
        key: "subtasks",
        label: "Subtasks",
        exportLabel: "Subtasks",
        render: (row) => row.subtasks,
      },
      {
        key: "project",
        label: "Project",
        exportLabel: "Project",
        render: (row) => renderEditableCell(row, "project", row.project),
      },
      {
        key: "assignedTo",
        label: "Assigned To",
        exportLabel: "Assigned To",
        render: (row) => renderEditableCell(row, "assignedTo", row.assignedTo),
      },
      {
        key: "assignedBy",
        label: "Assigned By",
        exportLabel: "Assigned By",
        render: (row) => row.assignedBy,
      },
      {
        key: "status",
        label: "Status",
        exportLabel: "Status",
        render: (row) => renderEditableCell(row, "status", row.status),
        exportValue: (row) => row.status,
      },
      {
        key: "startDate",
        label: "Start Date",
        exportLabel: "Start Date",
        render: (row) => renderEditableCell(row, "startDate", row.startDate),
      },
      {
        key: "dueDate",
        label: "Due Date",
        exportLabel: "Due Date",
        render: (row) => renderEditableCell(row, "dueDate", row.dueDate),
      },
      {
        key: "duration",
        label: "Duration",
        exportLabel: "Duration",
        render: (row) => renderEditableCell(row, "duration", row.duration),
      },
      {
        key: "priority",
        label: "Priority",
        exportLabel: "Priority",
        render: (row) => renderEditableCell(row, "priority", row.priority),
      },
      {
        key: "tags",
        label: "Tags",
        exportLabel: "Tags",
        render: (row) => renderEditableCell(row, "tags", row.tags),
      },
      {
        key: "timer",
        label: "Timer",
        exportLabel: "Timer",
        render: (row) => {
          const { total, runningEntry } = getTaskTimeSummary(row.id);
          const canTrackThisTask = row.assigneeId === user?.id;

          return (
            <div className="task-timer-cell">
              <span className="toolbar-link">{total}h logged</span>
              {runningEntry ? (
                <>
                  <span className="toolbar-link">
                    Running {formatDuration(getLiveSeconds(runningEntry.start_time))}
                  </span>
                  <button type="button" onClick={() => handleStopTimer(runningEntry.id)}>
                    Stop
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartTimer(row.id)}
                  disabled={!canTrackThisTask || Boolean(runningLog)}
                >
                  {!canTrackThisTask
                    ? "Assigned User Only"
                    : runningLog
                    ? "Stop Current Timer"
                    : "Start Timer"}
                </button>
              )}
            </div>
          );
        },
        exportValue: (row) => `${getTaskTimeSummary(row.id).total}h logged`,
      },
    ];

  const selectedColumns = (() => {
    const ordered = taskColumns.filter((column) => visibleColumns.includes(column.key));
    return ordered.length ? ordered : taskColumns;
  })();

  const filteredColumnOptions = useMemo(() => {
    const query = columnSearch.trim().toLowerCase();
    if (!query) return TASK_COLUMN_OPTIONS;

    return TASK_COLUMN_OPTIONS.filter((column) =>
      column.label.toLowerCase().includes(query)
    );
  }, [columnSearch]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleProjectChange = (projectIdValue) => {
    const selectedId = Number(projectIdValue);
    const project = projects.find((p) => p.id === selectedId);
    setForm((prev) => ({
      ...prev,
      projectId: projectIdValue,
      clientId: project?.clientId ? String(project.clientId) : prev.clientId,
    }));
  };

  const handleCreateTask = async (event, keepOpen = false) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createTask({
        ...form,
        projectId: form.projectId ? Number(form.projectId) : null,
        clientId: form.clientId ? Number(form.clientId) : null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        predecessorTaskId: form.predecessorTaskId ? Number(form.predecessorTaskId) : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        subtasks: form.subtaskText
          .split("\n")
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => ({ title })),
      });

      setForm({
        projectId: "",
        clientId: "",
        categoryId: "",
        taskName: "",
        description: "",
        phaseName: "",
        taskListName: "",
        assigneeId: "",
        predecessorTaskId: "",
        start_date: "",
        due_date: "",
        priority: "None",
        tags: "",
        estimated_hours: "",
        status: "Not Started",
        recurring: false,
        recurrence_pattern: "None",
        subtaskText: "",
      });
      if (!keepOpen) {
        setShowTaskDrawer(false);
      }
      await loadData();
      setSuccess("Task created successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createEmployeeOrManager({
        ...employeeForm,
        hourly_rate: employeeForm.hourly_rate ? Number(employeeForm.hourly_rate) : null,
      });
      setEmployeeForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role_name: "Employee",
        hourly_rate: "",
      });
      setShowEmployeeDrawer(false);
      await loadData();
      setSuccess("Employee login created");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create employee");
    }
  };

  const handleStartTimer = async (taskId) => {
    setError("");
    setSuccess("");
    try {
      await startTimer({
        taskId,
        billable_type: "Yes",
      });
      await loadData();
      setSuccess("Timer started");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start timer");
    }
  };

  const handleStopTimer = async (timesheetId) => {
    setError("");
    setSuccess("");
    try {
      await stopTimer(timesheetId, {});
      await loadData();
      setSuccess("Timer stopped and hours logged");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to stop timer");
    }
  };

  const handleExportTasks = () => {
    const headers = selectedColumns.map((column) => column.exportLabel || column.label);

    const escapeCell = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = taskRows.map((row) =>
      selectedColumns.map((column) =>
        column.exportValue ? column.exportValue(row) : row[column.key]
      )
    );

    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `task-list-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setSuccess("Task list downloaded");
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((key) => key !== columnKey);
      }
      return [...prev, columnKey];
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(TASK_COLUMN_OPTIONS.map((column) => column.key));
    setColumnSearch("");
  };

  const handleQuickStatusUpdate = async (row, status) => {
    try {
      setError("");
      setSuccess("");
      await updateTask(row.id, { status });
      await loadData();
      setSuccess("Task updated");
    } catch (err) {
      const apiMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "");
      setError(apiMessage || "Failed to update task");
    }
  };

  const openDiscussionDrawer = async (row) => {
    setSelectedDiscussionTask(row);
    setCommentDraft("");
    setDiscussionLoading(true);
    setError("");

    try {
      const activity = await getTaskActivity(row.id);
      setTaskActivity(activity || []);
    } catch (err) {
      setTaskActivity([]);
      setError(err.response?.data?.message || "Failed to load task discussion");
    } finally {
      setDiscussionLoading(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!selectedDiscussionTask) return;

    try {
      setError("");
      setSuccess("");
      await createTaskComment(selectedDiscussionTask.id, { comment: commentDraft });
      const activity = await getTaskActivity(selectedDiscussionTask.id);
      setTaskActivity(activity || []);
      setCommentDraft("");
      setSuccess("Comment added");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  const discussionItems = useMemo(() => taskActivity || [], [taskActivity]);

  const renderKanbanCard = (row) => {
    const dueInfo = getDueDateInfo(row);
    const critical = isCriticalTask(row);
    const canEditStatus = Number(row.creatorId) === Number(user?.id);
    const { total, runningEntry } = getTaskTimeSummary(row.id);

    return (
      <article className={`kanban-task-card ${critical ? "critical" : ""}`}>
        <div className="kanban-card-top">
          <div>
            <p className="kanban-card-id">{row.taskId}</p>
            <h3>{row.taskName}</h3>
          </div>
          <span className={`task-reminder-pill ${dueInfo.className}`}>{dueInfo.label}</span>
        </div>

        <p className="kanban-card-copy">{row.description}</p>

        <div className="kanban-card-meta">
          <span>{row.project}</span>
          <span>{row.assignedTo}</span>
          <span>{row.priority}</span>
          {row.phase !== "-" ? <span>{row.phase}</span> : null}
          {row.taskList !== "-" ? <span>{row.taskList}</span> : null}
          {row.dependency !== "-" ? <span>Blocked by {row.dependency}</span> : null}
          {critical ? <span>Critical Path</span> : null}
          <span>{total}h logged</span>
          {runningEntry ? <span>Timer Running</span> : null}
        </div>

        <div className="kanban-card-footer">
          <button type="button" className="secondary-btn" onClick={() => openDiscussionDrawer(row)}>
            Discuss
          </button>
          {canEditStatus ? (
            <select
              className="task-inline-editor"
              value={row.status}
              onChange={(e) => handleQuickStatusUpdate(row, e.target.value)}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Waiting for Client">Waiting for Client</option>
            </select>
          ) : (
            <span className="kanban-status-text">{row.status}</span>
          )}
        </div>
      </article>
    );
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    const possibleStatuses = ["Not Started", "In Progress", "Completed", "Waiting for Client"];
    let newStatus = possibleStatuses.includes(overId) ? overId : tasks.find(t => t.id === overId)?.status;

    const activeTask = tasks.find(t => t.id === taskId);
    if (activeTask && newStatus && activeTask.status !== newStatus) {
      const oldStatus = activeTask.status;
      try {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await updateTask(taskId, { status: newStatus });
        setSuccess(`Task ${activeTask.task_id} updated to ${newStatus}`);
      } catch (err) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: oldStatus } : t));
        setError("Failed to update task status");
      }
    }
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading tasks...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role || "Manager"}
      title="Tasks"
      subtitle="All Open"
      onLogout={handleLogout}
      activeSection="Task Board"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="task-board-top">
        <div className="task-board-summary">
          <span className="toolbar-link">
            {runningLog
              ? `Active Timer: ${runningLog.Task?.task_id || "Task"} (${formatDuration(
                  getLiveSeconds(runningLog.start_time)
                )})`
              : "All Open"}
          </span>
          <div className="task-board-insights">
            <span className="task-summary-chip neutral">{boardStats.total} Tasks</span>
            <span className="task-summary-chip danger">{boardStats.overdue} Overdue</span>
            <span className="task-summary-chip warning">{boardStats.dueSoon} Due Soon</span>
            <span className="task-summary-chip critical">{boardStats.critical} Critical</span>
            <span className="task-summary-chip success">{boardStats.completed} Completed</span>
          </div>
        </div>
        <div className="task-toolbar-actions">
          <div className="task-view-toggle">
            <button
              type="button"
              className={viewMode === "list" ? "view-toggle-btn active" : "view-toggle-btn"}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              type="button"
              className={viewMode === "kanban" ? "view-toggle-btn active" : "view-toggle-btn"}
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </button>
            <button
              type="button"
              className={viewMode === "gantt" ? "view-toggle-btn active" : "view-toggle-btn"}
              onClick={() => setViewMode("gantt")}
            >
              Gantt
            </button>
            <button
              type="button"
              className={viewMode === "calendar" ? "view-toggle-btn active" : "view-toggle-btn"}
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </button>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowColumnSidebar(true)}
          >
            Add Column
          </button>
          <button type="button" className="secondary-btn" onClick={handleExportTasks}>
            Download Excel View
          </button>
          <button type="button" onClick={() => setShowTaskDrawer(true)}>
            Add Task
          </button>
          {user?.role === "Admin" ? (
            <button type="button" className="secondary-btn" onClick={() => setShowEmployeeDrawer(true)}>
              Create Employee
            </button>
          ) : (
            <button type="button" className="secondary-btn" disabled>
              Employee Setup (Admin)
            </button>
          )}
        </div>
      </section>

      <section className="panel-card full-span portfolio-strip">
        <div className="panel-head">
          <h2>Portfolio Snapshot</h2>
          <span className="badge">{portfolioRows.length} Projects</span>
        </div>
        <div className="portfolio-grid">
          {portfolioRows.map((projectRow) => (
            <article key={projectRow.id} className="portfolio-card">
              <h3>{projectRow.name}</h3>
              <p>{projectRow.total} tasks tracked</p>
              <div className="portfolio-metrics">
                <span>{projectRow.completed} completed</span>
                <span>{projectRow.inProgress} in progress</span>
                <span>{projectRow.overdue} overdue</span>
                <span>{projectRow.critical} critical</span>
              </div>
            </article>
          ))}
          {portfolioRows.length === 0 ? <p>No project data available yet.</p> : null}
        </div>
      </section>

      <section className="panel-card full-span task-board-card">
        <div className="task-group-by">
          {viewMode === "list"
            ? "List View: double-click editable cells to update task data."
            : viewMode === "kanban"
            ? "Kanban View: monitor flow, deadlines, and critical dependency pressure."
            : "Gantt View: compare start dates, due dates, and schedule overlap on one timeline."}
        </div>
        {viewMode === "list" ? (
          <div className="table-wrap">
            <table className="task-grid-table">
              <thead>
                <tr>
                  {selectedColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskRows.map((row) => {
                  const critical = isCriticalTask(row);
                  const dueInfo = getDueDateInfo(row);

                  return (
                    <tr
                      key={row.id}
                      className={`task-table-row ${critical ? "critical" : ""} ${dueInfo.className}`}
                    >
                      {selectedColumns.map((column) => (
                        <td key={column.key}>{column.render(row)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {taskRows.length === 0 ? <p>No tasks yet. Click Add Task.</p> : null}
          </div>
        ) : viewMode === "kanban" ? (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-board">
              {kanbanColumns.map((column) => {
                const columnTasks = taskRows.filter((row) => row.status === column.key);
                return (
                  <section key={column.key} className="kanban-column">
                    <header className="kanban-column-head">
                      <h3>{column.label}</h3>
                      <span>{columnTasks.length}</span>
                    </header>
                    <SortableContext 
                      items={columnTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                      id={column.key}
                    >
                      <div className="kanban-column-body">
                        {columnTasks.length ? (
                          columnTasks.map((row) => (
                            <KanbanCard key={row.id} row={row} renderCard={renderKanbanCard} />
                          ))
                        ) : (
                          <p className="kanban-empty">No tasks in this stage.</p>
                        )}
                      </div>
                    </SortableContext>
                  </section>
                );
              })}
            </div>
          </DndContext>
        ) : viewMode === "gantt" ? (
          <GanttChart
            rows={taskRows}
            isCriticalTask={isCriticalTask}
            getDueDateInfo={getDueDateInfo}
            onDiscuss={openDiscussionDrawer}
            onUpdate={(id, payload) => updateTask(id, payload)}
          />
        ) : (
          <CalendarView 
            tasks={taskRows} 
            onTaskClick={(task) => openDiscussionDrawer(task)} 
          />
        )}
        
        {/* Pagination Controls */}
        {viewMode !== "gantt" && totalPages > 1 && (
          <div className="task-pagination">
            <div className="pagination-info">
              Showing {tasks.length} of {totalTasks} tasks
            </div>
            <div className="pagination-btns">
              <button 
                type="button" 
                className="secondary-btn" 
                disabled={currentPage === 1}
                onClick={() => loadData(currentPage - 1)}
              >
                Previous
              </button>
              <span className="page-indicator">Page {currentPage} of {totalPages}</span>
              <button 
                type="button" 
                className="secondary-btn" 
                disabled={currentPage === totalPages}
                onClick={() => loadData(currentPage + 1)}
              >
                Next
              </button>
            </div>
            <div className="page-size-selector">
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {showTaskDrawer ? (
        <section className="modal-overlay task-drawer-overlay">
          <div className="new-project-backdrop" onClick={() => setShowTaskDrawer(false)} />
          <article className="task-drawer">
            <header className="new-project-header">
              <h2>New Task</h2>
              <p>Task Details</p>
            </header>
            <form className="project-form premium-project-form" onSubmit={handleCreateTask}>
              <div className="project-form-row full">
                <label>Project *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_title} ({project.project_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="project-form-row full">
                <label>Task Name *</label>
                <input
                  value={form.taskName}
                  onChange={(e) => setForm((prev) => ({ ...prev, taskName: e.target.value }))}
                  required
                />
              </div>

              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Phase</label>
                  <input
                    value={form.phaseName}
                    onChange={(e) => setForm((prev) => ({ ...prev, phaseName: e.target.value }))}
                    placeholder="Planning, Execution, Closure"
                  />
                </div>
                <div className="project-form-row">
                  <label>Task List</label>
                  <input
                    value={form.taskListName}
                    onChange={(e) => setForm((prev) => ({ ...prev, taskListName: e.target.value }))}
                    placeholder="Design, Review, Delivery"
                  />
                </div>
              </div>

              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Task Assigned To *</label>
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, assigneeId: e.target.value }))}
                    required
                  >
                    <option value="">Select Employee/Manager</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="project-form-row">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="project-form-row">
                  <label>Dependency</label>
                  <select
                    value={form.predecessorTaskId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, predecessorTaskId: e.target.value }))
                    }
                  >
                    <option value="">No Dependency</option>
                    {taskRows.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.taskId} - {task.taskName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Waiting for Client">Waiting for Client</option>
                  </select>
                </div>
                <div className="project-form-row">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="project-form-row">
                  <label>Recurring Pattern</label>
                  <select
                    value={form.recurrence_pattern}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        recurrence_pattern: e.target.value,
                        recurring: e.target.value !== "None",
                      }))
                    }
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                  >
                    <option value="">Auto</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.client_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="project-form-row">
                  <label>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Default Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.category_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="project-form-row">
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={form.estimated_hours}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, estimated_hours: e.target.value }))
                    }
                    placeholder="e.g. 2.5"
                  />
                </div>
              </div>

              <div className="project-form-row full">
                <label>Tags</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="tax, payroll, urgent"
                />
              </div>

              <div className="project-form-row full">
                <label>Add Description</label>
                <div className="editor-toolbar">
                  <span>B</span>
                  <span>I</span>
                  <span>U</span>
                  <span>&bull;</span>
                  <span>1.</span>
                  <span>Link</span>
                  <span>Code</span>
                </div>
                <textarea
                  className="text-area large-editor"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="project-form-row full">
                <label>Subtasks</label>
                <textarea
                  className="text-area"
                  value={form.subtaskText}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtaskText: e.target.value }))}
                  placeholder={"One subtask per line\nExample:\nCollect documents\nReview draft\nClient approval"}
                />
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm((prev) => ({ ...prev, recurring: e.target.checked }))}
                />
                Recurring Task
              </label>

              <div className="form-actions">
                <button type="submit">Add</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={(e) => handleCreateTask(e, true)}
                >
                  Add More
                </button>
                <button type="button" className="secondary-btn" onClick={() => setShowTaskDrawer(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </article>
        </section>
      ) : null}

      {showEmployeeDrawer ? (
        <section className="modal-overlay task-drawer-overlay">
          <div className="new-project-backdrop" onClick={() => setShowEmployeeDrawer(false)} />
          <article className="task-drawer employee-drawer">
            <header className="new-project-header">
              <h2>Create Employee</h2>
              <p>Login Credentials</p>
            </header>
            <form className="project-form premium-project-form" onSubmit={handleCreateEmployee}>
              <div className="project-form-row full">
                <label>Full Name *</label>
                <input
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Username *</label>
                  <input
                    value={employeeForm.username}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="project-form-row">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="project-form-grid two-col">
                <div className="project-form-row">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={employeeForm.password}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="project-form-row">
                  <label>Role *</label>
                  <select
                    value={employeeForm.role_name}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({ ...prev, role_name: e.target.value }))
                    }
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="project-form-row full">
                <label>Hourly Rate</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={employeeForm.hourly_rate}
                  onChange={(e) =>
                    setEmployeeForm((prev) => ({ ...prev, hourly_rate: e.target.value }))
                  }
                />
              </div>
              <div className="form-actions">
                <button type="submit">Create</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowEmployeeDrawer(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </article>
        </section>
      ) : null}

      {showColumnSidebar ? (
        <section className="modal-overlay task-drawer-overlay">
          <div className="new-project-backdrop" onClick={() => setShowColumnSidebar(false)} />
          <article className="column-sidebar">
            <header className="column-sidebar-header">
              <h2>Add Column</h2>
              <button
                type="button"
                className="column-sidebar-close"
                onClick={() => setShowColumnSidebar(false)}
              >
                x
              </button>
            </header>

            <div className="column-sidebar-search">
              <input
                placeholder="Search"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
              />
            </div>

            <div className="column-sidebar-list">
              {filteredColumnOptions.map((column) => (
                <label className="column-sidebar-item" key={column.key}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => handleToggleColumn(column.key)}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
              {filteredColumnOptions.length === 0 ? (
                <p className="column-sidebar-empty">No columns match your search.</p>
              ) : null}
            </div>

            <div className="column-sidebar-actions">
              <button type="button" className="secondary-btn" onClick={handleResetColumns}>
                Reset
              </button>
              <button type="button" onClick={() => setShowColumnSidebar(false)}>
                Apply
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {selectedDiscussionTask ? (
        <section className="modal-overlay task-drawer-overlay">
          <div className="new-project-backdrop" onClick={() => setSelectedDiscussionTask(null)} />
          <article className="column-sidebar discussion-sidebar">
            <header className="column-sidebar-header">
              <div>
                <h2>{selectedDiscussionTask.taskName}</h2>
                <p className="discussion-subtitle">
                  {selectedDiscussionTask.taskId} · {selectedDiscussionTask.project}
                </p>
              </div>
              <button
                type="button"
                className="column-sidebar-close"
                onClick={() => setSelectedDiscussionTask(null)}
              >
                x
              </button>
            </header>

            <div className="discussion-sidebar-body">
              <section className="discussion-section">
                <h3>Task Discussion</h3>
                <p>
                  Assigned to {selectedDiscussionTask.assignedTo} · Status {selectedDiscussionTask.status}
                </p>
                <form className="discussion-form" onSubmit={handleAddComment}>
                  <textarea
                    className="text-area"
                    value={commentDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCommentDraft(val);
                      if (/@(\w*)$/.test(val)) {
                        setShowMentions(true);
                      } else {
                        setShowMentions(false);
                      }
                    }}
                    placeholder="Add a note, update, or mention context (@username) for the team"
                    required
                  />
                  {showMentions && (
                    <div className="mentions-dropdown" style={{ border: '1px solid #ccc', maxHeight: '100px', overflowY: 'auto', background: '#fff', position: 'absolute', zIndex: 10, width: 'calc(100% - 32px)', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                      {employees.filter(emp => emp.username.toLowerCase().includes((commentDraft.match(/@(\w*)$/)?.[1] || "").toLowerCase())).map(emp => (
                        <div 
                          key={emp.id} 
                          style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }} 
                          onClick={() => {
                            const val = commentDraft.replace(/@(\w*)$/, `@${emp.username} `);
                            setCommentDraft(val);
                            setShowMentions(false);
                          }}
                        >
                          <strong>{emp.name}</strong> (@{emp.username})
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="submit" disabled={!commentDraft.trim()}>
                    Post Comment
                  </button>
                </form>
              </section>

              <section className="discussion-section">
                <h3>Activity Stream</h3>
                <div className="discussion-timeline">
                  {discussionLoading ? <p>Loading activity...</p> : null}
                  {!discussionLoading
                    ? discussionItems.map((item) => (
                        <article
                          key={item.id}
                          className={`discussion-event ${item.action === "task_comment_added" ? "comment" : "system"}`}
                        >
                          <div className="discussion-event-dot" />
                          <div>
                            <h4>{item.Actor?.name || item.Actor?.username || "System"}</h4>
                            <p>{item.message}</p>
                            <span>{new Date(item.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                        </article>
                      ))
                    : null}
                  {!discussionLoading && discussionItems.length === 0 ? <p>No activity yet.</p> : null}
                </div>
              </section>

              <FileAttachments taskId={selectedDiscussionTask.id} />
            </div>
          </article>
        </section>
      ) : null}
    </WorkspaceLayout>
  );
}

export default CreateTask;
