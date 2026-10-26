export default function InputLabel({ value, className = "", children, ...props }) {
  return (
    <label {...props} className={`ui-label block ` + className}>
      {value ? value : children}
    </label>
  )
}
