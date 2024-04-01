"use client";
import { useCounterStore } from "@/stores/counter-store";
import { Button } from "./ui/button";

export const Counter = () => {
  const count = useCounterStore((state) => state.count);
  const incrementCount = useCounterStore((state) => state.incrementCount);
  const decrementCount = useCounterStore((state) => state.decrementCount);

  console.log("Count Store: ", count);
  return (
    <div className="text-center">
      <label>Count: </label>
      {count}
      <div>
        <Button onClick={incrementCount} variant="outline">
          inc
        </Button>
        <Button onClick={decrementCount} variant="outline">
          dec
        </Button>
      </div>
    </div>
  );
};
