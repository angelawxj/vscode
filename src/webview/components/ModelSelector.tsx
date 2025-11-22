import React, { useState } from 'react';
import { Model } from '../types';

interface ModelSelectorProps {
  models: Model[];
  currentModel: Model;
  onModelChange: (model: Model) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  currentModel,
  onModelChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleModelSelect = (model: Model) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="model-selector">
      <button
        className="model-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="model-name">{currentModel.name}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
          viewBox="0 0 24 24" 
          width="16" 
          height="16"
        >
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="model-dropdown">
          {models.map((model) => (
            <div
              key={model.id}
              className={`model-option ${model.id === currentModel.id ? 'selected' : ''}`}
              onClick={() => handleModelSelect(model)}
            >
              <div className="model-info">
                <div className="model-name">{model.name}</div>
                <div className="model-description">{model.description}</div>
              </div>
              {model.id === currentModel.id && (
                <svg viewBox="0 0 24 24" width="16" height="16" className="check-icon">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};