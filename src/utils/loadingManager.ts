// Loading state management for splash screen and app initialization
export class LoadingManager {
  private static instance: LoadingManager;
  private loadingSteps: string[] = [];
  private currentStep = 0;
  private isComplete = false;
  private callbacks: Array<(step: string, progress: number) => void> = [];

  private constructor() {
    this.loadingSteps = [
      'Initializing Neural Interface...',
      'Connecting to TON Genesis...',
      'Fetching Block Headers...',
      'Verifying Stake Proofs...',
      'Syncing Distributed Ledger...',
      'Loading AI Algorithms...',
      'Activating Mining Engine...',
      'Preparing Dashboard...',
      'System Ready!'
    ];
  }

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  // Add callback for progress updates
  onProgress(callback: (step: string, progress: number) => void): void {
    this.callbacks.push(callback);
  }

  // Simulate loading progress
  startLoading(): void {
    this.currentStep = 0;
    this.isComplete = false;
    
    const interval = setInterval(() => {
      if (this.currentStep < this.loadingSteps.length - 1) {
        this.currentStep++;
        const progress = (this.currentStep / (this.loadingSteps.length - 1)) * 100;
        
        this.callbacks.forEach(callback => {
          callback(this.loadingSteps[this.currentStep], progress);
        });
      } else {
        this.isComplete = true;
        clearInterval(interval);
      }
    }, 600);
  }

  // Mark specific step as complete
  completeStep(stepName: string): void {
    const stepIndex = this.loadingSteps.indexOf(stepName);
    if (stepIndex !== -1 && stepIndex > this.currentStep) {
      this.currentStep = stepIndex;
      const progress = (this.currentStep / (this.loadingSteps.length - 1)) * 100;
      
      this.callbacks.forEach(callback => {
        callback(this.loadingSteps[this.currentStep], progress);
      });
    }
  }

  // Force completion
  complete(): void {
    this.currentStep = this.loadingSteps.length - 1;
    this.isComplete = true;
    
    this.callbacks.forEach(callback => {
      callback(this.loadingSteps[this.currentStep], 100);
    });
  }

  // Check if loading is complete
  isLoadingComplete(): boolean {
    return this.isComplete;
  }

  // Get current progress
  getProgress(): { step: string; progress: number } {
    const progress = (this.currentStep / (this.loadingSteps.length - 1)) * 100;
    return {
      step: this.loadingSteps[this.currentStep],
      progress: Math.min(progress, 100)
    };
  }
}

// Export singleton instance
export const loadingManager = LoadingManager.getInstance();