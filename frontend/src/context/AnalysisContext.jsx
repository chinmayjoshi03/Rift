import React, { createContext, useReducer } from 'react';

// Define the initial state based on your requirements
const initialState = {
  jobId: null,
  status: 'IDLE', // IDLE, UPLOADING, PROCESSING, COMPLETE, ERROR
  progress: 0, // 0-100
  results: null, // Will store the final JSON output
  selectedNode: null, // For the explainability panel
  threshold: 50, // Risk threshold slider value
  config: {
    preset: 'balanced',
    min_score: 0.3,
    enable_validation: true
  }, // Detection configuration
};

// Reducer function to handle state updates
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_JOB_ID':
      return { ...state, jobId: action.payload, status: 'PROCESSING', progress: 0, results: null };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload, status: 'COMPLETE', progress: 100 };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    case 'SET_THRESHOLD':
      return { ...state, threshold: action.payload };
    case 'RESET_ANALYSIS':
      return { ...initialState, threshold: state.threshold, config: state.config }; // Keep threshold and config
    default:
      return state;
  }
};

// Create the context
export const AnalysisContext = createContext();

// Create the provider component
export const AnalysisProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AnalysisContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalysisContext.Provider>
  );
};