import React from "react";

export default function StatsGrid({ stats }) {
  return (
    <section className="stats-grid">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <span>{stat.icon}</span>
          <small>{stat.label}</small>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}
