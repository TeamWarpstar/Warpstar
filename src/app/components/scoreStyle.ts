export function scoreStyle(s: number): { bg: string; text: string } {
  if (s < 1)   return { bg: "bg-black",     text: "text-red-500"   };
  if (s < 3)   return { bg: "bg-red-600",   text: "text-[#ffffff]" };
  if (s < 5)   return { bg: "bg-orange-500",text: "text-[#ffffff]" };
  if (s < 6)   return { bg: "bg-yellow-400",text: "text-[#ffffff]" };
  if (s < 7)   return { bg: "bg-lime-500",  text: "text-[#ffffff]" };
  if (s < 8.5) return { bg: "bg-green-500", text: "text-[#ffffff]" };
  if (s < 9.5) return { bg: "bg-green-800", text: "text-[#ffffff]" };
  return             { bg: "bg-blue-600",   text: "text-[#ffffff]" };
}
