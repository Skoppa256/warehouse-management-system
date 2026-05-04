import Input from "../ui/input";

export default function FormField({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium">{label}</label>
      <Input {...props} />
    </div>
  );
}
