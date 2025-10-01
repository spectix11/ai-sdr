import React from 'react';
import Dashboard from './views/Dashboard';
import LeadGenerationForm from './views/LeadGenerationForm';
import AllLeads from './views/AllLeads';
import ActiveCampaigns from './views/ActiveCampaigns';
import RepliesEngagement from './views/RepliesEngagement';
import BookedMeetings from './views/BookedMeetings';

interface MainContentProps {
  activeView: string;
}

export default function MainContent({ activeView }: MainContentProps) {
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'lead-generation':
        return <LeadGenerationForm />;
      case 'leads':
        return <AllLeads />;
      case 'campaigns':
        return <ActiveCampaigns />;
      case 'replies':
        return <RepliesEngagement />;
      case 'meetings':
        return <BookedMeetings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex-1 bg-dark-bg overflow-auto">
      {renderView()}
    </div>
  );
}

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-dark-text mb-2">{title}</h1>
        <p className="text-dark-text-secondary mb-8">{description}</p>
        
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-dark-elevated rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary-red rounded-full opacity-20"></div>
          </div>
          <h3 className="text-xl font-semibold text-dark-text mb-2">Coming Soon</h3>
          <p className="text-dark-text-muted">This feature is currently under development.</p>
        </div>
      </div>
    </div>
  );
}