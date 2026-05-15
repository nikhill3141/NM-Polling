import React from "react";

export default function BrandName({ compact = false }) {
  return (
    <button className={`brand-name ${compact ? "compact" : ""}`} type="button" aria-label="NM Polling" >
      <span>NM</span>
      <p>POLL</p>
    </button>
  );
}
