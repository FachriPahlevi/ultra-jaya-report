export default function Checkbox({ className = "", ...props }) {
  return (
    <input {...props} type="checkbox" className={"h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 " + className} />
  )
}
