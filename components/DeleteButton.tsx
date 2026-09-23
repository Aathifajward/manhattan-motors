"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Are you sure you want to delete this vehicle? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
    >
      Delete
    </button>
  );
}
