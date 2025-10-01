import React, { useState } from 'react';
import { Target, Loader2, CheckCircle, AlertCircle, Search, Building, MapPin, User } from 'lucide-react';

export default function LeadGenerationForm() {
  const [formData, setFormData] = useState({
    jobTitle: '',
    companySize: [] as string[],
    keywords: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-1000', label: '201-1000 employees' },
    { value: '1001-5000', label: '1001-5000 employees' },
    { value: '5001-10000', label: '5001-10000 employees' },
    { value: '10001-100000', label: '10001-100000 employees' },
  ];

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySizeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: prev.companySize.includes(value)
        ? prev.companySize.filter(size => size !== value)
        : [...prev.companySize, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.jobTitle.trim()) {
      setError('Job Title is required');
      return;
    }

    if (formData.companySize.length === 0) {
      setError('Please select at least one company size');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const webhookUrl = import.meta.env.VITE_LEAD_GENERATION_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('Lead generation webhook URL is not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: formData.jobTitle.trim(),
          companySize: formData.companySize,
          keywords: formData.keywords.trim(),
          location: formData.location.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setSuccessMessage(
        `Lead generation request submitted successfully! ${
          result.message || 'Your leads will be processed and added to the database shortly.'
        }`
      );
      
      // Clear form on success
      setFormData({
        jobTitle: '',
        companySize: [],
        keywords: '',
        location: '',
      });

    } catch (err) {
      console.error('Error submitting lead generation request:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to submit lead generation request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      jobTitle: '',
      companySize: [],
      keywords: '',
      location: '',
    });
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-0 sm:pt-4 lg:pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-8 h-8 text-primary-red" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-text">Generate Leads</h1>
          </div>
          <p className="text-sm sm:text-base text-dark-text-secondary">
            Define your ideal customer profile to find and import relevant leads using Apollo
          </p>
        </div>

        {/* Form */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Job Title */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-dark-text">
                <User className="w-4 h-4 text-primary-red" />
                <span>Job Title <span className="text-primary-red">*</span></span>
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="Founder, Engineer, Owner"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-dark-text-muted">
                Specify the job titles you want to target (e.g., "CEO", "Marketing Manager", "Software Engineer")
              </p>
            </div>

            {/* Company Size */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-dark-text">
                <Building className="w-4 h-4 text-primary-red" />
                <span>Company Size <span className="text-primary-red">*</span></span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {companySizeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.companySize.includes(option.value)
                        ? 'border-primary-red bg-primary-red bg-opacity-10 text-primary-red'
                        : 'border-dark-border bg-dark-elevated text-dark-text hover:border-primary-red hover:bg-primary-red hover:bg-opacity-5'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.companySize.includes(option.value)}
                      onChange={() => handleCompanySizeChange(option.value)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.companySize.includes(option.value)
                        ? 'border-primary-red bg-primary-red'
                        : 'border-dark-border'
                    }`}>
                      {formData.companySize.includes(option.value) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-dark-text-muted">
                Select one or more company sizes to target. You can choose multiple options.
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-dark-text">
                <Search className="w-4 h-4 text-primary-red" />
                <span>Keywords</span>
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="Keywords relevant to the contact or company"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-dark-text-muted">
                Optional keywords to refine your search (e.g., "SaaS", "AI", "fintech", "remote work")
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-dark-text">
                <MapPin className="w-4 h-4 text-primary-red" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="United States, California, London"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent transition-colors"
                disabled={loading}
              />
              <p className="text-xs text-dark-text-muted">
                Optional location filter (e.g., "United States", "San Francisco", "Remote")
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-dark-border">
              <div className="text-xs text-dark-text-muted">
                <span className="text-primary-red">*</span> Required fields
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-elevated rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Form
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !formData.jobTitle.trim() || formData.companySize.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary-red text-white rounded-lg hover:bg-primary-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-dark-surface"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Leads...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Generate Leads</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Information Section */}
          <div className="mt-8 pt-6 border-t border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text mb-4">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary-red bg-opacity-10 rounded-lg flex items-center justify-center">
                  <span className="text-primary-red font-bold">1</span>
                </div>
                <h4 className="font-medium text-dark-text">Define Criteria</h4>
                <p className="text-dark-text-muted">
                  Fill out the form with your ideal customer profile criteria
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary-red bg-opacity-10 rounded-lg flex items-center justify-center">
                  <span className="text-primary-red font-bold">2</span>
                </div>
                <h4 className="font-medium text-dark-text">Apollo Search</h4>
                <p className="text-dark-text-muted">
                  Our system uses Apollo to find leads matching your criteria
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary-red bg-opacity-10 rounded-lg flex items-center justify-center">
                  <span className="text-primary-red font-bold">3</span>
                </div>
                <h4 className="font-medium text-dark-text">Import Leads</h4>
                <p className="text-dark-text-muted">
                  Found leads are automatically imported into your pipeline
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}