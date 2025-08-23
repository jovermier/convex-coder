import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  className?: string;
}

export function TaskList({ className }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  const tasks = useQuery(api.task.listTask, {
    search: search || undefined,
    limit: 50,
  });

  if (tasks === undefined) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Task"}
        </button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {showForm && (
        <div className="mb-6">
          <TaskForm onSuccess={() => setShowForm(false)} />
        </div>
      )}
      
      {(tasks === null) ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Please sign in to view your tasks</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {search ? `No tasks found matching "${search}"` : "No tasks yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((item) => (
            <TaskCard key={item._id} task={item} />
          ))}
        </div>
      )}
    </div>
  );
}
