"use client";

import { useEffect, useState } from "react";

export default function CounterNumber({ num }) {
  const [number, setNumber] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
    const totalNumber = num;
    let counter = 0;
    const step = Math.ceil(totalNumber / 100);

    const timer = setInterval(() => {
      counter = Math.min(counter + step, totalNumber);
      setNumber(counter);

      if (counter >= totalNumber) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        number ? "opacity-100" : "opacity-0"
      } `}
    >
      {number}
    </div>
  );
}
