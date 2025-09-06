import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { apiService } from "../services/api";
import { DiscussionThread, Message, User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const messageSchema = yup.object({
  content: yup.string().required("Message content is required"),
});

interface MessageFormData {
  content: string;
}

export const DiscussionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<DiscussionThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: yupResolver(messageSchema),
  });

  const fetchDiscussion = async () => {
    if (!id) return;

    try {
      const discussionData = await apiService.getDiscussionThread(id);
      setDiscussion(discussionData);

      // Check if user has already joined
      const hasJoined =
        discussionData.participants?.some((p: User) => p.id === user?.id) ||
        discussionData.created_by?.id === user?.id;
      setIsJoined(hasJoined);
    } catch (error) {
      console.error("Error fetching discussion:", error);
      toast.error("Failed to load discussion");
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      const messagesData = await apiService.getDiscussionMessages(id);
      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDiscussion(), fetchMessages()]);
      setIsLoading(false);
    };

    if (id) {
      loadData();
    }
  }, [id, user?.id]);

  const handleJoinDiscussion = async () => {
    if (!id) return;

    try {
      await apiService.joinDiscussion(id);
      setIsJoined(true);
      toast.success("Joined discussion successfully!");
      fetchDiscussion(); // Refresh to get updated participants
    } catch (error) {
      console.error("Error joining discussion:", error);
      toast.error("Failed to join discussion");
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!id || !isJoined) return;

    try {
      const newMessage = await apiService.createDiscussionMessage(id, {
        content: data.content,
      });
      setMessages((prev) => [...prev, newMessage]);
      reset();
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Discussion Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The discussion you're looking for doesn't exist or you don't have
          access to it.
        </p>
        <Link
          to="/app/discussions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Discussions
        </Link>
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
      <div className="flex items-center gap-4">
        <Link
          to="/app/discussions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {discussion.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>
                Started by{" "}
                {discussion.created_by?.full_name ||
                  discussion.created_by?.username ||
                  "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {new Date(discussion.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{messages.length} messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">
            {discussion.content || discussion.description}
          </p>
        </div>

        {!isJoined && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 mb-3">
              Join this discussion to participate and send messages.
            </p>
            <button
              onClick={handleJoinDiscussion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join Discussion
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Messages ({messages.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>
                No messages yet.{" "}
                {isJoined
                  ? "Be the first to start the conversation!"
                  : "Join the discussion to see and send messages."}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                    {message.author?.first_name?.charAt(0) ||
                      message.author?.username?.charAt(0) ||
                      "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {message.author?.full_name ||
                          `${message.author?.first_name} ${message.author?.last_name}` ||
                          message.author?.username ||
                          "Unknown User"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(message.created_at)}
                      </span>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        {isJoined && (
          <div className="p-6 border-t border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <textarea
                  {...register("content")}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your message here..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.content.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
};
