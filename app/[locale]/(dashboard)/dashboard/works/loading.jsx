import { Loader2 } from "lucide-react";

const loading = () => {
  return (
    <div className="w-full h-screen -mt-[60px] flex justify-center items-center">
      <Loader2 className=" animate-spin" />
    </div>
  );
};

export default loading;
