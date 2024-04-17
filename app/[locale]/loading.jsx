import { Loader2 } from "lucide-react";

const loading = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center z-50">
      <Loader2 className="mr-2 w-1/2 animate-spin" />
    </div>
  );
};

export default loading;
