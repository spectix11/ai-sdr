import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, AlertCircle, User, Building, Calendar } from 'lucide-react';
import { supabase, type Lead } from '../../lib/supabase';
import LeadDetailModal from '../LeadDetailModal';
import { getCurrentStage, getNextStage } from '../../lib/leadUtils';
import UserMenu from '../UserMenu';

export default function AllLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stage: '',
    lead_source: '',
    industry: '',
  });
  const [sortColumn, setSortColumn] = useState<keyof Lead>('last_updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(25);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to format option labels
  const formatOptionLabel = (value: string): string => {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads_pipeline')
        .select('*')
        .order('last_updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const stages = [...new Set(leads.map(lead => lead.stage).filter(Boolean))].sort();
    const sources = [...new Set(leads.map(lead => lead.lead_source).filter(Boolean))].sort();
    const industries = [...new Set(leads.map(lead => lead.industry).filter(Boolean))].sort();

    return { stages, sources, industries };
  }, [leads]);

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const searchMatch = !searchTerm || 
        lead.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Stage filter
      const stageMatch = !filters.stage || lead.stage === filters.stage;

      // Lead source filter
      const sourceMatch = !filters.lead_source || lead.lead_source === filters.lead_source;

      // Industry filter
      const industryMatch = !filters.industry || lead.industry === filters.industry;

      return searchMatch && stageMatch && sourceMatch && industryMatch;
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
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({ stage: '', lead_source: '', industry: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStageColor = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case 'imported': return 'bg-gray-500';
      case 'contacted': return 'bg-blue-500';
      case 'replied': return 'bg-green-500';
      case 'booked': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-8 h-8 text-primary-red animate-spin" />
              <span className="text-dark-text text-lg">Loading leads...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Error Loading Leads</h3>
                <p className="text-sm text-dark-text-muted">{error}</p>
                <button
                  onClick={fetchLeads}
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
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-dark-text">All Leads</h1>
            <div className="flex items-center space-x-3">
              <UserMenu />
              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-dark-elevated hover:bg-primary-red hover:bg-opacity-10 hover:text-primary-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-dark-border"
              >
                <User className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-dark-text-secondary">
            Manage and track all leads in your pipeline. Total: {leads.length} leads
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-sm md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-dark-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text hover:bg-primary-red hover:bg-opacity-10 hover:border-primary-red transition-colors"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Filters</span>
                {(filters.stage || filters.lead_source || filters.industry) && (
                  <span className="w-2 h-2 bg-primary-red rounded-full"></span>
                )}
              </button>
              
              {(searchTerm || filters.stage || filters.lead_source || filters.industry) && (
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-primary-red hover:bg-primary-red hover:bg-opacity-10 rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-dark-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-dark-text-secondary mb-2">Stage</label>
                  <select
                    value={filters.stage}
                    onChange={(e) => handleFilterChange('stage', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">All Stages</option>
                    {filterOptions.stages.map(stage => (
                      <option key={stage} value={stage}>{formatOptionLabel(stage)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-dark-text-secondary mb-2">Lead Source</label>
                  <select
                    value={filters.lead_source}
                    onChange={(e) => handleFilterChange('lead_source', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">All Sources</option>
                    {filterOptions.sources.map(source => (
                      <option key={source} value={source}>{formatOptionLabel(source)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-dark-text-secondary mb-2">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">All Industries</option>
                    {filterOptions.industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-dark-text-secondary text-xs sm:text-sm">
            Showing {indexOfFirstLead + 1}-{Math.min(indexOfLastLead, sortedLeads.length)} of {sortedLeads.length} leads
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Data Table */}
        <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl overflow-hidden">
          {/* Mobile Card View */}
          <div className="block xl:hidden">
            {currentLeads.map((lead) => (
              <div key={lead.id} className="border-b border-dark-border p-3 sm:p-4 hover:bg-dark-elevated transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <button
                    onClick={() => handleLeadClick(lead)}
                    className="text-primary-red hover:text-primary-red-hover font-medium text-left text-sm sm:text-base"
                  >
                    {lead.fullname || 'Unknown Name'}
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${getStageColor(lead.stage)}`}></span>
                    <span className="text-dark-text text-xs sm:text-sm capitalize">{lead.stage || 'Unknown'}</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-dark-text-muted">
                  <p className="truncate">{lead.company_name || 'Not specified'}</p>
                  <p className="truncate">{lead.job_title || 'Not specified'}</p>
                  <div className="space-y-1">
                    <div className="text-primary-red font-medium text-xs sm:text-sm">
                      {getCurrentStage(lead)}
                    </div>
                    <div className="text-dark-text-secondary text-xs">
                      {getNextStage(lead)}
                    </div>
                  </div>
                  <p className="capitalize text-xs">{lead.lead_source || 'Unknown'}</p>
                  <p className="text-xs">{formatDate(lead.last_updated_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-elevated border-b border-dark-border">
                <tr>
                  {[
                    { key: 'fullname', label: 'Name', icon: User },
                    { key: 'company_name', label: 'Company', icon: Building },
                    { key: 'job_title', label: 'Job Title', icon: User },
                    { key: 'stage', label: 'Current Stage', icon: null },
                    { key: 'lead_source', label: 'Source', icon: null },
                    { key: 'last_updated_at', label: 'Last Updated', icon: Calendar },
                  ].map(({ key, label, icon: Icon }) => (
                    <th
                      key={key}
                      className={`px-6 py-4 text-left text-sm font-medium text-dark-text-secondary ${
                        key !== 'stage' ? 'cursor-pointer hover:bg-dark-surface transition-colors' : ''
                      }`}
                      onClick={() => {
                        if (key !== 'stage') {
                          handleSort(key as keyof Lead);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                        <span>{label}</span>
                        {sortColumn === key && key !== 'stage' && (
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
                      <span className="text-primary-red font-medium">
                        {lead.fullname || 'Unknown Name'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-text max-w-xs truncate">
                      {lead.company_name || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 text-dark-text max-w-xs truncate">
                      {lead.job_title || 'Not specified'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-primary-red font-medium text-sm">
                          {getCurrentStage(lead)}
                        </div>
                        <div className="text-dark-text-secondary text-xs">
                          {getNextStage(lead)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-text capitalize">
                      {lead.lead_source || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-dark-text">
                      {formatDate(lead.last_updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentLeads.length === 0 && (
            <div className="text-center py-6 sm:py-8 md:py-12">
              <User className="w-8 h-8 sm:w-12 sm:h-12 text-dark-text-muted mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-dark-text mb-2">No leads found</h3>
              <p className="text-dark-text-muted text-sm">
                {searchTerm || filters.stage || filters.lead_source || filters.industry
                  ? 'Try adjusting your search or filters'
                  : 'No leads have been imported yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-xs sm:text-sm text-dark-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border border-dark-border text-dark-text hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
                className="p-1.5 sm:p-2 rounded-lg border border-dark-border text-dark-text hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Lead Detail Modal */}
        <LeadDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lead={selectedLead}
          onLeadUpdated={fetchLeads}
        />
      </div>
    </div>
  );
}