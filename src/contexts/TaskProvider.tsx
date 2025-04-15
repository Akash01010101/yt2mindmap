"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type TaskContextType = {
  taskId: string;
  setTaskId: React.Dispatch<React.SetStateAction<string>>;
  currentLoadingStep: string;
  setCurrentLoadingStep: React.Dispatch<React.SetStateAction<string>>;
  loadingMessages: string[];
  messageIndex: number;
  setMessageIndex: React.Dispatch<React.SetStateAction<number>>;
  checkTaskStatus: (taskId: string, maxRetries?: number, interval?: number) => Promise<any>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState('');
  const [currentLoadingStep, setCurrentLoadingStep] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const loadingMessages = [
    'Processing video transcript...',
    'Analyzing content structure...',
    'Generating mindmap layout...',
    'Optimizing node connections...',
    'Applying visual styles...',
    'Finalizing mindmap...'
  ];

  const checkTaskStatus = async (taskId: string, maxRetries = 20, interval = 5000) => {
    let attempts = 0;
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 10000);

    while (attempts < maxRetries) {
      try {
        const res = await fetch(`/api/webhook?taskId=${taskId}`);
        const data = await res.json();
        setCurrentLoadingStep(data.status);
        console.log(data);
        if (data.task.status == 'complete') {
          clearInterval(messageInterval);
          return data.data;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        console.error("Error checking task status:", error);
        clearInterval(messageInterval);
      }
    }
    console.error("Task polling timed out.");
    clearInterval(messageInterval);
  };

  return (
    <TaskContext.Provider value={{
      taskId, 
      setTaskId,
      currentLoadingStep, 
      setCurrentLoadingStep,
      loadingMessages,
      messageIndex, 
      setMessageIndex,
      checkTaskStatus
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}