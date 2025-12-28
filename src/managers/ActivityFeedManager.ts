import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, FormattedActivity, ActivityType } from '@/types/depositSync';
import { ArrowUpRight, ArrowDownRight, Sparkles, Gift, Coins } from 'lucide-react';
import { logger } from '@/utils/logger';

export class ActivityFeedManager {
  private activities: Activity[] = [];
  private subscribers: Set<(activities: FormattedActivity[]) => void> = new Set();
  private isLoading = false;

  constructor(private userId: number) {}

  // Subscribe to activity updates
  subscribe(callback: (activities: FormattedActivity[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Send current activities immediately
    const formatted = this.activities.map(activity => this.formatActivity(activity));
    callback(formatted);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Load activities from database
  async loadActivities(limit: number = 10): Promise<Activity[]> {
    try {
      this.isLoading = true;
      this.notifySubscribers();

      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Sort activities chronologically (most recent first)
      const sortedActivities = (activities || []).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Remove duplicates based on ID
      this.activities = this.deduplicateActivities(sortedActivities);
      
      this.isLoading = false;
      this.notifySubscribers();

      logger.success(`Loaded ${this.activities.length} activities`);
      return this.activities;

    } catch (error) {
      console.error('❌ Failed to load activities:', error);
      this.isLoading = false;
      this.notifySubscribers();
      throw error;
    }
  }

  // Add new activity (from real-time updates)
  addActivity(activity: Activity): void {
    // Check for duplicates
    const exists = this.activities.some(a => a.id === activity.id);
    if (exists) {
      logger.update('Activity already exists, skipping:', activity.id);
      return;
    }

    // Add to beginning of array (most recent first)
    this.activities = [activity, ...this.activities];
    
    // Keep only the most recent 10 activities
    if (this.activities.length > 10) {
      this.activities = this.activities.slice(0, 10);
    }

    logger.activity('New activity added:', activity.type, activity.amount);
    this.notifySubscribers();
  }

  // Format activity for display
  formatActivity(activity: Activity): FormattedActivity {
    const amount = Number(activity.amount);
    const formattedAmount = amount > 0 ? `+${amount.toFixed(4)}` : amount.toFixed(4);
    
    return {
      id: activity.id,
      type: activity.type,
      amount: activity.amount.toString(),
      formattedAmount: `${formattedAmount} TON`,
      timestamp: activity.created_at,
      relativeTime: this.formatRelativeTime(activity.created_at),
      status: activity.status || 'completed',
      icon: this.getActivityIcon(activity.type),
      color: this.getActivityColor(activity.type)
    };
  }

  // Get icon for activity type
  private getActivityIcon(type: ActivityType): React.ReactNode {
    switch (type) {
      case 'deposit':
      case 'top_up':
      case 'stake':
        return React.createElement(ArrowDownRight, { size: 12, className: "text-green-500" });
      case 'withdrawal':
        return React.createElement(ArrowUpRight, { size: 12, className: "text-red-500" });
      case 'claim':
      case 'reward':
      case 'earnings_update':
        return React.createElement(Sparkles, { size: 12, className: "text-blue-500" });
      case 'nova_reward':
      case 'nova_income':
      case 'bonus':
        return React.createElement(Gift, { size: 12, className: "text-purple-500" });
      default:
        return React.createElement(Coins, { size: 12, className: "text-slate-400" });
    }
  }

  // Get color for activity type
  private getActivityColor(type: ActivityType): string {
    switch (type) {
      case 'deposit':
      case 'top_up':
      case 'stake':
        return 'text-green-500';
      case 'withdrawal':
        return 'text-red-500';
      case 'claim':
      case 'reward':
      case 'earnings_update':
        return 'text-blue-500';
      case 'nova_reward':
      case 'nova_income':
      case 'bonus':
        return 'text-purple-500';
      default:
        return 'text-slate-400';
    }
  }

  // Format relative time
  private formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Remove duplicate activities
  private deduplicateActivities(activities: Activity[]): Activity[] {
    const seen = new Set<string>();
    return activities.filter(activity => {
      if (seen.has(activity.id)) {
        return false;
      }
      seen.add(activity.id);
      return true;
    });
  }

  // Notify all subscribers
  private notifySubscribers(): void {
    const formatted = this.activities.map(activity => this.formatActivity(activity));
    this.subscribers.forEach(callback => {
      try {
        callback(formatted);
      } catch (error) {
        console.error('Error in activity subscriber callback:', error);
      }
    });
  }

  // Validate activity data integrity
  validateActivityData(activity: Activity): boolean {
    // Check required fields
    if (!activity.id || !activity.user_id || !activity.type || !activity.created_at) {
      console.warn('❌ Activity missing required fields:', activity);
      return false;
    }

    // Check amount is a valid number
    if (typeof activity.amount !== 'number' || isNaN(activity.amount)) {
      console.warn('❌ Activity has invalid amount:', activity);
      return false;
    }

    // Check timestamp is valid
    const timestamp = new Date(activity.created_at);
    if (isNaN(timestamp.getTime())) {
      console.warn('❌ Activity has invalid timestamp:', activity);
      return false;
    }

    // Check timestamp is not in the future (with 1 minute tolerance)
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000);
    if (timestamp > oneMinuteFromNow) {
      console.warn('❌ Activity timestamp is in the future:', activity);
      return false;
    }

    return true;
  }

  // Get current activities count
  getActivitiesCount(): number {
    return this.activities.length;
  }

  // Check if loading
  getIsLoading(): boolean {
    return this.isLoading;
  }

  // Clear all activities
  clear(): void {
    this.activities = [];
    this.notifySubscribers();
  }

  // Cleanup
  cleanup(): void {
    this.subscribers.clear();
    this.activities = [];
  }
}