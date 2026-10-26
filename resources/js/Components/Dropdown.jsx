import { Transition } from "@headlessui/react"
import { Link } from "@inertiajs/react"
import { cloneElement, createContext, isValidElement, useContext, useState } from "react"

const DropDownContext = createContext()

const Dropdown = ({ children }) => {
  const [open, setOpen] = useState(false)

  const toggleOpen = () => {
    setOpen((previousState) => !previousState)
  }

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className="relative">{children}</div>
    </DropDownContext.Provider>
  )
}

const Trigger = ({ children }) => {
  const { open, setOpen, toggleOpen } = useContext(DropDownContext)

  if (!isValidElement(children)) {
    return null
  }

  return (
    <>
      {cloneElement(children, {
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onClick: (event) => {
          children.props.onClick?.(event)
          toggleOpen()
        },
      })}

      {open && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </>
  )
}

const Content = ({ align = "right", width = "48", contentClasses = "py-1 bg-card", children }) => {
  const { open } = useContext(DropDownContext)

  let alignmentClasses = "origin-top"

  if (align === "left") {
    alignmentClasses = "ltr:origin-top-left rtl:origin-top-right start-0"
  } else if (align === "right") {
    alignmentClasses = "ltr:origin-top-right rtl:origin-top-left end-0"
  }

  let widthClasses = ""

  if (width === "48") {
    widthClasses = "w-48"
  }

  return (
    <>
      <Transition
        show={open}
        enter="transition-opacity ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className={`absolute z-50 mt-2 overflow-hidden rounded-lg border border-border bg-card shadow-md ${alignmentClasses} ${widthClasses}`} role="menu">
          <div className={contentClasses}>{children}</div>
        </div>
      </Transition>
    </>
  )
}

const DropdownLink = ({ className = "", children, ...props }) => {
  return (
    <Link
      {...props}
      className={"flex min-h-10 w-full items-center px-3.5 py-2 text-start text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-none " + className}
      role="menuitem"
    >
      {children}
    </Link>
  )
}

Dropdown.Trigger = Trigger
Dropdown.Content = Content
Dropdown.Link = DropdownLink

export default Dropdown
