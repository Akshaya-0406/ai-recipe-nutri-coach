import React from "react";

function SavedRecipes({ saved, onSelect }) {
  if (!saved || saved.length === 0) {
    return <div className="card">No saved recipes yet.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Saved Recipes</h2>

      {saved.map((r) => (
        <div
          key={r.id}
          className="card mb-4 cursor-pointer"
          onClick={() => onSelect(r)}
        >
          <h3 className="text-lg font-semibold">{r.title}</h3>
          <p>{r.description}</p>
          <p className="text-sm text-gray-600 mt-2">
            {r.nutrition.calories} calories • {r.nutrition.protein_g}g protein
          </p>
        </div>
      ))}
    </div>
  );
}

export default SavedRecipes;
