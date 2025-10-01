import React from 'react';
import { X, User, Building, Mail, Calendar, ExternalLink, MessageSquare, CheckCircle, Clock, Edit, Save, Loader2, AlertCircle } from 'lucide-react';
import { Lead, supabase } from '../lib/supabase';
import { getCurrentStage } from '../lib/leadUtils';
import ConfirmationModal from './ConfirmationModal';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onLeadUpdated?: () => void;
}

export default function LeadDetailModal({ isOpen, onClose, lead, onLeadUpdated }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editableLeadData, setEditableLeadData] = React.useState<Partial<Lead>>({});
  const [showConfirmDiscardModal, setShowConfirmDiscardModal] = React.useState(false);

  // Calculate email sequence progress based on days value
  const sequenceProgress = React.useMemo(() => {
    if (!lead) return { completed: 0, total: 4, percentage: 0, currentStage: 'Day 1', nextStage: 'Day 1 Email' };

    const days = lead.days || 1;
    let completed = Math.min(days, 4);
    let currentStage = `Day ${days}`;
    let nextStage = '';
    
    // Determine next stage based on days
    if (days < 2) {
      nextStage = 'Day 2 Email';
    } else if (days < 3) {
      nextStage = 'Day 3 Email';
    } else if (days < 4) {
      nextStage = 'Day 4 Email';
    } else {
      nextStage = 'Sequence Complete';
    }
    
    const total = 4;
    const percentage = (completed / total) * 100;
    
    return { completed, total, percentage, currentStage, nextStage };
  }, [lead]);

  // Initialize editable data when lead changes
  React.useEffect(() => {
    if (lead) {
      setEditableLeadData({
        fullname: lead.fullname || '',
        email: lead.email || '',
        job_title: lead.job_title || '',
        company_name: lead.company_name || '',
        linkedin_url: lead.linkedin_url || '',
        industry: lead.industry || '',
        company_size: lead.company_size || '',
        company_website: lead.company_website || '',
        username: lead.username || '',
      });
    }
  }, [lead]);

  // Reset states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setIsSaving(false);
      setError(null);
      setShowConfirmDiscardModal(false);
    }
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const hasUnsavedChanges = () => {
    if (!isEditing) return false;
    
    const originalData = {
      fullname: lead?.fullname || '',
      email: lead?.email || '',
      job_title: lead?.job_title || '',
      company_name: lead?.company_name || '',
      linkedin_url: lead?.linkedin_url || '',
      industry: lead?.industry || '',
      company_size: lead?.company_size || '',
      company_website: lead?.company_website || '',
      username: lead?.username || '',
    };

    return JSON.stringify(editableLeadData) !== JSON.stringify(originalData);
  };

  const performDiscardAndClose = () => {
    // Reset to original data and exit edit mode
    handleCancel();
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmDiscardModal(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowConfirmDiscardModal(false);
    performDiscardAndClose();
  };

  const handleCancelDiscard = () => {
    setShowConfirmDiscardModal(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleInputChange = (field: keyof Lead, value: string) => {
    setEditableLeadData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset to original data
    if (lead) {
      setEditableLeadData({
        fullname: lead.fullname || '',
        email: lead.email || '',
        job_title: lead.job_title || '',
        company_name: lead.company_name || '',
        linkedin_url: lead.linkedin_url || '',
        industry: lead.industry || '',
        company_size: lead.company_size || '',
        company_website: lead.company_website || '',
        username: lead.username || '',
      });
    }
  };

  const handleSave = async () => {
    if (!lead) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        ...editableLeadData,
        last_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('leads_pipeline')
        .update(updateData)
        .eq('id', lead.id);

      if (updateError) {
        throw updateError;
      }

      setIsEditing(false);
      
      // Notify parent component to refresh data
      if (onLeadUpdated) {
        onLeadUpdated();
      }

      // Close modal after successful save
      onClose();
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const formatBoolean = (value?: boolean) => {
    return value ? 'Yes' : 'No';
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-surface flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 sm:p-2 bg-primary-red bg-opacity-10 rounded-lg">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-red" />
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-1 sm:space-y-2">
                  <input
                    type="text"
                    value={editableLeadData.fullname || ''}
                    onChange={(e) => handleInputChange('fullname', e.target.value)}
                    className="text-sm sm:text-lg md:text-xl font-semibold bg-dark-elevated border border-dark-border rounded px-2 py-1 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red w-full"
                    placeholder="Full Name"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={editableLeadData.job_title || ''}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="text-xs sm:text-sm md:text-base bg-dark-elevated border border-dark-border rounded px-2 py-1 text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-red flex-1"
                      placeholder="Job Title"
                    />
                    <span className="text-dark-text-secondary text-xs sm:text-sm hidden sm:inline">at</span>
                    <input
                      type="text"
                      value={editableLeadData.company_name || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="text-xs sm:text-sm md:text-base bg-dark-elevated border border-dark-border rounded px-2 py-1 text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-red flex-1"
                      placeholder="Company Name"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-dark-text">
                    {lead.fullname || 'Unknown Name'}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-dark-text-secondary">
                    {lead.job_title} {lead.company_name && `at ${lead.company_name}`}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-elevated rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-red text-white rounded-lg hover:bg-primary-red-hover transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-dark-elevated text-dark-text hover:bg-primary-red hover:bg-opacity-10 hover:text-primary-red rounded-lg transition-colors"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-dark-elevated rounded-lg transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-dark-text-muted" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-text flex items-center space-x-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-red" />
                <span>Contact Information</span>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-dark-text-secondary">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editableLeadData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Email address"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-dark-text-muted flex-shrink-0" />
                      <span className="text-dark-text break-all text-sm sm:text-base">{lead.email}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-dark-text-secondary">LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editableLeadData.linkedin_url || ''}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="LinkedIn URL"
                    />
                  ) : lead.linkedin_url ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-dark-text-muted flex-shrink-0" />
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-red hover:text-primary-red-hover text-sm sm:text-base"
                      >
                        View Profile
                      </a>
                    </div>
                  ) : (
                    <p className="text-dark-text-muted mt-1 text-sm">Not specified</p>
                  )}
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-dark-text-secondary">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableLeadData.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Username"
                    />
                  ) : (
                    <p className="text-dark-text mt-1 text-sm sm:text-base">{lead.username || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-text flex items-center space-x-2">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-primary-red" />
                <span>Company Information</span>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-dark-text-secondary">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableLeadData.company_name || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm sm:text-base bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Company name"
                    />
                  ) : (
                    <p className="text-dark-text mt-1 text-sm sm:text-base">{lead.company_name || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Job Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableLeadData.job_title || ''}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Job title"
                    />
                  ) : (
                    <p className="text-dark-text mt-1">{lead.job_title || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Industry</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableLeadData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Industry"
                    />
                  ) : (
                    <p className="text-dark-text mt-1">{lead.industry || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Company Size</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableLeadData.company_size || ''}
                      onChange={(e) => handleInputChange('company_size', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Company size"
                    />
                  ) : (
                    <p className="text-dark-text mt-1">{lead.company_size || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editableLeadData.company_website || ''}
                      onChange={(e) => handleInputChange('company_website', e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-red"
                      placeholder="Company website"
                    />
                  ) : lead.company_website ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <ExternalLink className="w-4 h-4 text-dark-text-muted" />
                      <a
                        href={lead.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-red hover:text-primary-red-hover"
                      >
                        Visit Website
                      </a>
                    </div>
                  ) : (
                    <p className="text-dark-text-muted mt-1">Not specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="border-t border-dark-border pt-4 sm:pt-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-text flex items-center space-x-2 mb-4">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-red" />
              <span>Campaign Status</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Current Stage</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${getStageColor(lead.stage)}`}></span>
                    <span className="text-dark-text">{getCurrentStage(lead)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Lead Source</label>
                  <p className="text-dark-text mt-1 capitalize">{lead.lead_source || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Campaign ID</label>
                  <p className="text-dark-text mt-1 break-all">{lead.campaign_id || 'Not assigned'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Replied</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {lead.replied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-dark-text-muted" />
                    )}
                    <span className="text-dark-text">{formatBoolean(lead.replied)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Meeting Booked</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {lead.booked ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-dark-text-muted" />
                    )}
                    <span className="text-dark-text">{formatBoolean(lead.booked)}</span>
                  </div>
                </div>
                {lead.booked_at && (
                  <div>
                    <label className="text-sm font-medium text-dark-text-secondary">Booked At</label>
                    <p className="text-dark-text mt-1">{formatDate(lead.booked_at)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Created</label>
                  <p className="text-dark-text mt-1">{formatDate(lead.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Last Updated</label>
                  <p className="text-dark-text mt-1">{formatDate(lead.last_updated_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text-secondary">Days in Pipeline</label>
                  <p className="text-dark-text mt-1">{lead.days || 1} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Sequence Status */}
          <div className="border-t border-dark-border pt-4 sm:pt-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-dark-text flex items-center space-x-2 mb-4">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-red" />
              <span>Email Sequence</span>
            </h3>
            
            {/* Progress Bar */}
            <div className="mb-6 p-4 bg-dark-elevated rounded-lg border border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-dark-text">Sequence Progress</span>
                <span className="text-sm text-dark-text-secondary">
                  Day {lead.days || 1} - {sequenceProgress.currentStage}
                </span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-red to-primary-red-light rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(sequenceProgress.percentage, 2)}%` }}
                >
                  {sequenceProgress.percentage > 15 && (
                    <span className="text-white text-xs font-medium">
                      {Math.round(sequenceProgress.percentage)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-dark-text-muted">
                  Current: {sequenceProgress.currentStage}
                </span>
                <span className="text-xs text-dark-text-muted">
                  Next: {sequenceProgress.nextStage}
                </span>
              </div>
              {sequenceProgress.percentage <= 15 && sequenceProgress.percentage > 0 && (
                <div className="text-right mt-1">
                  <span className="text-xs text-primary-red font-medium">
                    {Math.round(sequenceProgress.percentage)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {[
                { 
                  day: 1, 
                  sent: lead.day_1_sent, 
                  sentAt: lead.day_1_sent_at, 
                  subject: lead.day_1_subject,
                  body: lead.day_1_body
                },
                { 
                  day: 2, 
                  sent: lead.day_2_sent, 
                  sentAt: lead.day_2_sent_at, 
                  subject: lead.day_2_subject,
                  body: lead.day_2_body
                },
                { 
                  day: 3, 
                  sent: lead.day_3_sent, 
                  sentAt: lead.day_3_sent_at, 
                  subject: lead.day_3_subject,
                  body: lead.day_3_body
                },
                { 
                  day: 4, 
                  sent: lead.day_4_sent, 
                  sentAt: lead.day_4_sent_at, 
                  subject: lead.day_4_subject,
                  body: lead.day_4_body
                },
              ].map((email) => (
                <div key={email.day} className="bg-dark-elevated rounded-lg border border-dark-border">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-dark-text">Day {email.day} Email</span>
                        {email.sent ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-dark-text-muted" />
                        )}
                      </div>
                      <span className="text-xs text-dark-text-secondary">
                        {email.sent ? 'Sent' : 'Not Sent'}
                      </span>
                    </div>
                    
                    {email.sentAt && (
                      <p className="text-xs text-dark-text-muted mb-3">
                        {formatDate(email.sentAt)}
                      </p>
                    )}
                    
                    {email.sent && email.subject && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-primary-red hover:text-primary-red-hover font-medium flex items-center space-x-2 list-none">
                          <span className="transform transition-transform group-open:rotate-90">▶</span>
                          <span>View Email Content</span>
                        </summary>
                        <div className="mt-3 p-3 bg-dark-surface rounded border border-dark-border">
                          <div className="mb-3">
                            <label className="text-xs font-medium text-dark-text-secondary uppercase tracking-wide">Subject</label>
                            <p className="text-sm text-dark-text mt-1 font-medium">{email.subject}</p>
                          </div>
                          {email.body && (
                            <div>
                              <label className="text-xs font-medium text-dark-text-secondary uppercase tracking-wide">Body</label>
                              <div 
                                className="text-sm text-dark-text mt-1 leading-relaxed prose prose-sm prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: email.body }}
                              />
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                    
                    {!email.sent && (
                      <p className="text-xs text-dark-text-muted italic">Email not sent yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Unsaved Changes */}
      <ConfirmationModal
        isOpen={showConfirmDiscardModal}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        title="Unsaved Changes"
        message="You have unsaved changes that will be lost if you close this modal. Are you sure you want to discard your changes?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmVariant="danger"
      />
    </div>
  );
}