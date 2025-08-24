// Export all lazy-loaded demo components from a single entry point
// This helps with tree-shaking and bundle optimization

export {
  // Individual lazy components
  LazyAIChatDemo,
  LazySEOAnalysisDemo,
  LazyVideoAgentDemo,
  LazyROICalculator,
  LazyPerformanceDashboard,
  
  // Components with built-in loaders
  AIChatDemoWithLoader,
  SEOAnalysisDemoWithLoader,
  VideoAgentDemoWithLoader,
  ROICalculatorWithLoader,
  PerformanceDashboardWithLoader
} from './lazy-demos'