import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, AlertCircle, User, Building, Calendar, TrendingUp, Award } from 'lucide-react';
import { supabase, type Lead } from '../../lib/supabase';
import LeadDetailModal from '../LeadDetailModal';
import UserMenu from '../UserMenu';

export default function BookedMeetings() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    lead_source: '',
  });
  const [sortColumn, setSortColumn] = useState<keyof Lead>('booked_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(25);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingLeads, setUpdatingLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBookedLeads();
  }, []);

  const fetchBookedLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads_pipeline')
        .select('*')
        .eq('booked', true)
        .order('booked_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching booked leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booked leads');
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const industryStats = leads.reduce((acc, lead) => {
      const industry = lead.industry || 'Unknown';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceStats = leads.reduce((acc, lead) => {
      const source = lead.lead_source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const industryData = Object.entries(industryStats)
      .map(([name, count]) => ({ name, count, percentage: (count / leads.length) * 100 }))
      .sort((a, b) => b.count - a.count);

    const sourceData = Object.entries(sourceStats)
      .map(([name, count]) => ({ name, count, percentage: (count / leads.length) * 100 }))
      .sort((a, b) => b.count - a.count);

    return { industryData, sourceData };
  }, [leads]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const industries = [...new Set(leads.map(lead => lead.industry).filter(Boolean))];
    const sources = [...new Set(leads.map(lead => lead.lead_source).filter(Boolean))];

    return { industries, sources };
  }, [leads]);

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const searchMatch = !searchTerm || 
        lead.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Industry filter
      const industryMatch = !filters.industry || lead.industry === filters.industry;

      // Lead source filter
      const sourceMatch = !filters.lead_source || lead.lead_source === filters.lead_source;

      return searchMatch && industryMatch && sourceMatch;
    });
  }, [leads, searchTerm, filters]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredLeads, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / leadsPerPage);
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = sortedLeads.slice(indexOfFirstLead, indexOfLastLead);

  const handleSort = (column: keyof Lead) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ industry: '', lead_source: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const updateBookedStatus = async (leadId: string) => {
    try {
      setUpdatingLeads(prev => new Set(prev).add(leadId));

      const updateData = {
        booked: false,
        booked_at: null,
        last_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('leads_pipeline')
        .update(updateData)
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      // Remove the lead from the current view since it no longer meets the filter criteria
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));

    } catch (err) {
      console.error('Error updating booked status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update booked status');
    } finally {
      setUpdatingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-8 h-8 text-primary-red animate-spin" />
              <span className="text-dark-text text-lg">Loading booked meetings...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Error Loading Booked Meetings</h3>
                <p className="text-sm text-dark-text-muted">{error}</p>
                <button
                  onClick={fetchBookedLeads}
                  className="mt-2 px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-primary-red-hover transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-0 sm:pt-4 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-primary-red" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-text">Booked Meetings</h1>
            </div>
            <div className="flex items-center space-x-3">
              <UserMenu />
              <button
                onClick={fetchBookedLeads}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-dark-elevated hover:bg-primary-red hover:bg-opacity-10 hover:text-primary-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-dark-border"
              >
                <Award className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-dark-text-secondary">
            Celebrate your success! Total meetings booked: {leads.length}
          </p>
        </div>

        {/* Analytics Section */}
        {leads.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Bookings by Industry */}
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary-red" />
                <span>Bookings by Industry</span>
              </h3>
              <div className="space-y-3">
                {analytics.industryData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-3">
                    <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-dark-text-secondary text-right">
                      {item.name}
                    </div>
                    <div className="flex-1 bg-dark-elevated rounded-full h-6 sm:h-8 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-red to-primary-red-light rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 sm:pr-3"
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      >
                        <span className="text-white text-xs sm:text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 sm:w-16 text-xs sm:text-sm text-dark-text-muted text-right">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings by Lead Source */}
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary-red" />
                <span>Bookings by Lead Source</span>
              </h3>
              <div className="space-y-3">
                {analytics.sourceData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-3">
                    <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-dark-text-secondary text-right capitalize">
                      {item.name}
                    </div>
                    <div className="flex-1 bg-dark-elevated rounded-full h-6 sm:h-8 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-red to-primary-red-light rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 sm:pr-3"
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      >
                        <span className="text-white text-xs sm:text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 sm:w-16 text-xs sm:text-sm text-dark-text-muted text-right">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-text-muted" />
              <input
                type="text"
                placeholder="Search booked meetings..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-dark-text hover:bg-primary-red hover:bg-opacity-10 hover:border-primary-red transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {(filters.industry || filters.lead_source) && (
                  <span className="w-2 h-2 bg-primary-red rounded-full"></span>
                )}
              </button>
              
              {(searchTerm || filters.industry || filters.lead_source) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-primary-red hover:bg-primary-red hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-dark-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">All Industries</option>
                    {filterOptions.industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">Lead Source</label>
                  <select
                    value={filters.lead_source}
                    onChange={(e) => handleFilterChange('lead_source', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">All Sources</option>
                    {filterOptions.sources.map(source => (
                      <option key={source} value={source} className="capitalize">{source}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-dark-text-secondary text-sm sm:text-base">
            Showing {indexOfFirstLead + 1}-{Math.min(indexOfLastLead, sortedLeads.length)} of {sortedLeads.length} booked meetings
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Data Table */}
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {currentLeads.map((lead) => (
              <div key={lead.id} className="border-b border-dark-border p-4 hover:bg-dark-elevated transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => handleLeadClick(lead)}
                    className="text-primary-red hover:text-primary-red-hover font-medium text-left"
                  >
                    {lead.fullname || 'Unknown Name'}
                  </button>
                  <div className="flex items-center space-x-1 text-green-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Booked</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-dark-text-muted">
                  <p>{lead.company_name || 'Not specified'}</p>
                  <p>{lead.industry || 'Not specified'}</p>
                  <p className="capitalize">{lead.lead_source || 'Unknown'}</p>
                  <p className="text-dark-text-secondary">{formatDateTime(lead.booked_at)}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                    <span className="text-xs text-dark-text-secondary">Booked:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBookedStatus(lead.id);
                      }}
                      disabled={updatingLeads.has(lead.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-dark-surface ${
                        updatingLeads.has(lead.id) ? 'opacity-50 cursor-not-allowed bg-primary-red' : 'cursor-pointer bg-primary-red'
                      }`}
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-elevated border-b border-dark-border">
                <tr>
                  {[
                    { key: 'fullname', label: 'Name', icon: User },
                    { key: 'company_name', label: 'Company', icon: Building },
                    { key: 'industry', label: 'Industry', icon: null },
                    { key: 'lead_source', label: 'Lead Source', icon: null },
                    { key: 'booked_at', label: 'Booked At', icon: Calendar },
                    { key: 'booked_toggle', label: 'Booked', icon: null },
                  ].map(({ key, label, icon: Icon }) => (
                    <th
                      key={key}
                      className={`px-6 py-4 text-left text-sm font-medium text-dark-text-secondary ${
                        key !== 'booked_toggle' ? 'cursor-pointer hover:bg-dark-surface transition-colors' : ''
                      }`}
                      onClick={() => {
                        if (key !== 'booked_toggle') {
                          handleSort(key as keyof Lead);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{label}</span>
                        {sortColumn === key && key !== 'booked_toggle' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 text-primary-red" /> : 
                            <ChevronDown className="w-4 h-4 text-primary-red" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {currentLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-dark-elevated transition-colors cursor-pointer"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-primary-red font-medium">
                          {lead.fullname || 'Unknown Name'}
                        </span>
                        <Calendar className="w-4 h-4 text-green-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-text">
                      {lead.company_name || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 text-dark-text">
                      {lead.industry || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 text-dark-text capitalize">
                      {lead.lead_source || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-dark-text">
                      {formatDateTime(lead.booked_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBookedStatus(lead.id);
                        }}
                        disabled={updatingLeads.has(lead.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-dark-surface ${
                          updatingLeads.has(lead.id) ? 'opacity-50 cursor-not-allowed bg-primary-red' : 'cursor-pointer bg-primary-red'
                        }`}
                      >
                        {updatingLeads.has(lead.id) ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" />
                        ) : (
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentLeads.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Award className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-text mb-2">No booked meetings found</h3>
              <p className="text-dark-text-muted">
                {searchTerm || filters.industry || filters.lead_source
                  ? 'Try adjusting your search or filters'
                  : 'No meetings have been booked yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-dark-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-border text-dark-text hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 2, currentPage - 1)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-red text-white'
                          : 'text-dark-text hover:bg-dark-elevated border border-dark-border'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-dark-border text-dark-text hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Lead Detail Modal */}
        <LeadDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lead={selectedLead}
          onLeadUpdated={fetchBookedLeads}
        />
      </div>
    </div>
  );
}