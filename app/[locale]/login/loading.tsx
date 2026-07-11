import { Loader2 } from "lucide-react";

const loading = () => {
  return (
    <div className="z-50 flex h-screen w-full items-center justify-center">
      <Loader2 className="mr-2 w-1/2 animate-spin" />
    </div>
  );
};

export default loading;
