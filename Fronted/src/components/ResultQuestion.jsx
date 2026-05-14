import React from "react";

export default function ResultQuestion({ question, muted = false }) {
  return (
    <section className={`question-result ${muted ? "muted-result" : ""}`}>
      <div className="question-title">
        <h3>{question.questionText}</h3>
        <span>{question.totalResponses} votes</span>
      </div>
      {question.options.map((option) => (
        <div className="bar-row" key={option.id}>
          <div className="bar-label">
            <span>{option.optionText}</span>
            <strong>{muted ? "--" : option.responseCount}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: muted ? "0%" : `${option.percentage}%` }} />
          </div>
          <small>{muted ? "--" : `${option.percentage}%`}</small>
        </div>
      ))}
    </section>
  );
}
