import { Loader2 } from "lucide-react";

const loading = () => {
  return (
    <div className="-mt-[60px] flex h-screen  w-full items-center justify-center">
      <Loader2 className=" animate-spin" />
    </div>
  );
};

export default loading;
