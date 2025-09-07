import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { apiService } from "../services/api";
import { Task, User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const taskSchema = yup.object({
  title: yup.string().required("Task title is required"),
  description: yup.string().required("Description is required"),
  status: yup
    .string()
    .oneOf(["todo", "in_progress", "review", "completed", "cancelled"])
    .required(),
  due_date: yup.string().optional().nullable(),
});

interface TaskFormData {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "completed" | "cancelled";
  due_date?: string | null;
}

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any,
  });

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;

      try {
        const taskData = await apiService.getTask(id);
        setTask(taskData);
        reset({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          due_date: taskData.due_date,
        });
      } catch (error) {
        console.error("Error fetching task:", error);
        toast.error("Failed to load task");
        navigate("/app/tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id, navigate, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return;

    try {
      console.log("Submitting task data:", data);

      // Prepare the data, ensuring proper format
      const updateData = {
        title: data.title,
        description: data.description,
        status: data.status,
        due_date: data.due_date || null,
      };

      console.log("Prepared update data:", updateData);
      const updatedTask = await apiService.updateTask(task.id, updateData);
      setTask(updatedTask);
      setIsEditing(false);
      toast.success("Task updated successfully!");
    } catch (error: any) {
      console.error("Task update error:", error);
      console.error("Error response:", error.response?.data);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to update task";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await apiService.deleteTask(task.id);
        toast.success("Task deleted successfully!");
        navigate("/app/tasks");
      } catch (error: any) {
        const message = error.response?.data?.detail || "Failed to delete task";
        toast.error(message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "review":
        return "In Review";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Task Not Found
        </h2>
        <button
          onClick={() => navigate("/app/tasks")}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app/tasks")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === "admin" || task?.assignee?.id === user?.id) && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
          {user?.role === "admin" && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                {...register("title")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  {...register("due_date")}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            {/* Task Header */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {task.title}
              </h2>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    task.status
                  )}`}
                >
                  {getStatusLabel(task.status)}
                </span>
                {task.due_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>

              <div className="space-y-4">
                {task.assignee && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Assignee
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {task.assignee.first_name?.charAt(0) ||
                          task.assignee.username?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {task.assignee.full_name ||
                            `${task.assignee.first_name} ${task.assignee.last_name}` ||
                            task.assignee.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.assignee.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      Created: {new Date(task.created_at).toLocaleDateString()}
                    </p>
                    {task.updated_at !== task.created_at && (
                      <p>
                        Updated:{" "}
                        {new Date(task.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
