import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownWideNarrow, Bell, CalendarDays, Check, CheckCheck, ChevronDown,
  Circle, CircleCheck, Clock3, Command, Filter, Flame, FolderKanban, LayoutDashboard,
  ListTodo, LoaderCircle, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles,
  Target, Trash2, TrendingUp, X, Zap
} from "lucide-react";

const API = "http://localhost:5000/api";
const categories = ["Personal", "Work", "Study", "Health", "Other"];
const priorities = ["Low", "Medium", "High"];
const priorityStyle = { Low: "bg-slate-100 text-slate-500", Medium: "bg-amber-50 text-amber-700", High: "bg-rose-50 text-rose-600" };
const categoryStyle = { Personal: "bg-violet-50 text-violet-700", Work: "bg-blue-50 text-blue-700", Study: "bg-amber-50 text-amber-700", Health: "bg-emerald-50 text-emerald-700", Other: "bg-slate-100 text-slate-600" };
const dateLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const todayText = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All tasks");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/tasks`);
      if (!response.ok) throw new Error("Could not load tasks");
      const result = await response.json();
      setTasks(result.data || []);
      setError("");
    } catch {
      setError("Can't connect to the API. Make sure MongoDB and the backend are running.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) === today).length;
    return { total: tasks.length, completed, active: tasks.length - completed, dueToday, progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
  }, [tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const statusMatch = filter === "All tasks" || (filter === "In progress" && !task.completed) || (filter === "Completed" && task.completed);
    const categoryMatch = category === "All" || task.category === category;
    const searchMatch = `${task.title} ${task.description || ""}`.toLowerCase().includes(search.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  }), [tasks, filter, category, search]);

  async function saveTask(form) {
    try {
      const url = editing ? `${API}/tasks/${editing._id}` : `${API}/tasks`;
      const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save task");
      if (editing) setTasks((old) => old.map((t) => t._id === editing._id ? result.data : t));
      else setTasks((old) => [result.data, ...old]);
      setModal(false); setEditing(null); notify(editing ? "Task updated successfully" : "Your new task is on the list");
    } catch (e) { notify(e.message || "Something went wrong"); }
  }

  async function toggleTask(task) {
    try {
      const response = await fetch(`${API}/tasks/${task._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setTasks((old) => old.map((t) => t._id === task._id ? result.data : t));
      notify(task.completed ? "Task moved back to active" : "Nice work! Task completed");
    } catch { notify("Couldn't update task. Try again."); }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      const response = await fetch(`${API}/tasks/${task._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTasks((old) => old.filter((t) => t._id !== task._id));
      notify("Task deleted");
    } catch { notify("Couldn't delete task. Try again."); }
  }

  async function clearCompleted() {
    if (!stats.completed || !window.confirm("Delete all completed tasks?")) return;
    try {
      const response = await fetch(`${API}/tasks`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTasks((old) => old.filter((t) => !t.completed));
      notify("Completed tasks cleared");
    } catch { notify("Couldn't clear completed tasks"); }
  }

  const openNew = () => { setEditing(null); setModal(true); };
  const openEdit = (task) => { setEditing(task); setModal(true); };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#252840]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-[#eceef5] bg-white px-5 py-7 transition-transform duration-300 lg:static lg:translate-x-0`}>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-200"><CheckCheck size={21} strokeWidth={2.5}/></div>
            <div><div className="font-display text-[20px] font-extrabold tracking-[-.7px]">taskflow<span className="text-violet-600">.</span></div><div className="mt-[-2px] text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">Make today count</div></div>
            <button className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setMobileNav(false)}><X size={18}/></button>
          </div>

          <button onClick={openNew} className="mt-9 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6658e8] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200/70 transition hover:-translate-y-0.5 hover:bg-[#5749d5]"><Plus size={18} strokeWidth={2.5}/> Create new task <span className="ml-auto rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-medium">⌘ K</span></button>

          <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-slate-400">Workspace</div>
          <nav className="mt-3 space-y-1">
            <NavItem icon={<LayoutDashboard size={18}/>} label="Overview" active onClick={() => {setFilter("All tasks");setCategory("All");setMobileNav(false);}}/>
            <NavItem icon={<ListTodo size={18}/>} label="All tasks" count={stats.total} onClick={() => {setFilter("All tasks");setCategory("All");setMobileNav(false);}}/>
            <NavItem icon={<Clock3 size={18}/>} label="In progress" count={stats.active} onClick={() => {setFilter("In progress");setCategory("All");setMobileNav(false);}}/>
            <NavItem icon={<CircleCheck size={18}/>} label="Completed" count={stats.completed} onClick={() => {setFilter("Completed");setCategory("All");setMobileNav(false);}}/>
          </nav>

          <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-slate-400">Categories</div>
          <nav className="mt-3 space-y-1">
            {categories.map((item, i) => <button key={item} onClick={() => {setCategory(item);setFilter("All tasks");setMobileNav(false);}} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${category === item ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><span className={`h-2.5 w-2.5 rounded-[4px] ${["bg-violet-400","bg-blue-400","bg-amber-400","bg-emerald-400","bg-slate-400"][i]}`}/>{item}<ChevronDown className="ml-auto rotate-[-90deg] opacity-0 transition group-hover:opacity-40" size={14}/></button>)}
          </nav>

          <div className="mt-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0edff] via-[#f6f3ff] to-[#e8e9ff] p-4">
              <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full border-[12px] border-white/40"/><div className="absolute -right-1 top-5 h-8 w-8 rounded-full bg-violet-200/50 blur-sm"/>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm"><Sparkles size={16}/></div>
              <div className="relative mt-3 font-display text-sm font-extrabold">Small steps, big wins.</div>
              <p className="relative mt-1 text-[11px] leading-5 text-slate-500">Every task you finish is progress worth celebrating.</p>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-violet-500 transition-all" style={{width:`${stats.progress}%`}}/></div>
              <div className="relative mt-1.5 flex justify-between text-[10px] font-semibold text-violet-700"><span>Your progress</span><span>{stats.progress}%</span></div>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 px-1 pt-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-rose-300 text-xs font-extrabold text-rose-800">Y</div>
              <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-700">Your workspace</div><div className="mt-0.5 text-[10px] text-slate-400">Personal plan</div></div>
              <button title="Settings" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Settings2 size={17}/></button>
            </div>
          </div>
        </aside>

        {mobileNav && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setMobileNav(false)}/>}

        <main className="min-w-0 flex-1 px-5 pb-12 pt-5 sm:px-8 lg:px-11 lg:pt-8 xl:px-14">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 lg:hidden" onClick={() => setMobileNav(true)}><Menu size={18}/></button>
              <div><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> YOUR PERSONAL SPACE</div><p className="mt-1 text-xs text-slate-400">{todayText}</p></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-400 sm:flex"><Command size={13}/><span>Stay focused</span></div>
              <button aria-label="Notifications" onClick={() => notify("You're all caught up!")} className="relative rounded-xl border border-slate-200/80 bg-white p-2.5 text-slate-500 transition hover:border-violet-200 hover:text-violet-600"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400 ring-2 ring-white"/></button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-rose-300 text-xs font-extrabold text-rose-800">Y</div>
            </div>
          </header>

          <section className="mt-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-600"><Sparkles size={14}/> YOUR DAY, YOUR WAY</div><h1 className="font-display text-[34px] font-extrabold leading-tight tracking-[-1.6px] text-[#252840] sm:text-[42px]">Let's get things <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">done.</span></h1><p className="mt-2 text-sm text-slate-500">A clear mind starts with a clear plan. You've got this.</p></div>
            <button onClick={openNew} className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#6658e8] px-4 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#5749d5] sm:self-auto"><Plus size={17}/> Add a task</button>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard icon={<ListTodo size={18}/>} iconClass="bg-violet-50 text-violet-600" label="Total tasks" value={stats.total} note="All your to-dos" />
            <StatCard icon={<Activity size={18}/>} iconClass="bg-blue-50 text-blue-600" label="In progress" value={stats.active} note="One step at a time" />
            <StatCard icon={<CheckCheck size={18}/>} iconClass="bg-emerald-50 text-emerald-600" label="Completed" value={stats.completed} note={`${stats.progress}% completion rate`} />
            <StatCard icon={<Flame size={18}/>} iconClass="bg-orange-50 text-orange-600" label="Due today" value={stats.dueToday} note="Make today count" />
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-[#eceef5] bg-white shadow-[0_3px_16px_rgba(37,40,64,0.025)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 md:flex-row md:items-center md:justify-between">
              <div><div className="flex items-center gap-2"><h2 className="font-display text-lg font-extrabold tracking-[-.4px]">{category !== "All" ? category : filter}</h2><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{visibleTasks.length}</span></div><p className="mt-1 text-xs text-slate-400">Keep your priorities close and your progress closer.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1 sm:w-[210px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full rounded-xl border border-slate-200 bg-[#fbfcfe] py-2.5 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"/></div>
                <div className="relative"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-[#fbfcfe] py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none focus:border-violet-300 sm:w-auto"><option>All tasks</option><option>In progress</option><option>Completed</option></select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/></div>
              </div>
            </div>

            <div className="hidden grid-cols-[minmax(0,1fr)_110px_100px_95px_34px] items-center gap-4 bg-[#fafbfe] px-7 py-3 text-[10px] font-bold uppercase tracking-[1.2px] text-slate-400 md:grid"><span>Task details</span><span>Category</span><span>Priority</span><span>Due date</span><span/></div>

            {error && <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs leading-5 text-rose-700 sm:mx-7"><Activity size={16} className="mt-0.5 shrink-0"/><div className="flex-1">{error}<button onClick={loadTasks} className="ml-2 font-bold underline">Retry</button></div></div>}

            {loading ? <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-400"><LoaderCircle size={19} className="animate-spin text-violet-500"/> Getting your tasks ready...</div>
              : visibleTasks.length === 0 ? <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500"><Target size={25}/></div><h3 className="mt-4 font-display text-base font-extrabold">{search ? "No matching tasks" : filter === "Completed" ? "Nothing completed yet" : "A fresh start ✨"}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">{search ? "Try another search term." : "Add a task to turn your plans into progress. Your next win is one click away."}</p>{!search && <button onClick={openNew} className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-violet-700"><Plus size={15}/> Create your first task</button>}</div>
              : <div className="divide-y divide-slate-100">
                {visibleTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={() => toggleTask(task)} onEdit={() => openEdit(task)} onDelete={() => deleteTask(task)}/>)}
              </div>}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fdfdff] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-[11px] text-slate-400">Showing <span className="font-bold text-slate-600">{visibleTasks.length}</span> of <span className="font-bold text-slate-600">{stats.total}</span> tasks</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-full bg-violet-400"/>{stats.active} active</span><span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-400"/>{stats.completed} done</span>{stats.completed > 0 && <button onClick={clearCompleted} className="text-[10px] font-bold text-rose-400 transition hover:text-rose-600">Clear completed</button>}</div></div>
          </section>

          <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-100/80 bg-gradient-to-r from-[#f1efff] via-[#f8f7ff] to-[#eef3ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><Zap size={17}/></div><div><p className="text-xs font-bold text-slate-700">A little progress adds up.</p><p className="mt-0.5 text-[11px] text-slate-500">You've completed {stats.completed} {stats.completed === 1 ? "task" : "tasks"} so far. Keep your momentum going!</p></div></div><div className="flex items-center gap-2 text-[11px] font-bold text-violet-600"><TrendingUp size={15}/> {stats.progress}% complete</div></section>
          <footer className="mt-7 flex flex-col items-center justify-between gap-2 text-[10px] text-slate-400 sm:flex-row"><span>© {new Date().getFullYear()} TaskFlow. Made for your best days.</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Your tasks, your pace.</span></footer>
        </main>
      </div>

      {modal && <TaskModal task={editing} onClose={() => {setModal(false);setEditing(null);}} onSave={saveTask}/>}
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#252840] px-4 py-3 text-xs font-semibold text-white shadow-xl"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[#163c34]"><Check size={12}/></span>{toast}</div>}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${active ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><span className={active ? "text-violet-600" : "text-slate-400"}>{icon}</span>{label}{count !== undefined && <span className={`ml-auto rounded-md px-2 py-0.5 text-[10px] ${active ? "bg-white text-violet-600" : "bg-slate-100 text-slate-400"}`}>{count}</span>}</button>;
}

function StatCard({ icon, iconClass, label, value, note }) {
  return <div className="rounded-2xl border border-[#eceef5] bg-white p-4 shadow-[0_3px_16px_rgba(37,40,64,0.02)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-center justify-between gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div><MoreHorizontal size={18} className="text-slate-300"/></div><div className="mt-4 flex items-end gap-2"><span className="font-display text-[27px] font-extrabold tracking-[-1px] text-[#252840]">{value}</span><span className="mb-1 text-[10px] font-medium text-slate-400">{label}</span></div><p className="mt-1 text-[10px] text-slate-400">{note}</p></div>;
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const overdue = task.dueDate && !task.completed && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  return <div className={`task-enter group grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-[#fcfcff] sm:px-7 md:grid-cols-[minmax(0,1fr)_110px_100px_95px_34px] md:items-center md:gap-4 ${task.completed ? "bg-slate-50/40" : ""}`}>
    <div className="flex min-w-0 items-start gap-3"><button aria-label={task.completed ? "Mark task active" : "Complete task"} onClick={onToggle} className={`mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border transition ${task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500 hover:text-violet-500"}`}>{task.completed ? <Check size={12} strokeWidth={3}/> : <Check size={12}/>}</button><div className="min-w-0 flex-1"><button onClick={onEdit} className={`block max-w-full truncate text-left text-[13px] font-bold transition hover:text-violet-700 ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.title}</button>{task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{task.description}</p>}<div className="mt-2 flex flex-wrap items-center gap-2 md:hidden"><span className={`rounded-md px-2 py-1 text-[9px] font-bold ${categoryStyle[task.category]}`}>{task.category}</span><span className={`rounded-md px-2 py-1 text-[9px] font-bold ${priorityStyle[task.priority]}`}>{task.priority} priority</span>{task.dueDate && <span className={`flex items-center gap-1 text-[10px] ${overdue ? "font-bold text-rose-500" : "text-slate-400"}`}><CalendarDays size={11}/>{dateLabel(task.dueDate)}</span>}</div></div></div>
    <div className="hidden md:block"><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${categoryStyle[task.category]}`}>{task.category}</span></div>
    <div className="hidden md:block"><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${priorityStyle[task.priority]}`}><span className="mr-1">●</span>{task.priority}</span></div>
    <div className={`hidden items-center gap-1.5 text-[11px] md:flex ${overdue ? "font-bold text-rose-500" : "text-slate-400"}`}>{task.dueDate ? <><CalendarDays size={13}/>{dateLabel(task.dueDate)}</> : <span className="pl-1">No date</span>}</div>
    <div className="flex items-center justify-end gap-1 md:justify-start"><button title="Edit task" onClick={onEdit} className="rounded-lg p-2 text-slate-300 opacity-100 transition hover:bg-violet-50 hover:text-violet-600 md:opacity-0 md:group-hover:opacity-100"><Settings2 size={15}/></button><button title="Delete task" onClick={onDelete} className="rounded-lg p-2 text-slate-300 opacity-100 transition hover:bg-rose-50 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100"><Trash2 size={15}/></button></div>
  </div>;
}

function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [category, setCategory] = useState(task?.category || "Personal");
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : "");
  const [submitting, setSubmitting] = useState(false);
  async function submit(e) { e.preventDefault(); if (!title.trim()) return; setSubmitting(true); await onSave({ title: title.trim(), description: description.trim(), priority, category, dueDate: dueDate || null }); setSubmitting(false); }
  useEffect(() => { const handle = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle); }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[3px]" onMouseDown={(e) => {if(e.target === e.currentTarget) onClose();}}><form onSubmit={submit} className="my-auto w-full max-w-[500px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><div className="flex items-center gap-2 text-xs font-bold text-violet-600"><Sparkles size={14}/>{task ? "MAKE IT BETTER" : "ONE STEP AT A TIME"}</div><h2 className="mt-2 font-display text-xl font-extrabold tracking-[-.6px]">{task ? "Edit your task" : "Create a new task"}</h2><p className="mt-1 text-xs text-slate-400">{task ? "A few tweaks can make all the difference." : "What's one thing you'd like to get done?"}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
    <div className="space-y-4 px-6 py-5"><Field label="Task title *"><input autoFocus required maxLength={180} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Finish project proposal" className="field-input"/></Field><Field label="Description"><textarea maxLength={1000} rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Add a little more detail (optional)" className="field-input resize-none"/></Field>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Category"><select value={category} onChange={(e)=>setCategory(e.target.value)} className="field-input">{categories.map((c)=><option key={c}>{c}</option>)}</select></Field><Field label="Priority"><select value={priority} onChange={(e)=>setPriority(e.target.value)} className="field-input">{priorities.map((p)=><option key={p}>{p}</option>)}</select></Field></div>
    <Field label="Due date"><input type="date" min="2000-01-01" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} className="field-input"/></Field></div>
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4"><span className="text-[10px] text-slate-400">You can edit this anytime.</span><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button><button disabled={submitting || !title.trim()} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting && <LoaderCircle size={14} className="animate-spin"/>}{task ? "Save changes" : "Create task"} <ArrowDownWideNarrow size={14} className="rotate-[-90deg]"/></button></div></div>
  </form></div>;
}
function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-600">{label}<div className="mt-2">{children}</div></label>; }

export default App;
