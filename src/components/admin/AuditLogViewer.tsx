"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  User,
  Building,
  CreditCard,
  Settings,
  Loader2,
  ChevronDown,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  previousValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface AuditLogsData {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    actions: string[];
    entityTypes: string[];
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <CheckCircle className="h-4 w-4 text-green-600" />,
  UPDATE: <Edit className="h-4 w-4 text-blue-600" />,
  DELETE: <Trash className="h-4 w-4 text-red-600" />,
  VIEW: <Eye className="h-4 w-4 text-gray-600" />,
  LOGIN: <User className="h-4 w-4 text-purple-600" />,
  PAYOUT_APPROVED: <CreditCard className="h-4 w-4 text-green-600" />,
  PAYOUT_COMPLETED: <CheckCircle className="h-4 w-4 text-green-600" />,
  PAYOUT_REJECTED: <AlertCircle className="h-4 w-4 text-red-600" />,
  REVIEW_MODERATED: <AlertCircle className="h-4 w-4 text-orange-600" />,
  USER_BANNED: <AlertCircle className="h-4 w-4 text-red-600" />,
  USER_UNBANNED: <CheckCircle className="h-4 w-4 text-green-600" />,
  ROLE_CHANGED: <Settings className="h-4 w-4 text-purple-600" />,
};

const entityColors: Record<string, string> = {
  PAYOUT: "bg-green-100 text-green-700",
  PAYMENT: "bg-blue-100 text-blue-700",
  BOOKING: "bg-purple-100 text-purple-700",
  VENUE: "bg-orange-100 text-orange-700",
  CATERER: "bg-pink-100 text-pink-700",
  USER: "bg-yellow-100 text-yellow-700",
  REVIEW: "bg-red-100 text-red-700",
  SYSTEM: "bg-gray-100 text-gray-700",
};

export default function AuditLogViewer() {
  const [data, setData] = useState<AuditLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, filters.action, filters.entityType, filters.startDate, filters.endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (filters.action) params.set("action", filters.action);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="">All Actions</option>
              {data?.filters.actions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => {
                setFilters({ ...filters, entityType: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="">All Types</option>
              {data?.filters.entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  action: "",
                  entityType: "",
                  startDate: "",
                  endDate: "",
                  search: "",
                });
                setPage(1);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            <div className="divide-y">
              {data?.logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() =>
                      setExpandedLog(expandedLog === log.id ? null : log.id)
                    }
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {actionIcons[log.action] || (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {formatAction(log.action)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            entityColors[log.entityType] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.entityType}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        by <span className="font-medium">{log.user.name || log.user.email}</span>
                        {log.details?.reason && (
                          <span> — {log.details.reason}</span>
                        )}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{getTimeAgo(log.createdAt)}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        <span className="truncate">ID: {log.entityId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedLog === log.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {expandedLog === log.id && (
                    <div className="mt-4 ml-12 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Full Timestamp</p>
                        <p className="text-sm">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            dateStyle: "full",
                            timeStyle: "medium",
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Entity ID</p>
                        <p className="text-sm font-mono">{log.entityId}</p>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Details</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.previousValue && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Previous Value</p>
                          <pre className="text-xs bg-red-50 p-2 rounded border border-red-100 overflow-x-auto">
                            {JSON.stringify(log.previousValue, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.newValue && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">New Value</p>
                          <pre className="text-xs bg-green-50 p-2 rounded border border-green-100 overflow-x-auto">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.userAgent && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">User Agent</p>
                          <p className="text-xs text-gray-600 truncate">{log.userAgent}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Performed By</p>
                        <p className="text-sm">
                          {log.user.name} ({log.user.email})
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              log.user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.user.role}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total}{" "}
                  logs)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                    }
                    disabled={page === data.pagination.totalPages}
                    className="px-3 py-1 bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {data?.logs.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No audit logs found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
