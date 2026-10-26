export default function InputError({ message, className = "", ...props }) {
  return message ? (
    <p {...props} className={"ui-error " + className} role="alert">
      {message}
    </p>
  ) : null
}
