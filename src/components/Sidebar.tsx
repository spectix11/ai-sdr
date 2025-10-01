import React from 'react';
import { BarChart3, Users, Rocket, MessageSquare, Calendar, Target } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'lead-generation', label: 'Generate Leads', icon: Target },
  { id: 'leads', label: 'All Leads', icon: Users },
  { id: 'campaigns', label: 'Active Campaigns', icon: Rocket },
  { id: 'replies', label: 'Replies & Engagement', icon: MessageSquare },
  { id: 'meetings', label: 'Booked Meetings', icon: Calendar },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="w-full sm:w-80 lg:w-64 bg-dark-surface border-r border-dark-border h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-4 sm:p-6 lg:p-4 border-b border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 bg-primary-red rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-dark-text font-semibold text-lg sm:text-xl lg:text-lg">Vertical Systems</h1>
            <p className="text-dark-text-muted text-sm sm:text-base lg:text-sm">Pipeline</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 sm:p-6 lg:p-4 overflow-y-auto">
        <ul className="space-y-2 sm:space-y-3 lg:space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-4 lg:py-3 rounded-lg text-left transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-red text-white shadow-lg'
                      : 'text-dark-text hover:bg-dark-elevated hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5" />
                  <span className="font-medium text-sm sm:text-base lg:text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 sm:p-6 lg:p-4 border-t border-dark-border">
        <div className="text-center">
          <p className="text-dark-text-muted text-xs sm:text-sm lg:text-xs">
            © 2025 Vertical Systems
          </p>
        </div>
      </div>
    </div>
  );
}