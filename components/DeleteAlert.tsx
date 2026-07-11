import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import type { Dispatch, SetStateAction } from "react";

interface DeleteAlertProps {
  open: boolean;
  // Parent passes its `useState` setter straight through to Radix `onOpenChange`,
  // so model it as the dispatch type (accepts both `setOpen(false)` and updaters).
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleDelete: () => void;
}

export const DeleteAlert = ({
  open,
  setOpen,
  handleDelete,
}: DeleteAlertProps) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the data
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete}>
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
