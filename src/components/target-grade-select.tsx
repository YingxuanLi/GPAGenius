import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./ui/select";

interface TargetGradeSelectProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export default function TargetGradeSelect({
  selectedValue,
  onValueChange,
}: TargetGradeSelectProps) {

  const options = [
    {
      value: "0",
      shortLabel: "1",
      longLabel: "1 (0-19%)",
    },
    {
      value: "20",
      shortLabel: "2",
      longLabel: "2 (20-44%)",
    },
    {
      value: "45",
      shortLabel: "3",
      longLabel: "3 (45-49%)",
    },
    {
      value: "50",
      shortLabel: "4",
      longLabel: "4 (50-64%)",
    },
    {
      value: "65",
      shortLabel: "5",
      longLabel: "5 (65-74%)",
    },
    {
      value: "75",
      shortLabel: "6",
      longLabel: "6 (75-84%)",
    },
    {
      value: "85",
      shortLabel: "7",
      longLabel: "7 (85-100%)",
    },
  ];

  const getShortLabel = (value: string) => {
    return options.find((option) => option.value === value)?.shortLabel || "";
  };

  return (
    <Select
      defaultValue={"50"}
      value={selectedValue}
      onValueChange={onValueChange}
    >
      <SelectValue placeholder="Target Grade" />
      <SelectTrigger className="w-15">
        <SelectValue placeholder="Select an option">
          {getShortLabel(selectedValue)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Target Grade</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.longLabel}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
