import { create } from "zustand";

// Define the initial state based on your example data
import { Mail, mails } from "@app/[locale]/(dashboard)/dashboard/messages/data.jsx";

// Create the Zustand store
const useMailStore = create((set) => ({
  selected: mails[0].id, // Initialize with the first mail's id as selected

  // Function to update the selected mail
  selectMail: (id) => set({ selected: id }),
}));

export default useMailStore;
