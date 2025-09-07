import React from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { apiService } from "../services/api";
import { User, Task } from "../types";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const taskSchema = yup.object({
  title: yup.string().required("Task title is required"),
  description: yup.string().required("Description is required"),
  assignee: yup.string().optional().nullable(),
  due_date: yup.string().optional().nullable(),
  status: yup
    .string()
    .oneOf(["todo", "in_progress", "review", "completed", "cancelled"])
    .required(),
});

interface TaskFormData {
  title: string;
  description: string;
  assignee?: string | null;
  due_date?: string | null;
  status: "todo" | "in_progress" | "review" | "completed" | "cancelled";
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectMembers: User[];
  task?: Task | null;
  onTaskSaved: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectMembers,
  task,
  onTaskSaved,
}) => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any,
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignee: task?.assignee?.id || "",
      due_date: task?.due_date || "",
      status: task?.status || "todo",
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description,
        project: projectId,
        due_date: data.due_date || null,
        status: data.status,
      };

      if (task) {
        await apiService.updateTask(task.id, taskData as any);
        toast.success("Task updated successfully!");
      } else {
        await apiService.createTask(taskData as any);
        toast.success("Task created successfully!");
      }

      onTaskSaved();
      onClose();
      reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || "Failed to save task";
      toast.error(message);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title
            </label>
            <input
              {...register("title")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title"
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
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <select
              {...register("assignee")}
              disabled={user?.role !== "admin"}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                user?.role !== "admin" ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Select assignee (optional)</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name ||
                    `${member.first_name} ${member.last_name}` ||
                    member.username}
                </option>
              ))}
            </select>
            {user?.role !== "admin" && (
              <p className="text-sm text-gray-500 mt-1">
                Only admins can assign tasks
              </p>
            )}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : task
                ? "Update Task"
                : "Create Task"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
