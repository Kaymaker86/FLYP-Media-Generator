'use client';

import { useState, useCallback, useRef } from 'react';
import GenerationTab from '@/components/GenerationTab';
import HistoryPanel from '@/components/HistoryPanel';
import { getEnabledModels } from '@/lib/modelRegistry';
import { v4 as uuidv4 } from 'uuid';

interface Tab {
  id: string;
  label: string;
  initialModelId?: string;
  initialSettings?: Record<string, Record<string, string | number | boolean>>;
}

// Store for reading current tab state (model + settings) from GenerationTab
interface TabState {
  modelId: string;
  settings: Record<string, Record<string, string | number | boolean>>;
}

export default function Home() {
  const defaultModel = getEnabledModels()[0];
  const [tabs, setTabs] = useState<Tab[]>([
    { id: uuidv4(), label: defaultModel.displayName },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Track current model/settings per tab so new tabs can inherit
  const tabStatesRef = useRef<Record<string, TabState>>({});

  const addTab = useCallback(() => {
    // Inherit model and settings from the active tab
    const activeState = tabStatesRef.current[activeTabId];
    const newTab: Tab = {
      id: uuidv4(),
      label: activeState?.modelId
        ? getEnabledModels().find((m) => m.id === activeState.modelId)?.displayName || defaultModel.displayName
        : defaultModel.displayName,
      initialModelId: activeState?.modelId,
      initialSettings: activeState?.settings ? { ...activeState.settings } : undefined,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [activeTabId, defaultModel.displayName]);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const closedIdx = prev.findIndex((t) => t.id === tabId);
          const newIdx = Math.max(0, closedIdx - 1);
          setActiveTabId(filtered[newIdx].id);
        }
        return filtered;
      });
      delete tabStatesRef.current[tabId];
    },
    [activeTabId]
  );

  const updateTabLabel = useCallback((tabId: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label } : t)));
  }, []);

  const handleModelChange = useCallback(
    (tabId: string, model: { id: string; displayName: string }) => {
      updateTabLabel(tabId, model.displayName);
      if (!tabStatesRef.current[tabId]) {
        tabStatesRef.current[tabId] = { modelId: model.id, settings: {} };
      } else {
        tabStatesRef.current[tabId].modelId = model.id;
      }
    },
    [updateTabLabel]
  );

  const handleSettingsChange = useCallback(
    (tabId: string, modelId: string, settings: Record<string, string | number | boolean>) => {
      if (!tabStatesRef.current[tabId]) {
        tabStatesRef.current[tabId] = { modelId, settings: {} };
      }
      tabStatesRef.current[tabId].settings[modelId] = settings;
    },
    []
  );

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Tab bar */}
      <div className="bg-gray-900 border-b border-gray-800 flex items-center shrink-0">
        <h1 className="text-sm font-bold px-4 py-2 text-gray-400 shrink-0 hidden sm:block">
          Media Studio
        </h1>
        <div className="flex-1 flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-b-2 shrink-0 transition-colors ${
                activeTabId === tab.id
                  ? 'border-blue-500 text-white bg-gray-950'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="max-w-[120px] truncate">{tab.label}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* New tab button */}
          <button
            onClick={addTab}
            className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
            title="New tab (inherits current model & settings)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* History button */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors shrink-0 mr-2"
          title="History"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${activeTabId === tab.id ? 'z-10' : 'z-0 pointer-events-none invisible'}`}
          >
            <GenerationTab
              initialModelId={tab.initialModelId}
              initialSettings={tab.initialSettings}
              onModelChange={(model) => handleModelChange(tab.id, model)}
              onSettingsSnapshot={(modelId, s) => handleSettingsChange(tab.id, modelId, s)}
            />
          </div>
        ))}
      </div>

      {/* History panel */}
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
