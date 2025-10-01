import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, AlertCircle, MessageSquare, User, Building, Mail, Calendar } from 'lucide-react';
import { supabase, type Lead } from '../../lib/supabase';
import LeadDetailModal from '../LeadDetailModal';
import UserMenu from '../UserMenu';

export default function RepliesEngagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    lead_source: '',
    industry: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(20);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingLeads, setUpdatingLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRepliedLeads();
  }, []);

  const fetchRepliedLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads_pipeline')
        .select('*')
        .eq('replied', true)
        .eq('booked', false)
        .order('last_updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching replied leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch replied leads');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const sources = [...new Set(leads.map(lead => lead.lead_source).filter(Boolean))];
    const industries = [...new Set(leads.map(lead => lead.industry).filter(Boolean))];

    return { sources, industries };
  }, [leads]);

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const searchMatch = !searchTerm || 
        lead.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Lead source filter
      const sourceMatch = !filters.lead_source || lead.lead_source === filters.lead_source;

      // Industry filter
      const industryMatch = !filters.industry || lead.industry === filters.industry;

      return searchMatch && sourceMatch && industryMatch;
    });
  }, [leads, searchTerm, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ lead_source: '', industry: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getLastEmailSubject = (lead: Lead): string => {
    if (lead.day_4_sent && lead.day_4_subject) return lead.day_4_subject;
    if (lead.day_3_sent && lead.day_3_subject) return lead.day_3_subject;
    if (lead.day_2_sent && lead.day_2_subject) return lead.day_2_subject;
    if (lead.day_1_sent && lead.day_1_subject) return lead.day_1_subject;
    return 'No subject available';
  };

  const updateLeadStatus = async (leadId: string, field: 'replied' | 'booked', value: boolean) => {
    try {
      setUpdatingLeads(prev => new Set(prev).add(leadId));

      const updateData: any = {
        [field]: value,
        last_updated_at: new Date().toISOString(),
      };

      if (field === 'booked' && value) {
        updateData.booked_at = new Date().toISOString();
      }

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
      console.error(`Error updating ${field}:`, err);
      setError(err instanceof Error ? err.message : `Failed to update ${field}`);
    } finally {
      setUpdatingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-8 h-8 text-primary-red animate-spin" />
              <span className="text-dark-text text-lg">Loading replies...</span>
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
                <h3 className="text-lg font-semibold">Error Loading Replies</h3>
                <p className="text-sm text-dark-text-muted">{error}</p>
                <button
                  onClick={fetchRepliedLeads}
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-text">Replies & Engagement</h1>
            <div className="flex items-center space-x-3">
              <UserMenu />
              <button
                onClick={fetchRepliedLeads}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-dark-elevated hover:bg-primary-red hover:bg-opacity-10 hover:text-primary-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-dark-border"
              >
                <MessageSquare className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-dark-text-secondary">
            Manage leads who have replied but haven't booked meetings yet. Total requiring attention: {leads.length} leads
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-text-muted" />
              <input
                type="text"
                placeholder="Search replied leads..."
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
                {(filters.lead_source || filters.industry) && (
                  <span className="w-2 h-2 bg-primary-red rounded-full"></span>
                )}
              </button>
              
              {(searchTerm || filters.lead_source || filters.industry) && (
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
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-dark-text-secondary text-sm sm:text-base">
            Showing {indexOfFirstLead + 1}-{Math.min(indexOfLastLead, filteredLeads.length)} of {filteredLeads.length} replied leads
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Card Layout */}
        <div className="space-y-4">
          {currentLeads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 hover:bg-dark-elevated transition-colors cursor-pointer"
              onClick={() => handleLeadClick(lead)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Lead Information */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-primary-red hover:text-primary-red-hover font-semibold text-lg">
                        {lead.fullname || 'Unknown Name'}
                      </h3>
                      <div className="flex items-center space-x-2 text-dark-text-secondary">
                        <Building className="w-4 h-4" />
                        <span>{lead.company_name || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="text-sm text-dark-text-muted mt-2 sm:mt-0 sm:text-right flex-shrink-0">
                      Last updated: {formatDate(lead.last_updated_at)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-dark-text">
                      <User className="w-4 h-4 text-dark-text-muted" />
                      <span className="text-sm">{lead.job_title || 'Not specified'}</span>
                    </div>
                    
                    <div className="flex items-start space-x-2 text-dark-text">
                      <Mail className="w-4 h-4 text-dark-text-muted mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-dark-text-secondary">Last email subject:</p>
                        <p className="text-sm font-medium break-words">{getLastEmailSubject(lead)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between lg:justify-end space-x-4 pt-4 lg:pt-0 border-t border-dark-border lg:border-t-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-dark-text-secondary">Replied:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLeadStatus(lead.id, 'replied', false);
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
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-dark-text-secondary">Book Meeting:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLeadStatus(lead.id, 'booked', true);
                      }}
                      disabled={updatingLeads.has(lead.id)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-dark-surface ${
                        updatingLeads.has(lead.id) 
                          ? 'opacity-50 cursor-not-allowed bg-dark-border' 
                          : 'cursor-pointer bg-dark-border hover:bg-primary-red'
                      }`}
                    >
                      {updatingLeads.has(lead.id) ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin mx-auto" />
                      ) : (
                        <>
                          <span className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform translate-x-1" />
                          <Calendar className="absolute right-2 w-3 h-3 text-white" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentLeads.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <MessageSquare className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">No replies requiring attention</h3>
            <p className="text-dark-text-muted">
              {searchTerm || filters.lead_source || filters.industry
                ? 'Try adjusting your search or filters'
                : 'All replied leads have been processed or no leads have replied yet'
              }
            </p>
          </div>
        )}

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
          onLeadUpdated={fetchRepliedLeads}
        />
      </div>
    </div>
  );
}