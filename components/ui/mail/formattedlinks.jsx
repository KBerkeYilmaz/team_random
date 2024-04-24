import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// TODO: Not complete yet, links include https and "<" and ">" characters. Need to update regex function.

function FormattedLinks(text) {
  const urlRegex =
    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Go to Link
            </a>
          </TooltipTrigger>
          <TooltipContent className="max-w-40 truncate">{part}</TooltipContent>
        </Tooltip>
      );
    }
    return part;
  });
}

export default FormattedLinks;
