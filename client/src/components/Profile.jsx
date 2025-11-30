import React from "react";

function Profile({ profile, setProfile }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Your Food Preferences</h2>

      <label>Diet Type</label>
      <select
        value={profile.diet}
        onChange={(e) => setProfile({ ...profile, diet: e.target.value })}
        className="input mt-2"
      >
        <option value="vegetarian">Vegetarian</option>
        <option value="non_veg">Non-Veg</option>
        <option value="vegan">Vegan</option>
      </select>

      <label className="mt-4 block">Allergies</label>
      <input
        type="text"
        value={profile.allergies}
        placeholder="Peanuts, milk..."
        onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
        className="input mt-2"
      />

      <label className="mt-4 block">Health Goal</label>
      <select
        value={profile.goal}
        onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
        className="input mt-2"
      >
        <option value="pcos_friendly">PCOS-Friendly</option>
        <option value="weight_loss">Weight Loss</option>
        <option value="high_protein">High-Protein</option>
        <option value="balanced">Balanced</option>
      </select>

      <p className="text-sm text-gray-500 mt-4">
        Your preferences are used to generate smarter recipes ❤️
      </p>
    </div>
  );
}

export default Profile;
