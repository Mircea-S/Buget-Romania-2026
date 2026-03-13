import { GLOSSARY } from "../data/explainers";

export default function GlossaryTerm({ id, children }) {
  const def = GLOSSARY[id];
  if (!def) return children;
  return (
    <span className="glossary-term">
      {children}
      <span className="glossary-tooltip">{def}</span>
    </span>
  );
}
