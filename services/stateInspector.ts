import { AppState } from '../types';

type StateChangeListener = (path: string, oldValue: any, newValue: any) => void;

class StateInspector {
  private listeners: StateChangeListener[] = [];
  private state: AppState;
  private stateHistory: { timestamp: Date; path: string; oldValue: any; newValue: any }[] = [];
  private isInspecting = false;

  constructor() {
    this.state = this.getInitialState();
  }

  subscribe(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isInspecting) {
      this.startInspecting();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopInspecting();
      }
    };
  }

  getState(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getStateHistory(): typeof this.stateHistory {
    return [...this.stateHistory];
  }

  clearHistory(): void {
    this.stateHistory = [];
  }

  updateState(path: string, newValue: any): void {
    const oldValue = this.getValueByPath(path);
    this.setValueByPath(path, newValue);
    
    this.recordStateChange(path, oldValue, newValue);
    this.notifyListeners(path, oldValue, newValue);
  }

  private getInitialState(): AppState {
    return {
      user: {
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
          autoPost: false
        }
      },
      posts: [],
      conversations: [],
      transactions: [],
      networkRequests: [],
      contractExecutions: [],
      settings: {
        apiKeys: {
          gemini: '***hidden***',
          social: '***hidden***'
        },
        features: {
          debugMode: true,
          analytics: true,
          autoModeration: false
        }
      }
    };
  }

  private startInspecting(): void {
    this.isInspecting = true;
    
    // Simulate state changes
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.simulateStateChange();
      }
    }, 5000);
  }

  private stopInspecting(): void {
    this.isInspecting = false;
  }

  private simulateStateChange(): void {
    const changes = [
      () => this.updateState('user.preferences.notifications', !this.state.user.preferences.notifications),
      () => this.updateState('settings.features.debugMode', !this.state.settings.features.debugMode),
      () => this.updateState('user.name', `User ${Math.floor(Math.random() * 1000)}`),
      () => {
        const newPost = {
          id: `post_${Date.now()}`,
          platform: 'instagram' as const,
          content: 'New simulated post',
          date: new Date(),
          status: 'draft' as const
        };
        this.state.posts.unshift(newPost);
        this.recordStateChange('posts', [], [newPost, ...this.state.posts]);
        this.notifyListeners('posts', [], this.state.posts);
      }
    ];
    
    const change = changes[Math.floor(Math.random() * changes.length)];
    change();
  }

  private getValueByPath(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  private setValueByPath(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state as any);
    
    target[lastKey] = value;
  }

  private recordStateChange(path: string, oldValue: any, newValue: any): void {
    this.stateHistory.unshift({
      timestamp: new Date(),
      path,
      oldValue: JSON.parse(JSON.stringify(oldValue)),
      newValue: JSON.parse(JSON.stringify(newValue))
    });
    
    // Keep only last 100 changes
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(0, 100);
    }
  }

  private notifyListeners(path: string, oldValue: any, newValue: any): void {
    this.listeners.forEach(listener => listener(path, oldValue, newValue));
  }

  // Utility methods for debugging
  searchState(query: string): Array<{ path: string; value: any }> {
    const results: Array<{ path: string; value: any }> = [];
    
    const search = (obj: any, currentPath: string = '') => {
      for (const key in obj) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        const value = obj[key];
        
        if (key.toLowerCase().includes(query.toLowerCase()) || 
            (typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase()))) {
          results.push({ path, value });
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          search(value, path);
        }
      }
    };
    
    search(this.state);
    return results;
  }

  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importState(stateJson: string): boolean {
    try {
      const newState = JSON.parse(stateJson);
      const oldState = this.state;
      this.state = newState;
      
      this.recordStateChange('*', oldState, newState);
      this.notifyListeners('*', oldState, newState);
      
      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  }
}

export const stateInspector = new StateInspector();