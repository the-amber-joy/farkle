import * as Accordion from "@radix-ui/react-accordion";
import { useRef, useState } from "react";
import { SCORING_OPTIONS } from "../constants/scoring";
import ScoreButton from "./ScoreButton";
import "./ScoringPanel.css";

/**
 * ScoringPanel - Displays all scoring options grouped by category
 * using Radix UI Accordion for smooth animations and accessibility
 */
export default function ScoringPanel({ onScore }) {
  const itemRefs = useRef({});
  const inputRef = useRef(null);
  const [customInput, setCustomInput] = useState("");

  const handleValueChange = (value) => {
    if (value && itemRefs.current[value]) {
      // Wait for animation to start, then scroll into view
      setTimeout(() => {
        itemRefs.current[value]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // Focus input when Custom section opens
        if (value === "custom") {
          inputRef.current?.focus();
        }
      }, 50);
    }
  };

  const handleCustomSubmit = () => {
    const points = parseInt(customInput, 10);
    if (!isNaN(points) && points > 0) {
      onScore(points);
      setCustomInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <Accordion.Root
      type="single"
      defaultValue="singles"
      collapsible
      className="scoring-panel"
      onValueChange={handleValueChange}
    >
      {Object.entries(SCORING_OPTIONS).map(([key, category]) => (
        <Accordion.Item
          key={key}
          value={key}
          className="scoring-panel__item"
          ref={(el) => (itemRefs.current[key] = el)}
        >
          <Accordion.Header className="scoring-panel__header">
            <Accordion.Trigger className="scoring-panel__trigger">
              <span className="scoring-panel__title">{category.label}</span>
              <span className="scoring-panel__chevron" aria-hidden>
                ›
              </span>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="scoring-panel__content">
            <div className="scoring-panel__options">
              {category.options.map((option) => (
                <ScoreButton
                  key={option.id}
                  dice={option.dice}
                  label={option.label}
                  points={option.points}
                  onClick={onScore}
                />
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}

      {/* Custom score input */}
      <Accordion.Item
        value="custom"
        className="scoring-panel__item"
        ref={(el) => (itemRefs.current["custom"] = el)}
      >
        <Accordion.Header className="scoring-panel__header">
          <Accordion.Trigger className="scoring-panel__trigger">
            <span className="scoring-panel__title">Custom Score</span>
            <span className="scoring-panel__chevron" aria-hidden>
              ›
            </span>
          </Accordion.Trigger>
        </Accordion.Header>

        <Accordion.Content className="scoring-panel__content">
          <div className="scoring-panel__custom">
            <input
              ref={inputRef}
              type="number"
              min="1"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter points"
              className="scoring-panel__custom-input"
            />
            <button
              onClick={handleCustomSubmit}
              className="scoring-panel__custom-btn"
              disabled={!customInput || parseInt(customInput, 10) <= 0}
            >
              Add
            </button>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
