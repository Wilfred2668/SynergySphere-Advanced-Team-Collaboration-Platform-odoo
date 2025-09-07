import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { User } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface DashboardStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  recent_users: User[];
}

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAllUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log("Fetching admin dashboard data...");
      const data = await apiService.getAdminDashboard();
      console.log("Dashboard data received:", data);
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(`Failed to load dashboard data: ${error}`);
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log("Fetching all users...");
      const usersData = await apiService.getAllUsers();
      console.log("Users data received:", usersData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(`Failed to load users: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    console.log("Promoting user to admin:", userId);
    setActionLoading(userId);
    try {
      await apiService.promoteToAdmin(userId);
      await fetchAllUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error("Error promoting user:", error);
      setError("Failed to promote user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    console.log("Demoting user from admin:", userId);
    setActionLoading(userId);
    try {
      await apiService.demoteFromAdmin(userId);
      await fetchAllUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error("Error demoting user:", error);
      setError("Failed to demote user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    console.log("Deactivating user:", userId);
    setActionLoading(userId);
    try {
      await apiService.deactivateUser(userId);
      await fetchAllUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error("Error deactivating user:", error);
      setError("Failed to deactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    console.log("Activating user:", userId);
    setActionLoading(userId);
    try {
      await apiService.activateUser(userId);
      await fetchAllUsers();
      await fetchDashboardData();
    } catch (error) {
      console.error("Error activating user:", error);
      setError("Failed to activate user");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and system settings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.total_users}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.active_users}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Admin Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.admin_users}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              User Management
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage user roles and account status
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {users && users.length > 0 ? (
              users.map((user) => (
                <li key={user.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.first_name?.[0] || ""}
                            {user.last_name?.[0] || ""}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.role !== "admin" ? (
                        <button
                          onClick={() => handlePromoteToAdmin(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading === user.id
                            ? "Loading..."
                            : "Promote to Admin"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDemoteFromAdmin(user.id)}
                          disabled={
                            actionLoading === user.id ||
                            user.id === currentUser.id
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          {actionLoading === user.id
                            ? "Loading..."
                            : "Demote from Admin"}
                        </button>
                      )}
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={
                            actionLoading === user.id ||
                            user.id === currentUser.id
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === user.id
                            ? "Loading..."
                            : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === user.id
                            ? "Loading..."
                            : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No users found
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
