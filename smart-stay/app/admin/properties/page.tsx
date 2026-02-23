"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/AdminNavbar";
import { Building2, MapPin, Search, Bell, Eye, Star, CircleOff, Ellipsis } from "lucide-react";

interface Property {
  _id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  status?: "active" | "under-review" | "suspended";
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  category?: string;
  images?: string[];
  createdAt?: string;
  hostDetails?: {
    name: string;
    email: string;
  };
}

const PropertiesPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuPopup, setMenuPopup] = useState<{
    propertyId: string;
    top: number;
    left: number;
  } | null>(null);
  const [actionLoadingPropertyId, setActionLoadingPropertyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/admin/all-properties");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        } else {
          setError("Failed to fetch properties");
        }
      } catch (err) {
        setError("Error loading properties");
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchProperties();
    }
  }, [status]);

  useEffect(() => {
    const hideMessage = setTimeout(() => {
      setActionMessage(null);
    }, 3000);

    return () => clearTimeout(hideMessage);
  }, [actionMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-floating-property-menu]") && !target.closest("[data-property-action-trigger]")) {
        setMenuPopup(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPopup(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const normalizedProperties = properties.map((property) => ({
    ...property,
    status: (property.status || "active") as "active" | "under-review" | "suspended",
    rating: typeof property.rating === "number" ? property.rating : 0,
    reviewCount: typeof property.reviewCount === "number" ? property.reviewCount : 0,
    bookingCount: typeof property.bookingCount === "number" ? property.bookingCount : 0,
  }));

  const filteredProperties = normalizedProperties
    .filter((property) => statusFilter === "all" || property.status === statusFilter)
    .filter((property) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return (
        property.title?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.country?.toLowerCase().includes(query) ||
        property.hostDetails?.name?.toLowerCase().includes(query)
      );
    });

  const totalProperties = normalizedProperties.length;
  const activeListings = normalizedProperties.filter((property) => property.status === "active").length;
  const suspendedListings = normalizedProperties.filter((property) => property.status === "suspended").length;
  const ratedProperties = normalizedProperties.filter((property) => property.reviewCount > 0);
  const avgRating = ratedProperties.length
    ? ratedProperties.reduce((sum, property) => sum + property.rating, 0) / ratedProperties.length
    : 0;

  const getStatusBadgeClass = (propertyStatus?: string) => {
    switch (propertyStatus) {
      case "under-review":
        return "bg-amber-50 text-amber-600";
      case "suspended":
        return "bg-rose-50 text-rose-600";
      default:
        return "bg-emerald-50 text-emerald-600";
    }
  };

  const getStatusLabel = (propertyStatus?: string) => {
    switch (propertyStatus) {
      case "under-review":
        return "Under Review";
      case "suspended":
        return "Suspended";
      default:
        return "Active";
    }
  };

  const formatPrice = (price?: number) => {
    return `$${Number(price || 0).toLocaleString()}/night`;
  };

  const formatRating = (rating?: number, reviewCount?: number) => {
    if (!reviewCount) {
      return "No reviews";
    }
    return `${rating?.toFixed(1) || "0.0"} (${reviewCount})`;
  };

  const updatePropertyById = async (
    id: string,
    payload: { status?: "active" | "under-review" | "suspended" }
  ) => {
    setActionLoadingPropertyId(id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({ type: "error", text: data.error || "Action failed" });
        return;
      }

      setProperties((previousProperties) =>
        previousProperties.map((property) =>
          property._id === id
            ? {
                ...property,
                status: data.property?.status ?? property.status,
              }
            : property
        )
      );
      setActionMessage({ type: "success", text: "Property updated successfully" });
      setMenuPopup(null);
    } catch {
      setActionMessage({ type: "error", text: "Network error while updating property" });
    } finally {
      setActionLoadingPropertyId(null);
    }
  };

  const deletePropertyById = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this property?");
    if (!confirmDelete) {
      return;
    }

    setActionLoadingPropertyId(id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/properties/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({ type: "error", text: data.error || "Delete failed" });
        return;
      }

      setProperties((previousProperties) => previousProperties.filter((property) => property._id !== id));
      setActionMessage({ type: "success", text: "Property deleted" });
      setMenuPopup(null);
    } catch {
      setActionMessage({ type: "error", text: "Network error while deleting property" });
    } finally {
      setActionLoadingPropertyId(null);
    }
  };

  const togglePropertyActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    propertyId: string
  ) => {
    const isAlreadyOpen = menuPopup?.propertyId === propertyId;
    if (isAlreadyOpen) {
      setMenuPopup(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 178;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight - 8 : rect.bottom + 8;
    const left = Math.max(16, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16));

    setMenuPopup({ propertyId, top, left });
  };

  const activeMenuProperty = menuPopup
    ? normalizedProperties.find((property) => property._id === menuPopup.propertyId)
    : null;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#f5f7f9]">
        <AdminNavbar />
        <main className="ml-60 flex-1 p-10">
          <div className="text-teal-600 text-xl font-semibold animate-pulse">Loading properties...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7f9]">
      <AdminNavbar />
      <main className="ml-60 flex-1 p-9">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-teal-500">Property Management</h1>
            <p className="mt-2 text-xl text-slate-500">Review and manage all listed properties</p>
          </div>
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-4xl font-bold text-slate-900">{totalProperties}</p>
                  <p className="text-sm font-semibold text-slate-500">Total Properties</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-4xl font-bold text-slate-900">{activeListings}</p>
                  <p className="text-sm font-semibold text-slate-500">Active Listings</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-4xl font-bold text-slate-900">{avgRating ? avgRating.toFixed(1) : "-"}</p>
                  <p className="text-sm font-semibold text-slate-500">Avg Rating</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <CircleOff className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-4xl font-bold text-slate-900">{suspendedListings}</p>
                  <p className="text-sm font-semibold text-slate-500">Suspended</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
        ) : (
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white">
            {actionMessage ? (
              <div className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {actionMessage.text}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-3xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search properties or hosts..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "under-review", label: "Under Review" },
                  { value: "suspended", label: "Suspended" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === tab.value
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="px-4 py-4 text-left font-semibold">Property</th>
                  <th className="px-4 py-4 text-left font-semibold">Host</th>
                  <th className="px-4 py-4 text-left font-semibold">Price</th>
                  <th className="px-4 py-4 text-left font-semibold">Rating</th>
                  <th className="px-4 py-4 text-left font-semibold">Bookings</th>
                  <th className="px-4 py-4 text-left font-semibold">Status</th>
                  <th className="px-4 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No properties found.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property) => (
                    <tr key={property._id} className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {property.images?.[0] ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="h-10 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100">
                              <Building2 className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{property.title}</p>
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {property.city}, {property.country}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{property.hostDetails?.name || "Unknown Host"}</td>
                      <td className="px-4 py-3 font-semibold text-teal-500">
                        {formatPrice(property.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 ${property.reviewCount ? "text-slate-700" : "text-slate-500"}`}>
                          {property.reviewCount ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : null}
                          {formatRating(property.rating, property.reviewCount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{property.bookingCount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(property.status)}`}>
                          {getStatusLabel(property.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                          <button
                            onClick={(event) => togglePropertyActionMenu(event, property._id)}
                            data-property-action-trigger="true"
                            disabled={actionLoadingPropertyId === property._id}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 text-sm text-slate-500">
              Showing {filteredProperties.length} of {normalizedProperties.length} properties
            </div>
          </section>
        )}

        {menuPopup && activeMenuProperty ? (
          <div
            data-floating-property-menu="true"
            className="fixed z-[70] w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl ring-1 ring-slate-100"
            style={{ top: menuPopup.top, left: menuPopup.left }}
          >
            {(activeMenuProperty.status || "active") !== "active" ? (
              <button
                onClick={() => updatePropertyById(activeMenuProperty._id, { status: "active" })}
                disabled={actionLoadingPropertyId === activeMenuProperty._id}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set as Active
              </button>
            ) : null}

            {(activeMenuProperty.status || "active") !== "under-review" ? (
              <button
                onClick={() => updatePropertyById(activeMenuProperty._id, { status: "under-review" })}
                disabled={actionLoadingPropertyId === activeMenuProperty._id}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set Under Review
              </button>
            ) : null}

            {(activeMenuProperty.status || "active") !== "suspended" ? (
              <button
                onClick={() => updatePropertyById(activeMenuProperty._id, { status: "suspended" })}
                disabled={actionLoadingPropertyId === activeMenuProperty._id}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suspend Property
              </button>
            ) : null}

            <button
              onClick={() => deletePropertyById(activeMenuProperty._id)}
              disabled={actionLoadingPropertyId === activeMenuProperty._id}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Property
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default PropertiesPage;
