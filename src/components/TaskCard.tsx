import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface TaskCardProps {
  task: {
    _id: Id<"task">;
    title: string; description: string; priority: number; isCompleted: boolean;
    createdAt: number;
    updatedAt?: number;
  };
  className?: string;
}

export function TaskCard({ task: item, className }: TaskCardProps) {
  const deleteTask = useMutation(api.task.deleteTask);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask({ id: item._id });
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <div>
            <span className="text-sm text-gray-500">Title:</span>
            <span className="font-medium ml-2">{item.title}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Description:</span>
            <span className="font-medium ml-2">{item.description}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Priority:</span>
            <span className="font-medium ml-2">{item.priority}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Iscompleted:</span>
            <span className={`px-2 py-1 text-xs rounded ${item.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {item.isCompleted ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="text-xs text-gray-400 pt-2 border-t">
            Created {new Date(item.createdAt).toLocaleDateString()}
            {item.updatedAt && (
              <span className="ml-2">
                • Updated {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
